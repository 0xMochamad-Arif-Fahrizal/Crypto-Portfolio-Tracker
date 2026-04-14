'use client';

interface GrandTotalCardProps {
  grandTotalValue: number;
  grandTotalPnL: number;
  lastUpdated: Date;
}

export default function GrandTotalCard({
  grandTotalValue,
  grandTotalPnL,
  lastUpdated,
}: GrandTotalCardProps) {
  const isPnLPositive = grandTotalPnL >= 0;
  
  // Safe values to prevent NaN
  const safeGrandTotal = isNaN(grandTotalValue) ? 0 : grandTotalValue;
  const safePnL = isNaN(grandTotalPnL) ? 0 : grandTotalPnL;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 card-glow">
      <div className="flex flex-col gap-6">
        {/* Main Value */}
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-mono">
            Total Portfolio Value
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white font-mono">
            ${safeGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
        </div>

        {/* Stats Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-zinc-800">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-mono">
              Total P&L
            </p>
            <p className={`text-2xl font-bold font-mono ${isPnLPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPnLPositive ? '+' : ''}${safePnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="text-left sm:text-right">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-mono">
              Last Updated
            </p>
            <p className="text-sm text-zinc-400 font-mono">
              {lastUpdated.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
