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
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm opacity-90">Total Portfolio Value</p>
          <h2 className="text-4xl font-bold mt-1">
            ${safeGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-75">Total P&L</p>
          <p className={`text-lg font-semibold ${isPnLPositive ? 'text-green-300' : 'text-red-300'}`}>
            {isPnLPositive ? '+' : ''}${safePnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      
      <div className="text-xs opacity-75 mt-4">
        Last updated: {lastUpdated.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        })}
      </div>
    </div>
  );
}
