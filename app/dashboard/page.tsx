'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/lib/context/AuthContext';
import { fetchCoinPrices, CoinPrice } from '@/lib/api/coingecko';
import PriceCard from '@/components/PriceCard';
import { getUserAssets } from '@/lib/firestore/portfolio';
import {
  getSavedWallets,
  updateSavedWalletManualCostBasis,
} from '@/lib/firestore/savedWallets';
import { getWalletAddresses } from '@/lib/firestore/wallets';
import { SOL_MINT_TO_COINGECKO } from '@/lib/solanaTokenMap';
import {
  DASHBOARD_MAX_VISIBLE_COINS,
  getDashboardPreferences,
  saveDashboardPreferences,
} from '@/lib/firestore/preferences';
import AppHeader from '@/components/ui/AppHeader';
import CoinMark from '@/components/ui/CoinMark';
import { useCountUp } from '@/components/ui/useCountUp';

type AssetSource = 'manual' | 'wallet' | 'mixed';

interface WalletFetchedAsset {
  coingeckoId: string;
  symbol: string;
  name: string;
  holdings: number;
  walletId: string;
  walletLabel: string;
  walletInvested: number;
}

interface MergedAssetRow {
  coingeckoId: string;
  symbol: string;
  name: string;
  holdings: number;
  invested: number;
  source: AssetSource;
  hasWalletPortion: boolean;
  walletRefs: Array<{ walletId: string; label: string }>;
}

