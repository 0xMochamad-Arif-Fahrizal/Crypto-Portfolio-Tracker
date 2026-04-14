'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  getUserAssets, 
  calculatePortfolioSummary, 
  removeAsset,
  PortfolioAsset 
} from '@/lib/firestore/portfolio';
import { fetchCoinPrices } from '@/lib/api/coingecko';
import PortfolioSummary from '@/components/PortfolioSummary';
import PortfolioTable from '@/components/PortfolioTable';
import AddAssetForm from '@/components/AddAssetForm';
import Link from 'next/link';

export default function PortfolioPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load portfolio data
  const loadPortfolio = async () => {
    if (!user) return;

    try {
      setError(null);
      setLoading(true);

      // Get user's assets
      const userAssets = await getUserAssets(user.uid);
      setAssets(userAssets);

      // Fetch current prices for all assets
      if (userAssets.length > 0) {
        try {
          const coinIds = userAssets.map(asset => asset.coinId);
          const prices = await fetchCoinPrices(coinIds);
          
          const priceMap: Record<string, number> = {};
          prices.forEach(coin => {
            priceMap[coin.id] = coin.current_price;
          });
          setCurrentPrices(priceMap);
        } catch (priceErr) {
          console.error('Failed to fetch prices:', priceErr);
          setError('Could not fetch current prices. Showing assets without live prices.');
        }
      }
    } catch (err) {
      console.error('Failed to load portfolio:', err);
      setError('Failed to load portfolio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPortfolio();
    }
  }, [user]);

  // Auto-refresh prices every 60 seconds
  useEffect(() => {
    if (!user || assets.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const coinIds = assets.map(asset => asset.coinId);
        const prices = await fetchCoinPrices(coinIds);
        
        const priceMap: Record<string, number> = {};
        prices.forEach(coin => {
          priceMap[coin.id] = coin.current_price;
        });
        setCurrentPrices(priceMap);
      } catch (err) {
        console.error('Failed to refresh prices:', err);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [user, assets]);

  const handleAddSuccess = () => {
    setShowAddForm(false);
    loadPortfolio();
  };

  const handleRemoveAsset = async (coinId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to remove this asset from your portfolio?')) {
      return;
    }

    try {
      await removeAsset(user.uid, coinId);
      loadPortfolio();
    } catch (err) {
      console.error('Failed to remove asset:', err);
      alert('Failed to remove asset. Please try again.');
    }
  };

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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-zinc-600 text-sm font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const summary = calculatePortfolioSummary(assets, currentPrices);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <h1 className="text-xl sm:text-2xl font-bold text-white font-mono uppercase tracking-wider">
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
                  className="text-white font-bold"
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
                  className="text-zinc-500 hover:text-white transition-colors"
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold font-mono uppercase tracking-wider">MY PORTFOLIO</h2>
            <p className="text-sm text-zinc-500 mt-1 font-mono">{user.email}</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-mono font-bold transition-colors"
          >
            {showAddForm ? 'CANCEL' : '+ ADD ASSET'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-950 border border-red-800 rounded-lg font-mono">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Add Asset Form */}
        {showAddForm && (
          <div className="mb-6">
            <AddAssetForm
              userId={user.uid}
              onSuccess={handleAddSuccess}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 font-mono">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-zinc-600 text-sm">Loading portfolio...</p>
          </div>
        ) : (
          <>
            {/* Portfolio Summary */}
            {assets.length > 0 && (
              <div className="mb-6">
                <PortfolioSummary summary={summary} />
              </div>
            )}

            {/* Portfolio Table */}
            <PortfolioTable
              assets={assets}
              currentPrices={currentPrices}
              onRemove={handleRemoveAsset}
            />
          </>
        )}
      </main>
    </div>
  );
}
