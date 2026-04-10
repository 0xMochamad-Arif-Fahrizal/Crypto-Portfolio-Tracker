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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Manual Portfolio Card */}
      <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Manual Portfolio</h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Firebase</span>
        </div>
        
        <div className="mb-2">
          <p className="text-3xl font-bold text-gray-900">
            ${safeManualValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${safeManualAllocation}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {safeManualAllocation.toFixed(1)}%
          </span>
        </div>
        
        {dataCompleteness === 'manual-only' && (
          <p className="text-xs text-gray-500 mt-3">
            💡 Add wallet address to see on-chain assets
          </p>
        )}
      </div>

      {/* Wallet Portfolio Card */}
      <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Wallet Portfolio</h3>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Blockchain</span>
        </div>
        
        <div className="mb-2">
          <p className="text-3xl font-bold text-gray-900">
            ${safeWalletValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${safeWalletAllocation}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {safeWalletAllocation.toFixed(1)}%
          </span>
        </div>
        
        {dataCompleteness === 'wallet-only' && (
          <p className="text-xs text-gray-500 mt-3">
            💡 Add manual assets to track cost basis
          </p>
        )}
      </div>
    </div>
  );
}
