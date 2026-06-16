'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/lib/context/AuthContext';
import { getUserAssetsWithLots, calculatePortfolioSummary, removeAsset, PortfolioAsset } from '@/lib/firestore/portfolio';
import { fetchCoinPrices } from '@/lib/api/coingecko';
import PortfolioSummary from '@/components/PortfolioSummary';
import PortfolioTable from '@/components/PortfolioTable';
import AddAssetForm from '@/components/AddAssetForm';
import AppHeader from '@/components/ui/AppHeader';
import Icon from '@/components/ui/Icon';

export default function PortfolioPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const loadPortfolio = async () => {
    if (!user) return;
    try {
      setError(null);
      setLoading(true);
      const userAssets = await getUserAssetsWithLots(user.uid);
      setAssets(userAssets);
      if (userAssets.length > 0) {
        try {
          const coinIds = userAssets.map((a) => a.coinId);
          const prices = await fetchCoinPrices(coinIds);
          const priceMap: Record<string, number> = {};
          prices.forEach((c) => { priceMap[c.id] = c.current_price; });
          setCurrentPrices(priceMap);
        } catch {
          setError('Could not fetch current prices. Showing assets without live prices.');
        }
      }
    } catch {
      setError('Failed to load portfolio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) loadPortfolio(); }, [user]);

  useEffect(() => {
    if (!user || assets.length === 0) return;
    const interval = setInterval(async () => {
      try {
        const prices = await fetchCoinPrices(assets.map((a) => a.coinId));
        const priceMap: Record<string, number> = {};
        prices.forEach((c) => { priceMap[c.id] = c.current_price; });
        setCurrentPrices(priceMap);
      } catch {}
    }, 60000);
    return () => clearInterval(interval);
  }, [user, assets]);

  const handleRemoveAsset = async (coinId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to remove this asset?')) return;
    try {
      await removeAsset(user.uid, coinId);
      loadPortfolio();
    } catch {
      alert('Failed to remove asset. Please try again.');
    }
  };

  const handleLogout = async () => {
    try { if (auth) { await signOut(auth); router.push('/login'); } } catch {}
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--ink)', borderRadius: '50%', animation: 'spin 700ms linear infinite', margin: '0 auto 12px' }} />
          <span className="cf-ticker" style={{ color: 'var(--ink-3)' }}>Loading...</span>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return null;

  const summary = calculatePortfolioSummary(assets, currentPrices);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <AppHeader email={user.email} onLogout={handleLogout} />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <div>
            <div className="cf-section-title" style={{ marginBottom: 10 }}>— Portfolio</div>
            <h1 className="cf-h2" style={{ margin: 0 }}>My manual assets</h1>
            <p className="cf-body cf-muted" style={{ margin: '6px 0 0' }}>
              Logged by hand · @{user.displayName || user.email?.split('@')[0]} · click a row for details
            </p>
          </div>
          <button
            className="cf-btn cf-btn-primary"
            onClick={() => setShowAddForm((v) => !v)}
          >
            {showAddForm ? (
              <><Icon name="x" size={14} /> Cancel</>
            ) : (
              <><Icon name="plus" size={14} /> Add Asset</>
            )}
          </button>
        </div>

        {error && (
          <div style={{ marginBottom: 24, padding: '12px 16px', background: 'var(--negative-bg)', border: '1px solid rgba(255,59,48,0.25)', borderRadius: 8 }}>
            <p className="cf-body" style={{ margin: 0, color: 'var(--negative)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{error}</p>
          </div>
        )}

        {showAddForm && (
          <div className="cf-enter" style={{ marginBottom: 24 }}>
            <AddAssetForm
              userId={user.uid}
              onSuccess={() => { setShowAddForm(false); loadPortfolio(); }}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0' }}>
            <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--ink)', borderRadius: '50%', animation: 'spin 700ms linear infinite', marginBottom: 12 }} />
            <span className="cf-ticker" style={{ color: 'var(--ink-3)' }}>Loading portfolio...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {assets.length > 0 && <PortfolioSummary summary={summary} />}
            <PortfolioTable
              assets={assets}
              currentPrices={currentPrices}
              userId={user.uid}
              onRemove={handleRemoveAsset}
              onAssetsUpdate={setAssets}
            />
          </div>
        )}
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
