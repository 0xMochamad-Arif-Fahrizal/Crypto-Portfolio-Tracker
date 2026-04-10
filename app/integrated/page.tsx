'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';

// Firestore
import { getUserAssets, PortfolioAsset } from '@/lib/firestore/portfolio';

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
    if (!address) return;

    try {
      const response = await fetch(`/api/wallet?address=${address}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch wallet data');
      }

      // Ensure all fields have valid values
      setWalletData({
        ethBalance: data.ethBalance || '0',
        usdtBalance: data.usdtBalance || '0',
        ethValueUSD: data.ethValueUSD || 0,
        usdtValueUSD: data.usdtValueUSD || 0,
        totalWalletValue: data.totalValueUSD || 0,
        isLoaded: true,
      });
    } catch (err) {
      console.error('Failed to load wallet portfolio:', err);
      setError('Failed to load wallet data');
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold">Crypto Portfolio</h1>
              <nav className="flex gap-4">
                <Link 
                  href="/dashboard" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/portfolio" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Portfolio
                </Link>
                <Link 
                  href="/wallet" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Wallet
                </Link>
                <Link 
                  href="/history" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  History
                </Link>
                <Link 
                  href="/integrated" 
                  className="text-white font-medium"
                >
                  Integrated
                </Link>
              </nav>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Integrated Portfolio</h2>
          <p className="text-sm text-gray-400 mt-1">
            Combined view of manual assets and on-chain wallet
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Wallet Address Input */}
        <div className="mb-6 bg-gray-800 rounded-lg p-4">
          <label className="block text-sm font-medium mb-2">
            Ethereum Wallet Address (Optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCheckWallet}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium transition-colors"
            >
              Load Wallet
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Enter your Ethereum address to include on-chain ETH and USDT balances
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
