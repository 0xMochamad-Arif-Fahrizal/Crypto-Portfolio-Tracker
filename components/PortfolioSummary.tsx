'use client';

import { PortfolioSummary as PortfolioSummaryType } from '@/lib/firestore/portfolio';

interface PortfolioSummaryProps {
  summary: PortfolioSummaryType;
}

export default function PortfolioSummary({ summary }: PortfolioSummaryProps) {
  const formatPrice = (price: number): string => {
    return `${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const isPositive = summary.totalPnL >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Invested */}
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 card-glow">
        <p className="text-sm font-mono uppercase tracking-wider text-zinc-500 mb-2">Total Invested</p>
        <p className="text-2xl font-bold font-mono text-white">{formatPrice(summary.totalInvested)}</p>
      </div>

      {/* Current Value */}
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 card-glow">
        <p className="text-sm font-mono uppercase tracking-wider text-zinc-500 mb-2">Current Value</p>
        <p className="text-2xl font-bold font-mono text-white">{formatPrice(summary.totalCurrentValue)}</p>
      </div>

      {/* Total PnL */}
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 card-glow">
        <p className="text-sm font-mono uppercase tracking-wider text-zinc-500 mb-2">Total PnL</p>
        <p className={`text-2xl font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{formatPrice(summary.totalPnL)}
        </p>
      </div>

      {/* PnL Percentage */}
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 card-glow">
        <p className="text-sm font-mono uppercase tracking-wider text-zinc-500 mb-2">PnL Percentage</p>
        <p className={`text-2xl font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{summary.totalPnLPercentage.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}
