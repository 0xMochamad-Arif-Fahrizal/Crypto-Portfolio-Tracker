'use client';

import { useState } from 'react';

interface WalletCostBasisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ethCostBasis: number, usdtCostBasis: number) => void;
  currentEthCostBasis?: number;
  currentUsdtCostBasis?: number;
}

export default function WalletCostBasisModal({
  isOpen,
  onClose,
  onSave,
  currentEthCostBasis = 0,
  currentUsdtCostBasis = 0,
}: WalletCostBasisModalProps) {
  const [ethCostBasis, setEthCostBasis] = useState(currentEthCostBasis.toString());
  const [usdtCostBasis, setUsdtCostBasis] = useState(currentUsdtCostBasis.toString());

  if (!isOpen) return null;

  const handleSave = () => {
    const ethValue = parseFloat(ethCostBasis) || 0;
    const usdtValue = parseFloat(usdtCostBasis) || 0;
    onSave(ethValue, usdtValue);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full card-glow">
        <h3 className="text-xl font-bold text-white font-mono mb-4 uppercase tracking-wider">
          Set Wallet Cost Basis
        </h3>
        
        <p className="text-sm text-zinc-500 font-mono mb-6">
          Enter the total amount you invested (in USD) for each asset in your wallet to track P&L accurately.
        </p>

        <div className="space-y-4 mb-6">
          {/* ETH Cost Basis */}
          <div>
            <label className="block text-sm font-bold mb-2 text-white uppercase tracking-wider font-mono">
              ETH Total Invested (USD)
            </label>
            <input
              type="number"
              step="0.01"
              value={ethCostBasis}
              onChange={(e) => setEthCostBasis(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono text-sm transition-colors"
            />
            <p className="text-xs text-zinc-600 mt-1 font-mono">
              Total USD you spent to acquire your ETH
            </p>
          </div>

          {/* USDT Cost Basis */}
          <div>
            <label className="block text-sm font-bold mb-2 text-white uppercase tracking-wider font-mono">
              USDT Total Invested (USD)
            </label>
            <input
              type="number"
              step="0.01"
              value={usdtCostBasis}
              onChange={(e) => setUsdtCostBasis(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono text-sm transition-colors"
            />
            <p className="text-xs text-zinc-600 mt-1 font-mono">
              Total USD you spent to acquire your USDT
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm font-bold transition-colors font-mono"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold transition-colors font-mono"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
