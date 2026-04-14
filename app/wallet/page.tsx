'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Link from 'next/link';

interface WalletBalance {
  address: string;
  eth: string;
  usdt: string;
}

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAddress, setSavedAddress] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load saved wallet address from Firestore
  useEffect(() => {
    const loadSavedAddress = async () => {
      if (!user || !db) return;

      try {
        const walletDoc = await getDoc(doc(db, 'users', user.uid, 'wallet', 'main'));
        if (walletDoc.exists()) {
          const savedAddr = walletDoc.data().address;
          setSavedAddress(savedAddr);
          setAddress(savedAddr);
        }
      } catch (err) {
        console.error('Error loading saved address:', err);
      }
    };

    loadSavedAddress();
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

  // Validate Ethereum address format (client-side)
  const isValidAddress = (addr: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleCheckBalance = async () => {
    setError(null);
    setBalance(null);

    // Client-side validation
    if (!address.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    if (!isValidAddress(address)) {
      setError('Invalid Ethereum address format. Must be 0x followed by 40 hex characters.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/wallet?address=${address}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch balance');
      }

      setBalance(data);
    } catch (err: any) {
      setError(err.message || 'Could not read blockchain, try again');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!user || !db || !balance) return;

    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid, 'wallet', 'main'), {
        address: balance.address,
        savedAt: new Date(),
      });
      setSavedAddress(balance.address);
      alert('Wallet address saved successfully!');
    } catch (err) {
      console.error('Error saving address:', err);
      alert('Failed to save address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Truncate address for display (0x1234...5678)
  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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
                  className="text-white font-bold"
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold font-mono uppercase tracking-wider">CHECK WALLET BALANCE</h2>
          <p className="text-sm text-zinc-500 mt-1 font-mono">
            View your on-chain ETH and USDT balances from Ethereum Mainnet
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6 card-glow">
          <label className="block text-sm font-medium mb-2 font-mono uppercase tracking-wider">
            ETHEREUM WALLET ADDRESS
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
          />
          
          {savedAddress && address === savedAddress && (
            <p className="text-xs text-green-400 mt-2 font-mono">
              ✓ This is your saved wallet address
            </p>
          )}

          <button
            onClick={handleCheckBalance}
            disabled={loading || !address.trim()}
            className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-md font-medium transition-colors font-mono"
          >
            {loading ? 'CHECKING...' : 'CHECK BALANCE'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-950 border border-red-800 rounded-xl font-mono">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Balance Result */}
        {balance && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 card-glow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-mono uppercase tracking-wider">BALANCE</h3>
              <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded font-mono">
                Verified on Ethereum Mainnet
              </span>
            </div>

            <div className="mb-4 p-3 bg-black rounded-md">
              <p className="text-xs text-zinc-500 mb-1 font-mono uppercase tracking-wider">WALLET ADDRESS</p>
              <p className="font-mono text-sm">{truncateAddress(balance.address)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* ETH Balance */}
              <div className="p-4 bg-black rounded-md">
                <p className="text-xs text-zinc-500 mb-1 font-mono uppercase tracking-wider">ETH BALANCE</p>
                <p className="text-2xl font-bold font-mono">
                  {parseFloat(balance.eth).toFixed(4)} Ξ
                </p>
              </div>

              {/* USDT Balance */}
              <div className="p-4 bg-black rounded-md">
                <p className="text-xs text-zinc-500 mb-1 font-mono uppercase tracking-wider">USDT BALANCE</p>
                <p className="text-2xl font-bold font-mono">
                  ${parseFloat(balance.usdt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Save Button */}
            {balance.address !== savedAddress && (
              <button
                onClick={handleSaveAddress}
                disabled={saving}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-md font-medium transition-colors font-mono"
              >
                {saving ? 'SAVING...' : 'SAVE ADDRESS'}
              </button>
            )}

            {balance.address === savedAddress && (
              <p className="text-center text-sm text-green-400 font-mono">
                ✓ This address is saved to your account
              </p>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl font-mono">
          <p className="text-sm text-blue-300">
            <strong>Note:</strong> This feature reads your wallet balance directly from the Ethereum blockchain. 
            You don't need to connect your wallet - just enter any Ethereum address to view its public balance.
          </p>
        </div>
      </main>
    </div>
  );
}
