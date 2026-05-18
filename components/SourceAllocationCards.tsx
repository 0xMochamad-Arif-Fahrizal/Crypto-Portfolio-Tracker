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
  const safeManualValue = manualValue || 0;
  const safeWalletValue = walletValue || 0;
  const safeManualAllocation = manualAllocation || 0;
  const safeWalletAllocation = walletAllocation || 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
      {/* Manual Portfolio Card */}
      <div className="cf-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="cf-section-title">— Manual Portfolio</div>
          <span className="cf-tag">Firebase</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div className="cf-num" style={{ fontSize: 28, fontWeight: 600, color: 'var(--ink)' }}>
            ${safeManualValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="cf-ticker" style={{ color: 'var(--ink-3)' }}>Allocation</span>
            <span className="cf-ticker" style={{ color: 'var(--ink)', fontWeight: 600 }}>{safeManualAllocation.toFixed(1)}%</span>
          </div>
          <div style={{ width: '100%', height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${safeManualAllocation}%`, height: '100%', background: 'var(--ink)', borderRadius: 2, transition: 'width 300ms' }} />
          </div>
        </div>

        {dataCompleteness === 'manual-only' && (
          <p className="cf-ticker" style={{ color: 'var(--ink-3)', marginTop: 12 }}>
            Add wallet address to see on-chain assets
          </p>
        )}
      </div>

      {/* Wallet Portfolio Card */}
      <div className="cf-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="cf-section-title">— Wallet Portfolio</div>
          <span className="cf-tag">Blockchain</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div className="cf-num" style={{ fontSize: 28, fontWeight: 600, color: 'var(--ink)' }}>
            ${safeWalletValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="cf-ticker" style={{ color: 'var(--ink-3)' }}>Allocation</span>
            <span className="cf-ticker" style={{ color: 'var(--ink)', fontWeight: 600 }}>{safeWalletAllocation.toFixed(1)}%</span>
          </div>
          <div style={{ width: '100%', height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${safeWalletAllocation}%`, height: '100%', background: 'var(--ink)', borderRadius: 2, transition: 'width 300ms' }} />
          </div>
        </div>

        {dataCompleteness === 'wallet-only' && (
          <p className="cf-ticker" style={{ color: 'var(--ink-3)', marginTop: 12 }}>
            Add manual assets to track cost basis
          </p>
        )}
      </div>
    </div>
  );
}
