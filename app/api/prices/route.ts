import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

// ── Module-level memory cache (survives between warm invocations) ─────────────
const lastKnownPrices: Record<string, number> = {};

// ── CoinGecko rate-limit guard ────────────────────────────────────────────────
// Minimum 30 s between real CoinGecko hits, regardless of how often the client
// polls. Requests that arrive within the window are served from memory.
const COINGECKO_MIN_INTERVAL_MS = 30_000;
const coingeckoCache = new Map<string, {
  data: Array<Record<string, unknown>>;
  fetchedAt: number;
}>();

// ── Static metadata for fallback response objects ─────────────────────────────
// Clients expect: id, symbol, name, current_price, price_change_percentage_24h
const COIN_META: Record<string, { symbol: string; name: string }> = {
  bitcoin:          { symbol: 'btc',   name: 'Bitcoin'     },
  ethereum:         { symbol: 'eth',   name: 'Ethereum'    },
  tether:           { symbol: 'usdt',  name: 'Tether'      },
  binancecoin:      { symbol: 'bnb',   name: 'BNB'         },
  solana:           { symbol: 'sol',   name: 'Solana'      },
  'usd-coin':       { symbol: 'usdc',  name: 'USD Coin'    },
  cardano:          { symbol: 'ada',   name: 'Cardano'     },
  'matic-network':  { symbol: 'matic', name: 'Polygon'     },
  avalanche:        { symbol: 'avax',  name: 'Avalanche'   },
  polkadot:         { symbol: 'dot',   name: 'Polkadot'    },
  dogecoin:         { symbol: 'doge',  name: 'Dogecoin'    },
  ripple:           { symbol: 'xrp',   name: 'XRP'         },
};

// CoinGecko id → Binance spot symbol (USDT-quoted)
const BINANCE_PAIR: Record<string, string> = {
  bitcoin:         'BTCUSDT',
  ethereum:        'ETHUSDT',
  solana:          'SOLUSDT',
  binancecoin:     'BNBUSDT',
  cardano:         'ADAUSDT',
  'matic-network': 'MATICUSDT',
  avalanche:       'AVAXUSDT',
  polkadot:        'DOTUSDT',
  dogecoin:        'DOGEUSDT',
  ripple:          'XRPUSDT',
};

// Stablecoins whose price is reliably $1.00 — no need to hit any API
const STABLECOIN_IDS = new Set(['tether', 'usd-coin', 'true-usd', 'dai', 'busd', 'frax']);

// CryptoCompare base symbol (coingecko id → fsym)
const CC_FSYM: Record<string, string> = {
  bitcoin:         'BTC',
  ethereum:        'ETH',
  solana:          'SOL',
  binancecoin:     'BNB',
  cardano:         'ADA',
  'matic-network': 'MATIC',
  avalanche:       'AVAX',
  polkadot:        'DOT',
  dogecoin:        'DOGE',
  ripple:          'XRP',
};

// ── Individual price fetchers ─────────────────────────────────────────────────

/** Binance spot price — 2 s timeout (Binance is blocked in some regions). */
async function fetchBinancePrice(binancePair: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${binancePair}`,
      { cache: 'no-store', signal: AbortSignal.timeout(2000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const price = parseFloat(data.price);
    return price > 0 ? price : null;
  } catch {
    return null;
  }
}

/** CryptoCompare single-price endpoint — 5 s timeout. */
async function fetchCryptoComparePrice(fsym: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://min-api.cryptocompare.com/data/price?fsym=${fsym}&tsyms=USD`,
      { cache: 'no-store', signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const price = Number(data?.USD);
    return price > 0 ? price : null;
  } catch {
    return null;
  }
}

/**
 * Resolve price for one coin when CoinGecko is unavailable.
 * Priority:
 *   stablecoins → $1.00 immediately
 *   others      → Binance → CryptoCompare → last known memory
 */
