'use client';

import { PortfolioSummary as PortfolioSummaryType } from '@/lib/firestore/portfolio';

interface PortfolioSummaryProps {
  summary: PortfolioSummaryType;
}

export default function PortfolioSummary({ summary }: PortfolioSummaryProps) {
  const formatPrice = (price: number): string => {
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const isPositive = summary.totalPnL >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Invested */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <p className="text-sm text-gray-400 mb-2">Total Invested</p>
        <p className="text-2xl font-bold text-white">{formatPrice(summary.totalInvested)}</p>
      </div>

      {/* Current Value */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <p className="text-sm text-gray-400 mb-2">Current Value</p>
        <p className="text-2xl font-bold text-white">{formatPrice(summary.totalCurrentValue)}</p>
      </div>

      {/* Total PnL */}
      <div className={`rounded-lg p-6 border ${isPositive ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'}`}>
        <p className="text-sm text-gray-400 mb-2">Total PnL</p>
        <p className={`text-2xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? '+' : ''}{formatPrice(summary.totalPnL)}
        </p>
      </div>

      {/* PnL Percentage */}
      <div className={`rounded-lg p-6 border ${isPositive ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'}`}>
        <p className="text-sm text-gray-400 mb-2">PnL Percentage</p>
        <p className={`text-2xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? '+' : ''}{summary.totalPnLPercentage.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}
