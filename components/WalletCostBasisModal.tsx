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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,10,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div className="cf-card cf-enter" style={{ maxWidth: 440, width: '100%', padding: 32 }}>
        <div className="cf-section-title" style={{ marginBottom: 8 }}>— Set Wallet Cost Basis</div>
        <h2 className="cf-h3" style={{ marginBottom: 8 }}>Cost Basis Override</h2>
        <p className="cf-body" style={{ color: 'var(--ink-3)', marginBottom: 24, fontSize: 13 }}>
          Enter the total amount you invested (in USD) for each asset in your wallet to track P&L accurately.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          <div>
            <label className="cf-label">ETH Total Invested (USD)</label>
            <input
              type="number"
              step="0.01"
              value={ethCostBasis}
              onChange={(e) => setEthCostBasis(e.target.value)}
              placeholder="0.00"
              className="cf-input"
            />
            <p className="cf-ticker" style={{ color: 'var(--ink-3)', marginTop: 4 }}>Total USD you spent to acquire your ETH</p>
          </div>

          <div>
            <label className="cf-label">USDT Total Invested (USD)</label>
            <input
              type="number"
              step="0.01"
              value={usdtCostBasis}
              onChange={(e) => setUsdtCostBasis(e.target.value)}
              placeholder="0.00"
              className="cf-input"
            />
            <p className="cf-ticker" style={{ color: 'var(--ink-3)', marginTop: 4 }}>Total USD you spent to acquire your USDT</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} className="cf-btn cf-btn-secondary" style={{ flex: 1 }}>
            Cancel
          </button>
          <button onClick={handleSave} className="cf-btn cf-btn-primary" style={{ flex: 1 }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
