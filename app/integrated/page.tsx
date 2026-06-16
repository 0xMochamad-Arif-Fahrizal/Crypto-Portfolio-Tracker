'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/lib/context/AuthContext';

// Firestore
import { getUserAssets, PortfolioAsset, getWalletCostBasis, saveWalletCostBasis, deleteWalletCostBasis, WalletCostBasis } from '@/lib/firestore/portfolio';
import { addExcludedTx, removeExcludedTx, subscribeToExcludedTxs } from '@/lib/firestore/excludedTransactions';
import { saveWalletAddresses, getWalletAddresses } from '@/lib/firestore/wallets';

// API
import { fetchCoinPrices } from '@/lib/api/coingecko';

// Hooks
import { usePortfolioAggregator, ManualPortfolio, WalletPortfolio, PriceMap } from '@/lib/hooks/usePortfolioAggregator';

// Components
import GrandTotalCard from '@/components/GrandTotalCard';
import SourceAllocationCards from '@/components/SourceAllocationCards';
import AllocationDonutChart, { AssetSlice } from '@/components/charts/AllocationDonutChart';
import WalletTransactionList from '@/components/WalletTransactionList';
import AppHeader from '@/components/ui/AppHeader';
import Icon from '@/components/ui/Icon';

interface TransactionDetail {
  txHash: string;
  timestamp: number;
  dateStr: string;
  direction: 'in' | 'out';
  asset: 'ETH' | 'USDT';
  amount: number;
  priceAtTime: number;
  valueUSD: number;
  isExcluded: boolean;
}

