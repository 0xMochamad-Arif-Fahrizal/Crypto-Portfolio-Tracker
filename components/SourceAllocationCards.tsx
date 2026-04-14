'use client';

interface SourceAllocationCardsProps {
  manualAllocation: number;
  walletAllocation: number;
  manualValue: number;
  walletValue: number;
  dataCompleteness: 'full' | 'manual-only' | 'wallet-only';
}

export default function SourceAllocationCards({
  manualAllocation,
  walletAllocation,
  manualValue,
  walletValue,
  dataCompleteness,
}: SourceAllocationCardsProps) {
  // Ensure values are numbers with defaults
  const safeManualValue = manualValue || 0;
  const safeWalletValue = walletValue || 0;
  const safeManualAllocation = manualAllocation || 0;
  const safeWalletAllocation = walletAllocation || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Manual Portfolio Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 card-glow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Manual Portfolio
          </h3>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full font-mono">
            Firebase
          </span>
        </div>
        
        <div className="mb-4">
          <p className="text-3xl font-bold text-white font-mono">
            ${safeManualValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500 font-mono">Allocation</span>
            <span className="text-white font-bold font-mono">{safeManualAllocation.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${safeManualAllocation}%` }}
            />
          </div>
        </div>
        
        {dataCompleteness === 'manual-only' && (
          <p className="text-xs text-zinc-600 mt-4 font-mono">
            Add wallet address to see on-chain assets
          </p>
        )}
      </div>

      {/* Wallet Portfolio Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 card-glow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Wallet Portfolio
          </h3>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full font-mono">
            Blockchain
          </span>
        </div>
        
        <div className="mb-4">
          <p className="text-3xl font-bold text-white font-mono">
            ${safeWalletValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500 font-mono">Allocation</span>
            <span className="text-white font-bold font-mono">{safeWalletAllocation.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div 
              className="bg-purple-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${safeWalletAllocation}%` }}
            />
          </div>
        </div>
        
        {dataCompleteness === 'wallet-only' && (
          <p className="text-xs text-zinc-600 mt-4 font-mono">
            Add manual assets to track cost basis
          </p>
        )}
      </div>
    </div>
  );
}
