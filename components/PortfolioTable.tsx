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
      <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center card-glow">
        <p className="text-zinc-500 font-mono">No assets in portfolio yet</p>
        <p className="text-sm text-zinc-600 mt-2 font-mono">Add your first asset to start tracking</p>
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
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden card-glow">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-black">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider font-mono">
                Asset
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider font-mono">
                Holdings
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider font-mono">
                Avg Buy Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider font-mono">
                Current Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider font-mono">
                Total Value
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider font-mono">
                PnL
              </th>
              {onRemove && (
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider font-mono">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {assets.map((asset) => {
              const currentPrice = currentPrices[asset.coinId] || 0;
              const currentValue = asset.amount * currentPrice;
              const pnl = currentValue - asset.totalInvested;
              const pnlPercentage = asset.totalInvested > 0 ? (pnl / asset.totalInvested) * 100 : 0;
              const isPositive = pnl >= 0;

              return (
                <tr key={asset.coinId} className="hover:bg-zinc-700/50 transition-colors">
                  {/* Asset Name */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-zinc-300 font-mono">
                          {asset.symbol.substring(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white font-mono">{asset.name}</p>
                        <p className="text-xs text-zinc-500 uppercase font-mono">{asset.symbol}</p>
                      </div>
                    </div>
                  </td>

                  {/* Holdings */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className="text-sm text-white font-mono">{formatAmount(asset.amount)}</p>
                    <p className="text-xs text-zinc-500 font-mono">{asset.symbol}</p>
                  </td>

                  {/* Avg Buy Price */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className="text-sm text-white font-mono">{formatPrice(asset.averageBuyPrice)}</p>
                  </td>

                  {/* Current Price */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className="text-sm text-white font-mono">{formatPrice(currentPrice)}</p>
                  </td>

                  {/* Total Value */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className="text-sm font-medium text-white font-mono">{formatPrice(currentValue)}</p>
                    <p className="text-xs text-zinc-500 font-mono">
                      Invested: {formatPrice(asset.totalInvested)}
                    </p>
                  </td>

                  {/* PnL */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className={`text-sm font-medium font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{formatPrice(pnl)}
                    </p>
                    <p className={`text-xs font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{pnlPercentage.toFixed(2)}%
                    </p>
                  </td>

                  {/* Action */}
                  {onRemove && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => onRemove(asset.coinId)}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors font-mono"
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
