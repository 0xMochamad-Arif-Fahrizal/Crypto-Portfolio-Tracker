'use client';

import { PortfolioSummary as PortfolioSummaryType } from '@/lib/firestore/portfolio';
import { useCountUp } from '@/components/ui/useCountUp';

interface PortfolioSummaryProps {
  summary: PortfolioSummaryType;
}

function Tile({ label, value, tone }: { label: string; value: number; tone: 'neutral' | 'positive' | 'negative'; }) {
  const animated = useCountUp(Math.abs(value), 600);
  const color = tone === 'positive' ? 'var(--positive)' : tone === 'negative' ? 'var(--negative)' : 'var(--ink)';
  const sign = tone === 'neutral' ? '$' : value >= 0 ? '+$' : '−$';

  return (
    <div className="cf-card cf-enter">
      <div className="cf-section-title" style={{ marginBottom: 12 }}>{label}</div>
      <div className="cf-num" style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.01em', color }}>
        {sign}{animated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}

export default function PortfolioSummary({ summary }: PortfolioSummaryProps) {
  const isPos = summary.totalPnL >= 0;
  const pnlTone = isPos ? 'positive' : 'negative';
  const pnlPctAnimated = useCountUp(Math.abs(summary.totalPnLPercentage), 600);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
      <Tile label="Total Invested" value={summary.totalInvested} tone="neutral" />
      <Tile label="Current Value" value={summary.totalCurrentValue} tone="neutral" />
      <Tile label="Total P&L" value={summary.totalPnL} tone={pnlTone} />
      <div className="cf-card cf-enter" style={{ animationDelay: '120ms' }}>
        <div className="cf-section-title" style={{ marginBottom: 12 }}>P&amp;L %</div>
        <div className="cf-num" style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.01em', color: isPos ? 'var(--positive)' : 'var(--negative)' }}>
          {isPos ? '+' : '−'}{pnlPctAnimated.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
