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
                  className="text-white font-bold"
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
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold font-mono uppercase tracking-wider">LIVE CRYPTO PRICES</h2>
            {lastUpdate && (
              <p className="text-sm text-zinc-500 mt-1 font-mono">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:cursor-not-allowed rounded-lg text-sm font-mono font-bold transition-colors"
          >
            {loading ? 'REFRESHING...' : 'REFRESH'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-950 border border-red-800 rounded-lg font-mono">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && coins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 font-mono">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-zinc-600 text-sm">Loading prices...</p>
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
          <div className="text-center py-12 font-mono">
            <p className="text-zinc-500 text-sm">NO PRICE DATA AVAILABLE</p>
          </div>
        )}
      </main>
    </div>
  );
}
