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
  const safeGrandTotal = isNaN(grandTotalValue) ? 0 : grandTotalValue;
  const safePnL = isNaN(grandTotalPnL) ? 0 : grandTotalPnL;

  return (
    <div className="cf-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <div className="cf-section-title" style={{ marginBottom: 8 }}>— Total Portfolio Value</div>
          <div className="cf-display-pixel" style={{ fontSize: 'clamp(26px, 8vw, 48px)', color: 'var(--ink)', lineHeight: 1, overflowWrap: 'anywhere' }}>
            ${safeGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div>
            <div className="cf-section-title" style={{ marginBottom: 4 }}>— Total P&L</div>
            <div className="cf-num" style={{ fontSize: 24, fontWeight: 600, color: isPnLPositive ? 'var(--positive)' : 'var(--negative)' }}>
              {isPnLPositive ? '+' : ''}${safePnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div className="cf-section-title" style={{ marginBottom: 4 }}>— Last Updated</div>
            <div className="cf-ticker" style={{ color: 'var(--ink-3)' }}>
              {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
