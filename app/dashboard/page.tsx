'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/lib/context/AuthContext';
import { fetchCoinPrices, CoinPrice } from '@/lib/api/coingecko';
import PriceCard from '@/components/PriceCard';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [coins, setCoins] = useState<CoinPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch coin prices
  const loadPrices = async () => {
    try {
      setError(null);
      const data = await fetchCoinPrices();
      setCoins(data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch prices:', err);
      setError('Failed to load prices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (user) {
      loadPrices();
    }
  }, [user]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadPrices();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [user]);

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

  const handleRefresh = () => {
    setLoading(true);
    loadPrices();
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
                  className="text-white font-medium"
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
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Live Crypto Prices</h2>
            {lastUpdate && (
              <p className="text-sm text-gray-400 mt-1">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && coins.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          /* Price Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coins.map((coin) => (
              <PriceCard key={coin.id} coin={coin} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && coins.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-gray-400">No price data available</p>
          </div>
        )}
      </main>
    </div>
  );
}
