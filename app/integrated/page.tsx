'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';

// Firestore
import { getUserAssets, PortfolioAsset, getWalletCostBasis, saveWalletCostBasis, WalletCostBasis } from '@/lib/firestore/portfolio';

// API
import { fetchCoinPrices } from '@/lib/api/coingecko';

// Hooks
import { 
  usePortfolioAggregator, 
  ManualPortfolio, 
  WalletPortfolio, 
  PriceMap 
} from '@/lib/hooks/usePortfolioAggregator';

// Components
import GrandTotalCard from '@/components/GrandTotalCard';
import SourceAllocationCards from '@/components/SourceAllocationCards';
import AllocationDonutChart from '@/components/charts/AllocationDonutChart';

export default function IntegratedPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // State for manual portfolio (Firebase)
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [prices, setPrices] = useState<PriceMap>({});
  
  // State for wallet portfolio (Blockchain)
  const [walletAddress, setWalletAddress] = useState('');
  const [walletData, setWalletData] = useState<WalletPortfolio>({
    ethBalance: '0',
    usdtBalance: '0',
    ethValueUSD: 0,
    usdtValueUSD: 0,
    totalWalletValue: 0,
    isLoaded: false,
  });
  
  // State for wallet cost basis
  const [walletCostBasis, setWalletCostBasis] = useState<Record<string, WalletCostBasis>>({});
  const [analyzingTransactions, setAnalyzingTransactions] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load manual portfolio from Firebase
  const loadManualPortfolio = async () => {
    if (!user) return;

    try {
      const userAssets = await getUserAssets(user.uid);
      setAssets(userAssets);

      // Fetch prices using coinIds (same as portfolio page)
      if (userAssets.length > 0) {
        try {
          const coinIds = userAssets.map(asset => asset.coinId);
          const priceData = await fetchCoinPrices(coinIds);
          
          const priceMap: PriceMap = {};
          priceData.forEach(coin => {
            // Map by coinId for accurate matching
            priceMap[coin.id] = coin.current_price;
            // Also map by symbol for aggregator
            priceMap[coin.symbol.toUpperCase()] = coin.current_price;
          });
          
          setPrices(priceMap);
        } catch (priceErr) {
          console.error('Failed to fetch prices:', priceErr);
          setError('Failed to fetch current prices');
        }
      } else {
        // No assets, still fetch BTC/ETH/USDT prices for potential wallet use
        try {
          const priceData = await fetchCoinPrices(['bitcoin', 'ethereum', 'tether']);
          const priceMap: PriceMap = {};
          priceData.forEach(coin => {
            priceMap[coin.id] = coin.current_price;
            priceMap[coin.symbol.toUpperCase()] = coin.current_price;
          });
          setPrices(priceMap);
        } catch (priceErr) {
          console.error('Failed to fetch prices:', priceErr);
        }
      }
    } catch (err) {
      console.error('Failed to load manual portfolio:', err);
      setError('Failed to load manual portfolio');
    }
  };

  // Load wallet portfolio from Blockchain
  const loadWalletPortfolio = async (address: string) => {
    if (!address || !user) return;

    try {
      setAnalyzingTransactions(true);
      setError(null);

      // Step 1: Fetch current balances
      const response = await fetch(`/api/wallet?address=${address}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch wallet data');
      }

      // Step 2: Analyze transaction history to calculate cost basis
      console.log('Analyzing transaction history...');
      const analysisResponse = await fetch(`/api/wallet/analyze?address=${address}`);
      
      let ethCostBasis = 0;
      let usdtCostBasis = 0;

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        console.log('Transaction analysis result:', analysisData);

        ethCostBasis = analysisData.eth?.totalInvested || 0;
        usdtCostBasis = analysisData.usdt?.totalInvested || 0;

        // Save to Firebase for future use
        if (ethCostBasis > 0) {
          await saveWalletCostBasis(user.uid, address, 'ETH', 0, ethCostBasis);
        }
        if (usdtCostBasis > 0) {
          await saveWalletCostBasis(user.uid, address, 'USDT', 0, usdtCostBasis);
        }

        // Update local state
        const costBasis = await getWalletCostBasis(user.uid);
        setWalletCostBasis(costBasis);
      } else {
        console.warn('Failed to analyze transactions, loading saved cost basis...');
        // Fallback to saved cost basis
        const costBasis = await getWalletCostBasis(user.uid);
        setWalletCostBasis(costBasis);
        ethCostBasis = costBasis.ETH?.totalInvested || 0;
        usdtCostBasis = costBasis.USDT?.totalInvested || 0;
      }

      // Calculate P&L
      const ethPnL = data.ethValueUSD - ethCostBasis;
      const usdtPnL = data.usdtValueUSD - usdtCostBasis;
      const totalWalletPnL = ethPnL + usdtPnL;

      console.log('=== Wallet P&L Calculation ===');
      console.log('ETH:', {
        balance: data.ethBalance,
        currentValue: data.ethValueUSD,
        costBasis: ethCostBasis,
        pnl: ethPnL,
      });
      console.log('USDT:', {
        balance: data.usdtBalance,
        currentValue: data.usdtValueUSD,
        costBasis: usdtCostBasis,
        pnl: usdtPnL,
      });
      console.log('Total Wallet P&L:', totalWalletPnL);

      // Ensure all fields have valid values
      setWalletData({
        ethBalance: data.ethBalance || '0',
        usdtBalance: data.usdtBalance || '0',
        ethValueUSD: data.ethValueUSD || 0,
        usdtValueUSD: data.usdtValueUSD || 0,
        totalWalletValue: data.totalValueUSD || 0,
        isLoaded: true,
        ethCostBasis,
        usdtCostBasis,
        ethPnL,
        usdtPnL,
        totalWalletPnL,
      });

      setAnalyzingTransactions(false);
    } catch (err) {
      console.error('Failed to load wallet portfolio:', err);
      setError('Failed to load wallet data');
      setAnalyzingTransactions(false);
      // Reset to safe defaults on error
      setWalletData({
        ethBalance: '0',
        usdtBalance: '0',
        ethValueUSD: 0,
        usdtValueUSD: 0,
        totalWalletValue: 0,
        isLoaded: false,
      });
    }
  };

  // Initial load
  useEffect(() => {
    if (user) {
      loadManualPortfolio().finally(() => setLoading(false));
    }
  }, [user]);

  // Calculate manual portfolio metrics
  const manualPortfolio: ManualPortfolio = {
    totalValue: assets.reduce((sum, asset) => {
      // Use coinId for accurate price matching (same as portfolio page)
      const price = prices[asset.coinId] || 0;
      const value = asset.amount * price;
      return sum + value;
    }, 0),
    totalPnL: assets.reduce((sum, asset) => {
      const price = prices[asset.coinId] || 0;
      const currentValue = asset.amount * price;
      return sum + (currentValue - asset.totalInvested);
    }, 0),
    totalROI: 0, // Not used in aggregator
    assets: assets.map(asset => {
      const currentPrice = prices[asset.coinId] || 0;
      const currentValue = asset.amount * currentPrice;
      const pnl = currentValue - asset.totalInvested;
      const roiPercent = asset.totalInvested > 0 ? (pnl / asset.totalInvested) * 100 : 0;

      return {
        id: asset.id,
        coinId: asset.coinId,
        symbol: asset.symbol,
        name: asset.name,
        buyPrice: asset.averageBuyPrice,
        quantity: asset.amount,
        currentPrice,
        currentValue,
        pnl,
        roiPercent,
        isProfit: pnl >= 0,
      };
    }),
  };

  // Use aggregator hook
  const integratedSummary = usePortfolioAggregator(
    manualPortfolio,
    walletData,
    prices
  );

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
        router.push('/login');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleCheckWallet = () => {
    if (walletAddress.trim()) {
      loadWalletPortfolio(walletAddress.trim());
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <h1 className="text-xl sm:text-2xl font-bold text-white font-mono">
                CRYPTO PORTFOLIO
              </h1>
              <nav className="flex flex-wrap gap-4 text-sm font-mono">
                <Link 
                  href="/dashboard" 
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/portfolio" 
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  Portfolio
                </Link>
                <Link 
                  href="/wallet" 
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  Wallet
                </Link>
                <Link 
                  href="/history" 
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  History
                </Link>
                <Link 
                  href="/integrated" 
                  className="text-white font-bold"
                >
                  Integrated
                </Link>
              </nav>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm font-mono transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-mono mb-2">
            Integrated Portfolio
          </h2>
          <p className="text-sm text-zinc-500 font-mono">
            Combined view of manual assets and on-chain wallet
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-950 border border-red-800 rounded-lg font-mono">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Wallet Address Input */}
        <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-xl p-6 card-glow">
          <label className="block text-sm font-bold text-white uppercase tracking-wider font-mono mb-3">
            Ethereum Wallet Address
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              disabled={analyzingTransactions}
              className="flex-1 px-4 py-3 bg-black border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleCheckWallet}
              disabled={analyzingTransactions}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold transition-colors font-mono whitespace-nowrap disabled:bg-blue-800 disabled:cursor-not-allowed"
            >
              {analyzingTransactions ? 'Analyzing...' : 'Load Wallet'}
            </button>
          </div>
          <p className="text-xs text-zinc-600 mt-3 font-mono">
            {analyzingTransactions 
              ? '🔍 Analyzing transaction history to calculate cost basis automatically...'
              : 'Enter your Ethereum address to include on-chain ETH and USDT balances with automatic cost basis calculation'
            }
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 font-mono">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-zinc-600 text-sm">Loading data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Grand Total Card */}
            <GrandTotalCard
              grandTotalValue={integratedSummary.grandTotalValue}
              grandTotalPnL={integratedSummary.grandTotalPnL}
              lastUpdated={integratedSummary.lastUpdated}
            />

            {/* Source Allocation Cards */}
            <SourceAllocationCards
              manualAllocation={integratedSummary.manualAllocation}
              walletAllocation={integratedSummary.walletAllocation}
              manualValue={manualPortfolio.totalValue}
              walletValue={walletData.totalWalletValue}
              dataCompleteness={integratedSummary.dataCompleteness}
            />

            {/* Wallet Cost Basis Debug Info (only show if wallet loaded) */}
            {walletData.isLoaded && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 card-glow">
                <h3 className="text-lg font-bold text-white font-mono mb-4 uppercase tracking-wider">
                  Wallet Cost Basis Breakdown
                </h3>
                <div className="space-y-3 font-mono text-sm">
                  {/* ETH */}
                  <div className="border-b border-zinc-800 pb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-zinc-500">ETH Balance:</span>
                      <span className="text-white">{parseFloat(walletData.ethBalance).toFixed(4)} ETH</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-zinc-500">ETH Current Value:</span>
                      <span className="text-white">${walletData.ethValueUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-zinc-500">ETH Cost Basis:</span>
                      <span className="text-white">${(walletData.ethCostBasis || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">ETH P&L:</span>
                      <span className={walletData.ethPnL && walletData.ethPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        ${(walletData.ethPnL || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* USDT */}
                  <div className="border-b border-zinc-800 pb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-zinc-500">USDT Balance:</span>
                      <span className="text-white">{parseFloat(walletData.usdtBalance).toFixed(2)} USDT</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-zinc-500">USDT Current Value:</span>
                      <span className="text-white">${walletData.usdtValueUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-zinc-500">USDT Cost Basis:</span>
                      <span className="text-white">${(walletData.usdtCostBasis || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">USDT P&L:</span>
                      <span className={walletData.usdtPnL && walletData.usdtPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        ${(walletData.usdtPnL || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Total */}
                  <div>
                    <div className="flex justify-between font-bold">
                      <span className="text-white">Total Wallet P&L:</span>
                      <span className={walletData.totalWalletPnL && walletData.totalWalletPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        ${(walletData.totalWalletPnL || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Asset Allocation Donut Chart */}
            <AllocationDonutChart
              btcTotalValue={integratedSummary.btcTotalValue}
              ethTotalValue={integratedSummary.ethTotalValue}
              usdtTotalValue={integratedSummary.usdtTotalValue}
            />
          </div>
        )}
      </main>
    </div>
  );
}
