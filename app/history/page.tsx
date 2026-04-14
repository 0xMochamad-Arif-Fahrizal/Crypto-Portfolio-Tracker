'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/lib/context/AuthContext';
import PriceChart from '@/components/charts/PriceChart';
import Link from 'next/link';

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

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
          <p className="text-zinc-600 text-sm font-mono">LOADING...</p>
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
                  className="text-white font-bold"
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold font-mono uppercase tracking-wider">PRICE HISTORY</h2>
          <p className="text-sm text-zinc-500 mt-1 font-mono">
            Historical price charts for major cryptocurrencies
          </p>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {/* Bitcoin Chart */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 card-glow">
            <h3 className="text-lg font-semibold mb-4 font-mono uppercase tracking-wider">BITCOIN (BTC)</h3>
            <PriceChart coin="bitcoin" symbol="BTC" color="#f7931a" />
          </div>

          {/* Ethereum Chart */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 card-glow">
            <h3 className="text-lg font-semibold mb-4 font-mono uppercase tracking-wider">ETHEREUM (ETH)</h3>
            <PriceChart coin="ethereum" symbol="ETH" color="#627eea" />
          </div>

          {/* Tether Chart */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 card-glow">
            <h3 className="text-lg font-semibold mb-4 font-mono uppercase tracking-wider">TETHER (USDT)</h3>
            <PriceChart coin="tether" symbol="USDT" color="#26a17b" />
          </div>
        </div>
      </main>
    </div>
  );
}
