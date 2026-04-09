'use client';

import Image from 'next/image';
import { PortfolioAsset } from '@/lib/firestore/portfolio';

interface PortfolioTableProps {
  assets: PortfolioAsset[];
  currentPrices: Record<string, number>;
  onRemove?: (coinId: string) => void;
}

export default function PortfolioTable({ assets, currentPrices, onRemove }: PortfolioTableProps) {
  if (assets.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
        <p className="text-gray-400">No assets in portfolio yet</p>
        <p className="text-sm text-gray-500 mt-2">Add your first asset to start tracking</p>
      </div>
    );
  }

  const formatPrice = (price: number): string => {
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatAmount = (amount: number): string => {
    if (amount >= 1) return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
    return amount.toFixed(8);
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Asset
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Holdings
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Avg Buy Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Current Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Total Value
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                PnL
              </th>
              {onRemove && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {assets.map((asset) => {
              const currentPrice = currentPrices[asset.coinId] || 0;
              const currentValue = asset.amount * currentPrice;
              const pnl = currentValue - asset.totalInvested;
              const pnlPercentage = asset.totalInvested > 0 ? (pnl / asset.totalInvested) * 100 : 0;
              const isPositive = pnl >= 0;

              return (
                <tr key={asset.coinId} className="hover:bg-gray-700/50 transition-colors">
                  {/* Asset Name */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-300">
                          {asset.symbol.substring(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{asset.name}</p>
                        <p className="text-xs text-gray-400 uppercase">{asset.symbol}</p>
                      </div>
                    </div>
                  </td>

                  {/* Holdings */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className="text-sm text-white">{formatAmount(asset.amount)}</p>
                    <p className="text-xs text-gray-400">{asset.symbol}</p>
                  </td>

                  {/* Avg Buy Price */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className="text-sm text-white">{formatPrice(asset.averageBuyPrice)}</p>
                  </td>

                  {/* Current Price */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className="text-sm text-white">{formatPrice(currentPrice)}</p>
                  </td>

                  {/* Total Value */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className="text-sm font-medium text-white">{formatPrice(currentValue)}</p>
                    <p className="text-xs text-gray-400">
                      Invested: {formatPrice(asset.totalInvested)}
                    </p>
                  </td>

                  {/* PnL */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {isPositive ? '+' : ''}{formatPrice(pnl)}
                    </p>
                    <p className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{pnlPercentage.toFixed(2)}%
                    </p>
                  </td>

                  {/* Action */}
                  {onRemove && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => onRemove(asset.coinId)}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