function AllocationBar({ pct }: { pct: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
      <div style={{ width: 80, height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: 'var(--ink)', transition: 'width 400ms' }} />
      </div>
      <span style={{ minWidth: 38, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)' }}>{pct.toFixed(1)}%</span>
    </div>
  );
}

function TotalCard({ total, lastUpdate }: { total: number; lastUpdate: Date | null }) {
  const animated = useCountUp(total, 700);
  const fmt = (n: number) =>
    '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="cf-card cf-enter" style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
        <div>
          <div className="cf-section-title" style={{ marginBottom: 14 }}>Total Portfolio Value</div>
          <div className="cf-num cf-display-pixel" style={{ fontSize: 52, lineHeight: 1, letterSpacing: '0.02em', color: 'var(--ink)' }}>
            {fmt(animated)}
          </div>
          <div className="cf-ticker cf-wrap" style={{ color: 'var(--ink-3)', marginTop: 12 }}>
            Manual portfolio · ETH wallet · Solana wallet — read-only
          </div>
        </div>
        {lastUpdate && (
          <div style={{ textAlign: 'right' }}>
            <div className="cf-section-title" style={{ marginBottom: 6 }}>Last update</div>
            <div className="cf-num" style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>
              {lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </div>
            <div className="cf-ticker" style={{ color: 'var(--ink-3)', marginTop: 6 }}>Auto · 60s</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [coins, setCoins] = useState<CoinPrice[]>([]);
  const [rows, setRows] = useState<MergedAssetRow[]>([]);
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [visibleCoinIds, setVisibleCoinIds] = useState<string[]>([]);
  const [walletCoingeckoIds, setWalletCoingeckoIds] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const loadDashboard = async () => {
    if (!user) return;
    try {
      setError(null);
      setLoading(true);

      const [manualResult, walletResult, prefsResult, savedAddressesResult] =
        await Promise.allSettled([
          getUserAssets(user.uid),
          getSavedWallets(user.uid),
          getDashboardPreferences(user.uid),
          getWalletAddresses(user.uid),
        ]);

      const manualAssets = manualResult.status === 'fulfilled' ? manualResult.value : [];
      const prefs = prefsResult.status === 'fulfilled'
        ? prefsResult.value
        : { visibleCoinIds: [] as string[] };
      const savedAddresses = savedAddressesResult.status === 'fulfilled'
        ? savedAddressesResult.value
        : {};

      if (manualResult.status === 'rejected') {
        setError('Failed to load your manual portfolio. Check Firestore rules / auth state.');
      }

      setVisibleCoinIds(prefs.visibleCoinIds);

      const walletAssets: WalletFetchedAsset[] = [];

      if (savedAddresses.ethAddress) {
        try {
          const res = await fetch(`/api/wallet?address=${savedAddresses.ethAddress}`);
          const data = await res.json();
          if (res.ok) {
            const ethAmt = Number(data.ethBalance || data.eth || 0);
            const usdtAmt = Number(data.usdtBalance || data.usdt || 0);
            if (ethAmt > 0)
              walletAssets.push({ coingeckoId: 'ethereum', symbol: 'ETH', name: 'Ethereum', holdings: ethAmt, walletId: 'settings-eth', walletLabel: 'ETH Wallet', walletInvested: 0 });
            if (usdtAmt > 0)
              walletAssets.push({ coingeckoId: 'tether', symbol: 'USDT', name: 'Tether', holdings: usdtAmt, walletId: 'settings-eth', walletLabel: 'ETH Wallet', walletInvested: 0 });
          }
        } catch { /* non-fatal */ }
      }

      if (savedAddresses.solanaAddress) {
        try {
          const res = await fetch(`/api/solana/balance?address=${savedAddresses.solanaAddress}`);
          const data = await res.json();
          if (res.ok) {
            const solAmt = Number(data.sol || 0);
            if (solAmt > 0)
              walletAssets.push({ coingeckoId: 'solana', symbol: 'SOL', name: 'Solana', holdings: solAmt, walletId: 'settings-sol', walletLabel: 'SOL Wallet', walletInvested: 0 });
            (data.tokens || []).forEach((token: any) => {
              const coingeckoId = SOL_MINT_TO_COINGECKO[token.mint] || `solana:${token.mint}`;
              const amt = Number(token.uiAmount || 0);
              if (amt > 0)
                walletAssets.push({ coingeckoId, symbol: token.symbol || `${token.mint.slice(0, 4)}...${token.mint.slice(-4)}`, name: token.name || 'SPL Token', holdings: amt, walletId: 'settings-sol', walletLabel: 'SOL Wallet', walletInvested: 0 });
            });
          }
        } catch { /* non-fatal */ }
      }

      setWalletCoingeckoIds(walletAssets.map((a) => a.coingeckoId));

      const merged = new Map<string, MergedAssetRow>();

      manualAssets.forEach((asset) => {
        const coingeckoId = asset.coinId;
        if (!coingeckoId) return;
        const holdings = asset.amount ?? 0;
        const invested = asset.totalInvested ?? (holdings * (asset.averageBuyPrice ?? 0));
        merged.set(coingeckoId, { coingeckoId, symbol: asset.symbol, name: asset.name, holdings, invested, source: 'manual', hasWalletPortion: false, walletRefs: [] });
      });

      walletAssets.forEach((walletAsset) => {
        const existing = merged.get(walletAsset.coingeckoId);
        if (existing) {
          existing.holdings += walletAsset.holdings;
          existing.invested += walletAsset.walletInvested;
          existing.hasWalletPortion = true;
          existing.source = existing.source === 'manual' ? 'mixed' : 'wallet';
          existing.walletRefs.push({ walletId: walletAsset.walletId, label: walletAsset.walletLabel });
        } else {
          merged.set(walletAsset.coingeckoId, { coingeckoId: walletAsset.coingeckoId, symbol: walletAsset.symbol, name: walletAsset.name, holdings: walletAsset.holdings, invested: walletAsset.walletInvested, source: 'wallet', hasWalletPortion: true, walletRefs: [{ walletId: walletAsset.walletId, label: walletAsset.walletLabel }] });
        }
      });

      const knownIds = Array.from(merged.keys()).filter((id) => !id.startsWith('solana:'));
      let data: any[] = [];
      
      if (knownIds.length > 0) {
        try {
          data = await fetchCoinPrices(knownIds);
        } catch (err) {
          console.error('Failed to fetch prices, using fallback:', err);
          // Continue with empty price data - dashboard will show $0 prices
          data = [];
        }
      }
      
      setCoins(data);
      const nextPriceMap: Record<string, number> = {};
      data.forEach((coin) => { nextPriceMap[coin.id] = coin.current_price; });
      setPriceMap(nextPriceMap);
      const allRows = Array.from(merged.values());
      setRows(allRows);
      const total = allRows.reduce((sum, row) => sum + row.holdings * (nextPriceMap[row.coingeckoId] || 0), 0);
      setTotalPortfolioValue(total);
      setLastUpdate(new Date());
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('insufficient permissions')) return;
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) loadDashboard(); }, [user]);
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => loadDashboard(), 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    try { if (auth) { await signOut(auth); router.push('/login'); } } catch {}
  };

  const getCurrentValue = (row: MergedAssetRow) => row.holdings * (priceMap[row.coingeckoId] || 0);

  const handleSetWalletCostBasis = async (row: MergedAssetRow) => {
    if (!user || row.walletRefs.length === 0) return;
    const walletRef = row.walletRefs[0];
    const current = row.invested > 0 ? row.invested : 0;
    const input = prompt(`Set wallet cost basis for ${row.symbol} (${walletRef.label})`, String(current));
    if (input === null) return;
    const parsed = parseFloat(input);
    if (isNaN(parsed) || parsed < 0) return;
    await updateSavedWalletManualCostBasis(user.uid, walletRef.walletId, row.coingeckoId, parsed);
    await loadDashboard();
  };

  const candidates = rows.map((row) => ({ coingeckoId: row.coingeckoId, symbol: row.symbol, name: row.name, source: row.source }));
  const effectiveVisibleIds = visibleCoinIds.length > 0
    ? [...new Set([...visibleCoinIds, ...walletCoingeckoIds])]
    : candidates.slice(0, DASHBOARD_MAX_VISIBLE_COINS).map((c) => c.coingeckoId);
  const visibleSet = new Set(effectiveVisibleIds);
  const visibleCoins = coins.filter((c) => visibleSet.has(c.id)).slice(0, DASHBOARD_MAX_VISIBLE_COINS);
  const visibleRows = rows.filter((r) => visibleSet.has(r.coingeckoId)).slice(0, DASHBOARD_MAX_VISIBLE_COINS);

  const handleToggleVisible = (coingeckoId: string) => {
    setVisibleCoinIds((prev) => {
      if (prev.includes(coingeckoId)) return prev.filter((id) => id !== coingeckoId);
      if (prev.length >= DASHBOARD_MAX_VISIBLE_COINS) return prev;
      return [...prev, coingeckoId];
    });
  };

  const handleSavePrefs = async () => {
    if (!user) return;
    setSavingPrefs(true);
    try {
      await saveDashboardPreferences(user.uid, { visibleCoinIds });
      setShowSettings(false);
      await loadDashboard();
    } catch { alert('Failed to save settings'); }
    finally { setSavingPrefs(false); }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--ink)', borderRadius: '50%', animation: 'spin 700ms linear infinite', margin: '0 auto 12px' }} />
          <span className="cf-ticker" style={{ color: 'var(--ink-3)' }}>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <AppHeader email={user.email} onLogout={handleLogout} />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <div>
            <div className="cf-section-title" style={{ marginBottom: 10 }}>— Dashboard Overview</div>
            <h1 className="cf-h2" style={{ margin: 0 }}>Overview</h1>
            {lastUpdate && (
              <p className="cf-body cf-muted" style={{ margin: '6px 0 0' }}>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="cf-btn cf-btn-secondary"
              onClick={() => setShowSettings((v) => !v)}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
              </svg>
              Settings
            </button>
            <button
              className="cf-btn cf-btn-primary"
              onClick={() => { setLoading(true); loadDashboard(); }}
              disabled={loading}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: loading ? 'spin 700ms linear infinite' : 'none' }}>
                <path d="M21 12a9 9 0 1 1-3-6.7L21 8 M21 3v5h-5" />
              </svg>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="cf-card cf-enter" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div className="cf-section-title" style={{ marginBottom: 4 }}>Dashboard Display</div>
                <p className="cf-body cf-muted" style={{ margin: 0, fontSize: 12 }}>
                  Pick up to {DASHBOARD_MAX_VISIBLE_COINS} assets to show. List comes from your manual portfolio and saved wallets.
                </p>
              </div>
              <span className="cf-ticker" style={{ color: 'var(--ink-3)' }}>{visibleCoinIds.length}/{DASHBOARD_MAX_VISIBLE_COINS}</span>
            </div>
            {candidates.length === 0 ? (
              <p className="cf-body cf-muted" style={{ fontSize: 12 }}>No assets yet. Add a manual asset or save a wallet first.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginBottom: 16 }}>
                {candidates.map((c) => {
                  const checked = visibleCoinIds.includes(c.coingeckoId);
                  const disabled = !checked && visibleCoinIds.length >= DASHBOARD_MAX_VISIBLE_COINS;
                  return (
                    <label
                      key={c.coingeckoId}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 12px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
                        border: checked ? '1px solid var(--ink)' : '1px solid var(--border)',
                        background: checked ? 'var(--surface-2)' : 'var(--bg)',
                        opacity: disabled ? 0.4 : 1,
                        fontFamily: 'var(--font-mono)', fontSize: 12,
                      }}
                    >
                      <input type="checkbox" checked={checked} disabled={disabled} onChange={() => handleToggleVisible(c.coingeckoId)} style={{ accentColor: 'var(--ink)' }} />
                      <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{c.symbol}</span>
                      <span style={{ color: 'var(--ink-3)', flex: 1 }}>{c.name}</span>
                      <span className="cf-tag">{c.source}</span>
                    </label>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="cf-btn cf-btn-primary" onClick={handleSavePrefs} disabled={savingPrefs}>
                {savingPrefs ? 'Saving…' : 'Save'}
              </button>
              <button className="cf-btn cf-btn-secondary" onClick={() => setVisibleCoinIds([])} disabled={savingPrefs}>
                Reset to default
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 24, padding: '12px 16px', background: 'var(--negative-bg)', border: '1px solid rgba(255,59,48,0.25)', borderRadius: 8 }}>
            <p className="cf-body" style={{ margin: 0, color: 'var(--negative)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{error}</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && coins.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
            <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--ink)', borderRadius: '50%', animation: 'spin 700ms linear infinite', marginBottom: 12 }} />
            <span className="cf-ticker" style={{ color: 'var(--ink-3)' }}>Loading prices...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Total card */}
            {totalPortfolioValue > 0 && <TotalCard total={totalPortfolioValue} lastUpdate={lastUpdate} />}

            {/* Price cards */}
            {visibleCoins.length > 0 && (
              <div>
                <div className="cf-section-title" style={{ marginBottom: 12 }}>— Prices · top {visibleCoins.length}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {visibleCoins.map((coin, i) => (
                    <div key={coin.id} className="cf-enter" style={{ animationDelay: `${i * 40}ms` }}>
                      <PriceCard coin={coin} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Holdings table */}
            <div>
              <div className="cf-section-title" style={{ marginBottom: 12 }}>— Holdings</div>
              <div className="cf-card cf-enter" style={{ padding: 0, overflow: 'hidden', animationDelay: '120ms' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    <thead>
                      <tr>
                        {['Asset', 'Holdings', 'Price', 'Value', 'Allocation', 'Source'].map((h, i) => (
                          <th key={h} style={{ textAlign: i === 0 || i === 5 ? 'left' : 'right', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', fontWeight: 500, padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((row, i) => {
                        const price = priceMap[row.coingeckoId] || 0;
                        const value = getCurrentValue(row);
                        const alloc = totalPortfolioValue > 0 ? (value / totalPortfolioValue) * 100 : 0;
                        return (
                          <tr key={row.coingeckoId} style={{ animation: `cf-fade-up 240ms ${i * 30}ms both` }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                            <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <CoinMark symbol={row.symbol} size={26} />
                                <div>
                                  <div style={{ fontWeight: 500 }}>{row.symbol}</div>
                                  <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-sans)' }}>{row.name}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 20px', textAlign: 'right', borderBottom: '1px solid var(--border)', fontVariantNumeric: 'tabular-nums', color: 'var(--ink)' }}>
                              {row.holdings.toLocaleString('en-US', { maximumFractionDigits: row.coingeckoId === 'ethereum' ? 6 : 4 })}
                            </td>
                            <td style={{ padding: '14px 20px', textAlign: 'right', borderBottom: '1px solid var(--border)', fontVariantNumeric: 'tabular-nums', color: 'var(--ink)' }}>
                              ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '14px 20px', textAlign: 'right', borderBottom: '1px solid var(--border)', fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: 'var(--ink)' }}>
                              ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                              <AllocationBar pct={alloc} />
                            </td>
                            <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                              <span className="cf-tag">{row.source}</span>
                            </td>
                          </tr>
                        );
                      })}
                      {visibleRows.length > 0 && (
                        <tr style={{ background: 'var(--surface-2)' }}>
                          <td colSpan={3} style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Total (visible)</td>
                          <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--ink)' }}>
                            ${visibleRows.reduce((sum, row) => sum + getCurrentValue(row), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td colSpan={2} />
                        </tr>
                      )}
                      {visibleRows.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                            {rows.length === 0 ? 'No portfolio or wallet assets yet.' : 'No assets selected. Open Settings to choose up to 6.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
