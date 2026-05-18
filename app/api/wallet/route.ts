import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { adminDb } from '@/lib/firebase/admin';

// balanceOf(address) selector — keccak256("balanceOf(address)")[0:4]
const BALANCE_OF_SELECTOR = '0x70a08231';

// Module-level cache for last known ETH price
let lastKnownEthPrice = 0;
const DEBUG_ENDPOINT = 'http://127.0.0.1:7373/ingest/82684194-a1d7-4727-9637-324b6d91e3e7';
const DEBUG_SESSION_ID = '727dcd';

function debugLog(
  runId: string,
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>
) {
  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': DEBUG_SESSION_ID,
    },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION_ID,
      runId,
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => { });
  // #endregion
}

export async function GET(request: NextRequest) {
  try {
    // Get address from query params
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const runId = searchParams.get('debugRunId') || 'wallet-initial';

    // Validate address
    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    if (!ethers.isAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address' },
        { status: 400 }
      );
    }

    // ── Direct Alchemy JSON-RPC (no JsonRpcProvider) ──────────────────────
    // ethers.JsonRpcProvider auto-detects the network and retries every 1 s
    // when detection fails, flooding the terminal.  A plain fetch to the same
    // Alchemy HTTP endpoint does the same thing without any polling loop.
    const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
    if (!ALCHEMY_API_KEY) {
      return NextResponse.json(
        { error: 'Alchemy API key not configured' },
        { status: 500 }
      );
    }
    const ALCHEMY_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

    const USDT_ADDRESS = process.env.USDT_CONTRACT_ADDRESS ||
      '0xdAC17F958D2ee523a2206206994597C13D831ec7';

    /** Single JSON-RPC call — max 2 attempts, no infinite retry loop. */
    async function rpc(method: string, params: unknown[]): Promise<string> {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await fetch(ALCHEMY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (json.error) throw new Error(json.error.message ?? 'RPC error');
          return json.result as string;
        } catch (err) {
          if (attempt === 2) throw err;
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      throw new Error('unreachable');
    }

    // eth_getBalance → hex wei, formatEther converts to decimal string
    const ethBalanceHex = await rpc('eth_getBalance', [address, 'latest']);
    const ethBalance = ethers.formatEther(BigInt(ethBalanceHex));

    // eth_call balanceOf(address) on USDT contract (6 decimals)
    const paddedAddr = address.toLowerCase().replace('0x', '').padStart(64, '0');
    const usdtHex = await rpc('eth_call', [
      { to: USDT_ADDRESS, data: BALANCE_OF_SELECTOR + paddedAddr },
      'latest',
    ]);
    const usdtBalance = (BigInt(usdtHex) / 10n ** 6n).toString();

    console.log('Blockchain read success:', { address, ethBalance, usdtBalance });

    // Fetch current prices from CoinGecko with multi-tier fallback
    let ethPrice = 0;
    let usdtPrice = 1; // USDT is always ~$1
    let coinGeckoStatus = -1;
    let coinGeckoBodyEth = 0;
    let firestoreFallbackTried = false;
    let firestoreFallbackError = '';
    let priceSource = 'none';

    // Tier 1: Try CoinGecko API
    try {
      const priceResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
        {
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        }
      );
      coinGeckoStatus = priceResponse.status;
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        ethPrice = priceData.ethereum?.usd || 0;
        coinGeckoBodyEth = ethPrice;

        if (ethPrice > 0) {
          console.log('✓ ETH price fetched from CoinGecko:', ethPrice);
          lastKnownEthPrice = ethPrice; // Update cache
          priceSource = 'coingecko';
        }
      } else {
        console.warn(`CoinGecko API returned ${priceResponse.status}: ${priceResponse.statusText}`);
      }
    } catch (priceError) {
      console.warn('CoinGecko API failed:', priceError instanceof Error ? priceError.message : priceError);
    }

    // Tier 2: If CoinGecko failed, try Coinbase public spot API (no auth needed)
    if (ethPrice === 0) {
      try {
        const coinbaseResponse = await fetch(
          'https://api.coinbase.com/v2/prices/ETH-USD/spot',
          {
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(5000),
          }
        );
        if (coinbaseResponse.ok) {
          const coinbaseData = await coinbaseResponse.json();
          const coinbasePrice = Number(coinbaseData?.data?.amount || 0);
          if (coinbasePrice > 0) {
            ethPrice = coinbasePrice;
            lastKnownEthPrice = coinbasePrice;
            priceSource = 'coinbase';
            console.log('✓ ETH price fetched from Coinbase spot:', ethPrice);
          }
        } else {
          console.warn(`Coinbase API returned ${coinbaseResponse.status}`);
        }
      } catch (coinbaseError) {
        console.warn('Coinbase API failed:', coinbaseError instanceof Error ? coinbaseError.message : coinbaseError);
      }
    }

    // Tier 3: Try Kraken public API
    if (ethPrice === 0) {
      try {
        const krakenResponse = await fetch(
          'https://api.kraken.com/0/public/Ticker?pair=ETHUSD',
          {
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(5000),
          }
        );
        if (krakenResponse.ok) {
          const krakenData = await krakenResponse.json();
          const krakenPrice = Number(krakenData?.result?.XETHZUSD?.c?.[0] || 0);
          if (krakenPrice > 0) {
            ethPrice = krakenPrice;
            lastKnownEthPrice = krakenPrice;
            priceSource = 'kraken';
            console.log('✓ ETH price fetched from Kraken:', ethPrice);
          }
        } else {
          console.warn(`Kraken API returned ${krakenResponse.status}`);
        }
      } catch (krakenError) {
        console.warn('Kraken API failed:', krakenError instanceof Error ? krakenError.message : krakenError);
      }
    }

    // Tier 4: If public APIs failed, try Firestore cache
    if (ethPrice === 0 && adminDb) {
      firestoreFallbackTried = true;
      try {
        const priceDoc = await adminDb.collection('prices').doc('ETH').get();
        if (priceDoc.exists) {
          const cachedData = priceDoc.data();
          const cachedPrice = cachedData?.priceUsd || 0;
          const cachedTimestamp = cachedData?.timestamp?.toMillis?.() || 0;
          const ageMinutes = (Date.now() - cachedTimestamp) / 60000;
          
          if (cachedPrice > 0) {
            ethPrice = cachedPrice;
            priceSource = `firestore-cache-${ageMinutes.toFixed(0)}min`;
            console.log(`✓ ETH price fetched from Firestore cache: $${ethPrice} (${ageMinutes.toFixed(0)} minutes old)`);
          }
        }
      } catch (firestoreError) {
        firestoreFallbackError = firestoreError instanceof Error ? firestoreError.message : String(firestoreError);
        console.warn('Firestore cache failed:', firestoreError);
      }
    }

    // Tier 5: If Firestore also failed, use last known price from memory
    if (ethPrice === 0 && lastKnownEthPrice > 0) {
      ethPrice = lastKnownEthPrice;
      priceSource = 'memory-cache';
      console.warn('⚠️ Using last known ETH price from memory cache:', ethPrice);
    }
    
    debugLog(runId, 'W1', 'app/api/wallet/route.ts:pricePipeline', 'ETH price fallback pipeline result', {
      coinGeckoStatus,
      coinGeckoBodyEth,
      firestoreFallbackTried,
      firestoreFallbackError: firestoreFallbackError ? 'present' : 'none',
      lastKnownEthPrice,
      finalEthPrice: ethPrice,
      priceSource,
      ethBalance,
    });

    // Guard: NEVER return ethValueUSD = 0 if ethBalance > 0
    // But allow reasonable fallback for development/testing
    if (parseFloat(ethBalance) > 0 && ethPrice === 0) {
      // Last resort: Use a reasonable default price (only for non-zero balances)
      // This prevents complete failure but should be clearly marked
      const FALLBACK_ETH_PRICE = 2500; // Conservative estimate
      ethPrice = FALLBACK_ETH_PRICE;
      priceSource = 'fallback-default';
      
      console.warn('⚠️ ALL PRICE SOURCES FAILED - Using fallback default price:', FALLBACK_ETH_PRICE);
      console.warn('   This is a ROUGH ESTIMATE and should not be used for financial decisions');
      
      debugLog(runId, 'W2', 'app/api/wallet/route.ts:fallbackDefault', 'Using fallback default price', {
        ethBalance,
        fallbackPrice: FALLBACK_ETH_PRICE,
        coinGeckoStatus,
        firestoreFallbackTried,
        hasFirestoreError: Boolean(firestoreFallbackError),
        lastKnownEthPrice,
      });
    }

    // Calculate USD values
    const ethValueUSD = parseFloat(ethBalance) * ethPrice;
    const usdtValueUSD = parseFloat(usdtBalance) * usdtPrice;
    const totalValueUSD = ethValueUSD + usdtValueUSD;

    console.log('Final wallet data:', {
      ethBalance,
      usdtBalance,
      ethValueUSD,
      usdtValueUSD,
      totalValueUSD,
    });

    return NextResponse.json({
      address,
      ethBalance: ethBalance,
      usdtBalance: usdtBalance,
      ethValueUSD,
      usdtValueUSD,
      totalValueUSD,
      // Price metadata
      ethPrice,
      priceSource,
      priceWarning: priceSource.includes('fallback') || priceSource.includes('cache') || priceSource.includes('memory')
        ? 'Price data may be outdated or estimated'
        : undefined,
      // Legacy fields for backward compatibility
      eth: ethBalance,
      usdt: usdtBalance,
    });
  } catch (error: any) {
    console.error('Blockchain read error:', error);
    return NextResponse.json(
      { error: 'Failed to read blockchain data', details: error.message },
      { status: 502 }
    );
  }
}