async function resolveFallbackPrice(
  id: string,
): Promise<{ price: number; source: string } | null> {
  // Tier A — stablecoin hardcode
  if (STABLECOIN_IDS.has(id)) {
    return { price: 1.00, source: 'hardcoded-stablecoin' };
  }

  // Tier B — Binance
  const binancePair = BINANCE_PAIR[id];
  if (binancePair) {
    const binancePrice = await fetchBinancePrice(binancePair);
    if (binancePrice !== null) {
      console.log(`✓ [Binance fallback] ${id}: $${binancePrice}`);
      return { price: binancePrice, source: 'binance' };
    }
  }

  // Tier C — CryptoCompare
  const fsym = CC_FSYM[id];
  if (fsym) {
    const ccPrice = await fetchCryptoComparePrice(fsym);
    if (ccPrice !== null) {
      console.log(`✓ [CryptoCompare fallback] ${id}: $${ccPrice}`);
      return { price: ccPrice, source: 'cryptocompare' };
    }
  }

  // Tier D — last known memory
  const cached = lastKnownPrices[id];
  if (cached && cached > 0) {
    console.warn(`⚠ [Memory fallback] ${id}: $${cached}`);
    return { price: cached, source: 'memory-cache' };
  }

  return null; // no price available — coin omitted from response
}

/** Build a response object shaped like a CoinGecko market entry. */
function makeFallbackEntry(
  id: string,
  price: number,
  source: string,
): Record<string, unknown> {
  const meta = COIN_META[id] ?? { symbol: id, name: id };
  return {
    id,
    symbol: meta.symbol,
    name:   meta.name,
    current_price: price,
    price_change_percentage_24h: null,
    market_cap: null,
    total_volume: null,
    _priceSource: source,
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idsParam  = searchParams.get('ids');
  const coinIds   = idsParam || 'bitcoin,ethereum,tether,binancecoin,solana';
  const idList    = coinIds.split(',').map((s) => s.trim()).filter(Boolean);

  // ── Tier 1: CoinGecko batch fetch (throttled to 30 s) ────────────────────
  // If the same coin-set was fetched recently, skip CoinGecko and return the
  // cached response immediately. This prevents dozens of 429s per minute when
  // the dashboard polls on every render.
  const cached = coingeckoCache.get(coinIds);
  if (cached && (Date.now() - cached.fetchedAt) < COINGECKO_MIN_INTERVAL_MS) {
    const age = Math.round((Date.now() - cached.fetchedAt) / 1000);
    console.log(`[Prices] CoinGecko cache hit (${age}s old) — skipping network call`);
    return NextResponse.json(cached.data, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  }

  try {
    const url =
      `${COINGECKO_API_BASE}/coins/markets` +
      `?vs_currency=usd&ids=${coinIds}` +
      `&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: Array<Record<string, unknown>> = await response.json();

    // Update memory cache with fresh CoinGecko prices
    for (const coin of data) {
      const id    = coin.id as string;
      const price = coin.current_price as number;
      if (id && price > 0) {
        lastKnownPrices[id] = price;
      }
    }

    // Cache ETH price to Firestore for /api/wallet fallback
    const ethCoin = data.find((c) => c.id === 'ethereum');
    if (adminDb && ethCoin && (ethCoin.current_price as number) > 0) {
      adminDb.collection('prices').doc('ETH').set({
        priceUsd:  ethCoin.current_price,
        updatedAt: new Date(),
      }).catch((err: unknown) =>
        console.error('Failed to cache ETH price to Firestore:', err),
      );
    }

    // Store in throttle cache so the next N requests within 30 s are free
    coingeckoCache.set(coinIds, { data, fetchedAt: Date.now() });

    console.log(`✓ [CoinGecko] prices fetched for: ${idList.join(', ')}`);

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });

  } catch (cgError) {
    console.warn(
      '[Prices] CoinGecko failed, engaging fallback chain:',
      cgError instanceof Error ? cgError.message : cgError,
    );
  }

  // ── Tier 2: Per-coin fallback (Binance → CryptoCompare → memory → $1) ────
  const fallbackResults = await Promise.all(
    idList.map(async (id) => {
      const resolved = await resolveFallbackPrice(id);
      if (!resolved) {
        console.warn(`[Prices] No fallback price available for: ${id}`);
        return null;
      }
      // Update memory cache
      lastKnownPrices[id] = resolved.price;
      return makeFallbackEntry(id, resolved.price, resolved.source);
    }),
  );

  const fallbackData = fallbackResults.filter(Boolean);

  if (fallbackData.length === 0) {
    console.error('[Prices] All price sources failed for all requested coins.');
    return NextResponse.json(
      { error: 'Failed to fetch cryptocurrency prices', details: 'All price sources unavailable' },
      { status: 502 },
    );
  }

  console.log(
    `[Prices] Fallback resolved ${fallbackData.length}/${idList.length} coins: ` +
    fallbackData.map((c) => `${(c as any).id}=$${(c as any).current_price}`).join(', '),
  );

  return NextResponse.json(fallbackData, {
    headers: { 'Cache-Control': 'no-store' }, // don't cache partial fallback data
  });
}
