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
      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } catch (err) {
      console.error('Search error:', err);
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

    if (!selectedCoin) {
      setError('Please select a coin');
      return;
    }

    const amountNum = parseFloat(amount);
    const buyPriceNum = parseFloat(buyPrice);

    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (isNaN(buyPriceNum) || buyPriceNum <= 0) {
      setError('Please enter a valid buy price');
      return;
    }

    setLoading(true);

    try {
      // Add to portfolio
      await addOrUpdateAsset(
        userId,
        selectedCoin.id,
        selectedCoin.symbol.toUpperCase(),
        selectedCoin.name,
        amountNum,
        buyPriceNum
      );

      // Record transaction
      await addTransaction({
        userId,
        coinId: selectedCoin.id,
        symbol: selectedCoin.symbol.toUpperCase(),
        name: selectedCoin.name,
        type: 'buy',
        amount: amountNum,
        pricePerCoin: buyPriceNum,
        totalValue: amountNum * buyPriceNum,
        timestamp: new Date(),
      });

      onSuccess();
    } catch (err) {
      console.error('Error adding asset:', err);
      setError('Failed to add asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-semibold mb-4">Add Asset to Portfolio</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Coin Search */}
        {!selectedCoin ? (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Cryptocurrency
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                placeholder="e.g., Bitcoin, Ethereum"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-gray-700 rounded-md border border-gray-600 max-h-60 overflow-y-auto">
                {searchResults.map((coin) => (
                  <button
                    key={coin.id}
                    type="button"
                    onClick={() => handleSelectCoin(coin)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-600 transition-colors text-left"
                  >
                    <img src={coin.thumb} alt={coin.name} className="w-6 h-6 rounded-full" />
                    <div>
                      <p className="text-white font-medium">{coin.name}</p>
                      <p className="text-sm text-gray-400 uppercase">{coin.symbol}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Selected Coin Display */
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
            <div className="flex items-center gap-3">
              <img src={selectedCoin.thumb} alt={selectedCoin.name} className="w-8 h-8 rounded-full" />
              <div>
                <p className="text-white font-medium">{selectedCoin.name}</p>
                <p className="text-sm text-gray-400 uppercase">{selectedCoin.symbol}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCoin(null)}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Change
            </button>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount
          </label>
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Buy Price Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Buy Price (USD)
          </label>
          <input
            type="number"
            step="any"
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            placeholder="0.00"
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Total Value Display */}
        {amount && buyPrice && !isNaN(parseFloat(amount)) && !isNaN(parseFloat(buyPrice)) && (
          <div className="p-3 bg-gray-700 rounded-md">
            <p className="text-sm text-gray-400">Total Investment</p>
            <p className="text-xl font-semibold text-white">
              ${(parseFloat(amount) * parseFloat(buyPrice)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !selectedCoin}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors"
          >
            {loading ? 'Adding...' : 'Add Asset'}
          </button>
        </div>
      </form>
    </div>
  );
}
