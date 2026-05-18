'use client';

import { useState } from 'react';
import { searchCoins } from '@/lib/api/coingecko';
import { addOrUpdateAsset, addTransaction } from '@/lib/firestore/portfolio';

interface AddAssetFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface CoinSearchResult {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
}

export default function AddAssetForm({ userId, onSuccess, onCancel }: AddAssetFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CoinSearchResult[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<CoinSearchResult | null>(null);
  const [amount, setAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError('');
    try {
      const results = await searchCoins(searchQuery);
      setSearchResults(results.slice(0, 10));
    } catch {
      setError('Failed to search coins. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCoin = (coin: CoinSearchResult) => {
    setSelectedCoin(coin);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!selectedCoin) { setError('Please select a coin'); return; }
    const amountNum = parseFloat(amount);
    const buyPriceNum = parseFloat(buyPrice);
    if (isNaN(amountNum) || amountNum <= 0) { setError('Please enter a valid amount'); return; }
    if (isNaN(buyPriceNum) || buyPriceNum <= 0) { setError('Please enter a valid buy price'); return; }
    setLoading(true);
    try {
      await addOrUpdateAsset(userId, selectedCoin.id, selectedCoin.symbol.toUpperCase(), selectedCoin.name, amountNum, buyPriceNum);
      await addTransaction({ userId, coinId: selectedCoin.id, symbol: selectedCoin.symbol.toUpperCase(), name: selectedCoin.name, type: 'buy', amount: amountNum, pricePerCoin: buyPriceNum, totalValue: amountNum * buyPriceNum, timestamp: new Date() });
      onSuccess();
    } catch {
      setError('Failed to add asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalInvested = amount && buyPrice && !isNaN(parseFloat(amount)) && !isNaN(parseFloat(buyPrice))
    ? parseFloat(amount) * parseFloat(buyPrice)
    : null;

  return (
    <div className="cf-card">
      <div className="cf-section-title" style={{ marginBottom: 18 }}>— Add Manual Asset</div>

      {error && (
        <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--negative-bg)', border: '1px solid rgba(255,59,48,0.25)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--negative)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Coin search / selected */}
        {!selectedCoin ? (
          <div style={{ marginBottom: 14 }}>
            <label className="cf-label">Search Cryptocurrency</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="cf-input"
                style={{ flex: 1 }}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                placeholder="Bitcoin, Ethereum, Solana…"
              />
              <button
                type="button"
                className="cf-btn cf-btn-secondary"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
              >
                {searching ? 'Searching…' : 'Search'}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div style={{ marginTop: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', maxHeight: 240, overflowY: 'auto' }}>
                {searchResults.map((coin) => (
                  <button
                    key={coin.id}
                    type="button"
                    onClick={() => handleSelectCoin(coin)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', textAlign: 'left' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <img src={coin.thumb} alt={coin.name} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{coin.name}</div>
                      <div className="cf-ticker">{coin.symbol.toUpperCase()}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={selectedCoin.thumb} alt={selectedCoin.name} style={{ width: 28, height: 28, borderRadius: '50%' }} />
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{selectedCoin.name}</div>
                <div className="cf-ticker">{selectedCoin.symbol.toUpperCase()}</div>
              </div>
            </div>
            <button type="button" className="cf-btn cf-btn-ghost" onClick={() => setSelectedCoin(null)} style={{ height: 28, fontSize: 11 }}>
              Change
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label className="cf-label">Amount</label>
            <input className="cf-input" type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0000" required />
          </div>
          <div>
            <label className="cf-label">Avg buy price (USD)</label>
            <input className="cf-input" type="number" step="any" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} placeholder="0.00" required />
          </div>
        </div>

        {totalInvested != null && (
          <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--surface-inset)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div className="cf-ticker" style={{ marginBottom: 4 }}>Total Investment</div>
            <div className="cf-num" style={{ fontSize: 18, fontWeight: 500 }}>
              ${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="cf-btn cf-btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="cf-btn cf-btn-primary" disabled={loading || !selectedCoin}>
            {loading ? 'Adding…' : '+ Add Asset'}
          </button>
        </div>
      </form>
    </div>
  );
}