export default function IntegratedPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [prices, setPrices] = useState<PriceMap>({});
  const [ethAddress, setEthAddress] = useState('');
  const [ethLoading, setEthLoading] = useState(false);
  const [ethErr, setEthErr] = useState<string | null>(null);
  const [walletData, setWalletData] = useState<WalletPortfolio>({
    ethBalance: '0', usdtBalance: '0', ethValueUSD: 0, usdtValueUSD: 0, totalWalletValue: 0, isLoaded: false,
  });
  const [costBasisOverrides, setCostBasisOverrides] = useState<Record<string, number>>({});
  const [walletCostBasis, setWalletCostBasis] = useState<Record<string, WalletCostBasis>>({});
  const [excludedHashes, setExcludedHashes] = useState<string[]>([]);
  const [analyzeData, setAnalyzeData] = useState<any>(null);
  const [ethTransactions, setEthTransactions] = useState<TransactionDetail[]>([]);
  const [usdtTransactions, setUsdtTransactions] = useState<TransactionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading, router]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToExcludedTxs(user.uid, setExcludedHashes);
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    try {
      const raw = localStorage.getItem(`eth-cb-v1-${user.uid}`);
      if (raw) setCostBasisOverrides(JSON.parse(raw) as Record<string, number>);
    } catch {}
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    getWalletAddresses(user.uid)
      .then(({ ethAddress: saved }) => {
        if (cancelled || !saved?.trim()) return;
        setEthAddress(saved);
        loadWalletPortfolio(saved);
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const loadManualPortfolio = async () => {
    if (!user) return;
    try {
      const userAssets = await getUserAssets(user.uid);
      setAssets(userAssets);
      if (userAssets.length > 0) {
        try {
          const coinIds = userAssets.map((a) => a.coinId);
          const priceData = await fetchCoinPrices(coinIds);
          const priceMap: PriceMap = {};
          priceData.forEach((c) => { priceMap[c.id] = c.current_price; priceMap[c.symbol.toUpperCase()] = c.current_price; });
          setPrices(priceMap);
        } catch { setError('Failed to fetch current prices'); }
      } else {
        try {
          const priceData = await fetchCoinPrices(['bitcoin', 'ethereum', 'tether']);
          const priceMap: PriceMap = {};
          priceData.forEach((c) => { priceMap[c.id] = c.current_price; priceMap[c.symbol.toUpperCase()] = c.current_price; });
          setPrices(priceMap);
        } catch {}
      }
    } catch { setError('Failed to load manual portfolio'); }
  };

  const loadWalletPortfolio = async (address: string) => {
    if (!address || !user) return;
    try {
      setEthLoading(true); setEthErr(null); setError(null);
      const response = await fetch(`/api/wallet?address=${address}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch wallet data');

      const excludedParam = excludedHashes.join(',');
      const analysisUrl = `/api/wallet/analyze?address=${address}${excludedParam ? `&excluded=${excludedParam}` : ''}&ethBalance=${data.ethBalance}&usdtBalance=${data.usdtBalance}&ethPrice=${data.ethPrice ?? 0}`;
      const analysisResponse = await fetch(analysisUrl);

      let ethCostBasis = 0, usdtCostBasis = 0;
      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        setAnalyzeData(analysisData);
        ethCostBasis = analysisData.eth?.totalInvested || 0;
        usdtCostBasis = analysisData.usdt?.totalInvested || 0;
        if (analysisData.eth?.currentBalance === 0 && analysisData.eth?.transactions === 0) { ethCostBasis = 0; await deleteWalletCostBasis(user.uid, 'ETH'); }
        if (analysisData.usdt?.currentBalance === 0 && analysisData.usdt?.transactions === 0) { usdtCostBasis = 0; await deleteWalletCostBasis(user.uid, 'USDT'); }
        setEthTransactions(analysisData.eth?.transactionDetails || []);
        setUsdtTransactions(analysisData.usdt?.transactionDetails || []);
        if (ethCostBasis > 0) await saveWalletCostBasis(user.uid, address, 'ETH', 0, ethCostBasis);
        if (usdtCostBasis > 0) await saveWalletCostBasis(user.uid, address, 'USDT', 0, usdtCostBasis);
        const costBasis = await getWalletCostBasis(user.uid);
        setWalletCostBasis(costBasis);
      } else {
        const costBasis = await getWalletCostBasis(user.uid);
        setWalletCostBasis(costBasis);
        ethCostBasis = costBasis.ETH?.totalInvested || 0;
        usdtCostBasis = costBasis.USDT?.totalInvested || 0;
        setAnalyzeData({ eth: { transactionDetails: [], totalInvested: ethCostBasis, averageCostBasis: 0, currentBalance: 0, transactions: 0, isTruncated: false }, usdt: { transactionDetails: [], totalInvested: usdtCostBasis, averageCostBasis: 0, currentBalance: 0, transactions: 0, isTruncated: false }, excludedCount: 0, warning: 'Analisis transaksi gagal. Menampilkan data tersimpan sebagai fallback.' });
      }

      const ethPnL = data.ethValueUSD - ethCostBasis;
      const usdtPnL = data.usdtValueUSD - usdtCostBasis;
      setWalletData({ ethBalance: data.ethBalance || '0', usdtBalance: data.usdtBalance || '0', ethValueUSD: data.ethValueUSD || 0, usdtValueUSD: data.usdtValueUSD || 0, totalWalletValue: data.totalValueUSD || 0, isLoaded: true, ethCostBasis, usdtCostBasis, ethPnL, usdtPnL, totalWalletPnL: ethPnL + usdtPnL });
      saveWalletAddresses(user.uid, { ethAddress: address }).catch(() => {});
      setEthLoading(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load wallet data';
      setEthErr(msg); setEthLoading(false);
      setWalletData({ ethBalance: '0', usdtBalance: '0', ethValueUSD: 0, usdtValueUSD: 0, totalWalletValue: 0, isLoaded: false });
    }
  };

  useEffect(() => { if (user) loadManualPortfolio().finally(() => setLoading(false)); }, [user]);

  const manualPortfolio: ManualPortfolio = {
    totalValue: assets.reduce((sum, a) => sum + a.amount * (prices[a.coinId] || 0), 0),
    totalPnL: assets.reduce((sum, a) => { const v = a.amount * (prices[a.coinId] || 0); return sum + (v - a.totalInvested); }, 0),
    totalROI: 0,
    assets: assets.map((a) => {
      const currentPrice = prices[a.coinId] || 0;
      const currentValue = a.amount * currentPrice;
      const pnl = currentValue - a.totalInvested;
      return { id: a.id, coinId: a.coinId, symbol: a.symbol, name: a.name, buyPrice: a.averageBuyPrice, quantity: a.amount, currentPrice, currentValue, pnl, roiPercent: a.totalInvested > 0 ? (pnl / a.totalInvested) * 100 : 0, isProfit: pnl >= 0 };
    }),
  };

  const baseSummary = usePortfolioAggregator(manualPortfolio, walletData, prices);

  const ethCostBasisFinal = useMemo(() => {
    type OpenLot = { txHash: string; amount: number; pricePerEth: number };
    const openLots: OpenLot[] = analyzeData?.eth?.openLots ?? [];
    if (openLots.length === 0) return walletData.ethCostBasis ?? 0;
    return openLots.reduce((sum, lot) => { const price = costBasisOverrides[lot.txHash] ?? lot.pricePerEth; return sum + lot.amount * price; }, 0);
  }, [analyzeData, costBasisOverrides, walletData.ethCostBasis]);

  const ethPnLFinal = walletData.isLoaded ? walletData.ethValueUSD - ethCostBasisFinal : 0;
  const usdtPnLFinal = walletData.isLoaded ? (walletData.usdtPnL ?? 0) : 0;

  const grandTotalValue = baseSummary.grandTotalValue;
  const grandTotalPnL = manualPortfolio.totalPnL + ethPnLFinal + usdtPnLFinal;
  const walletAllocation = grandTotalValue > 0 ? (walletData.totalWalletValue || 0) / grandTotalValue * 100 : 0;
  const manualAllocation = grandTotalValue > 0 ? manualPortfolio.totalValue / grandTotalValue * 100 : 0;

  const integratedSummary = { ...baseSummary, grandTotalValue, grandTotalPnL, manualAllocation, walletAllocation };

  const pieChartAssets = useMemo((): AssetSlice[] => {
    const map = new Map<string, AssetSlice>();
    manualPortfolio.assets.forEach((a) => {
      if (a.currentValue <= 0) return;
      const sym = a.symbol.toUpperCase();
      const existing = map.get(sym);
      if (existing) existing.value += a.currentValue;
      else map.set(sym, { name: a.name || a.symbol, symbol: sym, value: a.currentValue });
    });
    if (walletData.isLoaded) {
      if (walletData.ethValueUSD > 0) { const sym = 'ETH'; const existing = map.get(sym); if (existing) existing.value += walletData.ethValueUSD; else map.set(sym, { name: 'Ethereum', symbol: sym, value: walletData.ethValueUSD }); }
      if (walletData.usdtValueUSD > 0) { const sym = 'USDT'; const existing = map.get(sym); if (existing) existing.value += walletData.usdtValueUSD; else map.set(sym, { name: 'Tether', symbol: sym, value: walletData.usdtValueUSD }); }
    }
    return Array.from(map.values()).filter((s) => s.value > 0);
  }, [manualPortfolio, walletData]);

  const handleLogout = async () => {
    try { if (auth) { await signOut(auth); router.push('/login'); } } catch {}
  };

  const isValidEthereumAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);

  const handleCheckEth = () => {
    const trimmed = ethAddress.trim();
    if (!trimmed) return;
    if (!isValidEthereumAddress(trimmed)) { setEthErr('Invalid Ethereum address. Must be 0x followed by 40 hex characters.'); return; }
    loadWalletPortfolio(trimmed);
  };

  const handleExclude = async (txHash: string, asset: 'ETH' | 'USDT', amount: number) => {
    if (!user?.uid) return;
    try {
      await addExcludedTx(user.uid, { txHash, excludedAt: new Date(), reason: 'internal_transfer', asset, amount });
      if (ethAddress) await loadWalletPortfolio(ethAddress);
    } catch { setError('Failed to exclude transaction'); }
  };

  const handleInclude = async (txHash: string) => {
    if (!user?.uid) return;
    try {
      await removeExcludedTx(user.uid, txHash);
      if (ethAddress) await loadWalletPortfolio(ethAddress);
    } catch { setError('Failed to include transaction'); }
  };

  const handlePriceOverride = (txHash: string, priceUsd: number | null) => {
    setCostBasisOverrides((prev) => {
      const next = { ...prev };
      if (priceUsd === null) delete next[txHash]; else next[txHash] = priceUsd;
      if (user?.uid) { try { localStorage.setItem(`eth-cb-v1-${user.uid}`, JSON.stringify(next)); } catch {} }
      return next;
    });
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--ink)', borderRadius: '50%', animation: 'spin 700ms linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
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
            <div className="cf-section-title" style={{ marginBottom: 10 }}>— Integrated Portfolio</div>
            <h1 className="cf-h2" style={{ margin: 0 }}>Combined View</h1>
            <p className="cf-body cf-muted" style={{ margin: '6px 0 0' }}>Manual assets + on-chain wallet unified.</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 24, padding: '12px 16px', background: 'var(--negative-bg)', border: '1px solid rgba(255,59,48,0.25)', borderRadius: 8 }}>
            <p className="cf-body" style={{ margin: 0, color: 'var(--negative)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{error}</p>
          </div>
        )}

        {/* Wallet loader — compact 1 row */}
        <div className="cf-card cf-enter" style={{ padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div className="cf-section-title" style={{ flexShrink: 0 }}>Ethereum Wallet</div>
            <input
              className="cf-input"
              type="text"
              value={ethAddress}
              onChange={(e) => setEthAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheckEth()}
              placeholder="0x…"
              disabled={ethLoading}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              style={{ flex: 1, minWidth: 240 }}
            />
            <button
              className="cf-btn cf-btn-primary"
              onClick={handleCheckEth}
              disabled={ethLoading || !ethAddress.trim()}
              style={{ flexShrink: 0 }}
            >
              {ethLoading ? 'Analyzing…' : 'Load Ethereum'}
            </button>
            {walletData.isLoaded && !ethErr && (
              <span className="cf-pill cf-pill-positive" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={12} /> Loaded · address saved</span>
            )}
          </div>
          {ethErr && <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--negative)' }}>{ethErr}</div>}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0' }}>
            <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--ink)', borderRadius: '50%', animation: 'spin 700ms linear infinite', marginBottom: 12 }} />
            <span className="cf-ticker" style={{ color: 'var(--ink-3)' }}>Loading data...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Grand total */}
            <GrandTotalCard
              grandTotalValue={integratedSummary.grandTotalValue}
              grandTotalPnL={integratedSummary.grandTotalPnL}
              lastUpdated={integratedSummary.lastUpdated}
            />

            {/* Source allocation */}
            <SourceAllocationCards
              manualAllocation={integratedSummary.manualAllocation}
              walletAllocation={integratedSummary.walletAllocation}
              manualValue={manualPortfolio.totalValue}
              walletValue={walletData.totalWalletValue || 0}
              dataCompleteness={walletData.isLoaded ? (assets.length > 0 ? 'full' : 'wallet-only') : (assets.length > 0 ? 'manual-only' : 'manual-only')}
            />

            {/* Cost basis breakdown */}
            {walletData.isLoaded && (
              <div className="cf-card cf-enter">
                <div className="cf-section-title" style={{ marginBottom: 18 }}>— Wallet Cost Basis Breakdown</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                  {/* ETH rows */}
                  {[
                    { label: 'ETH Balance', value: `${parseFloat(walletData.ethBalance).toFixed(4)} ETH`, color: undefined },
                    { label: 'ETH Current Value', value: `$${walletData.ethValueUSD.toFixed(2)}`, color: undefined },
                    { label: 'ETH Cost Basis', value: `$${ethCostBasisFinal.toFixed(2)}`, color: undefined },
                    { label: 'ETH P&L', value: `$${ethPnLFinal.toFixed(2)}`, color: ethPnLFinal >= 0 ? 'var(--positive)' : 'var(--negative)' },
                  ].map((r) => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                      <span style={{ color: 'var(--ink-2)' }}>{r.label}</span>
                      <span style={{ color: r.color ?? 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{r.value}</span>
                    </div>
                  ))}
                  <hr className="cf-hr" style={{ margin: '10px 0' }} />
                  {/* USDT rows */}
                  {[
                    { label: 'USDT Balance', value: `${parseFloat(walletData.usdtBalance).toFixed(2)} USDT`, color: undefined },
                    { label: 'USDT Current Value', value: `$${walletData.usdtValueUSD.toFixed(2)}`, color: undefined },
                    { label: 'USDT Cost Basis', value: `$${(walletData.usdtCostBasis || 0).toFixed(2)}`, color: undefined },
                    { label: 'USDT P&L', value: `$${(walletData.usdtPnL || 0).toFixed(2)}`, color: (walletData.usdtPnL ?? 0) >= 0 ? 'var(--positive)' : 'var(--negative)' },
                  ].map((r) => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                      <span style={{ color: 'var(--ink-2)' }}>{r.label}</span>
                      <span style={{ color: r.color ?? 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{r.value}</span>
                    </div>
                  ))}
                  <hr className="cf-hr" style={{ margin: '10px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 15 }}>
                    <span>Total Wallet P&L</span>
                    <span style={{ color: (ethPnLFinal + usdtPnLFinal) >= 0 ? 'var(--positive)' : 'var(--negative)', fontVariantNumeric: 'tabular-nums' }}>
                      ${(ethPnLFinal + usdtPnLFinal).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Donut chart */}
            <AllocationDonutChart assets={pieChartAssets} />

            {/* Warnings */}
            {analyzeData?.warning && (
              <div style={{ padding: '12px 16px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Icon name="alert-triangle" size={16} style={{ marginTop: 1, flexShrink: 0, color: 'var(--ink-2)' }} />
                <span className="cf-body cf-muted" style={{ fontSize: 13 }}>{analyzeData.warning}</span>
              </div>
            )}

            {analyzeData?.excludedCount > 0 && (
              <div style={{ padding: '12px 16px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <span className="cf-body cf-muted" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="info" size={14} /> {analyzeData.excludedCount} transactions excluded from cost basis</span>
              </div>
            )}

            {/* Transaction list */}
            {analyzeData && (
              <WalletTransactionList
                ethTransactions={analyzeData.eth?.transactionDetails || []}
                usdtTransactions={analyzeData.usdt?.transactionDetails || []}
                excludedHashes={excludedHashes}
                priceOverrides={costBasisOverrides}
                onExclude={handleExclude}
                onInclude={handleInclude}
                onPriceOverride={handlePriceOverride}
              />
            )}
          </div>
        )}
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
