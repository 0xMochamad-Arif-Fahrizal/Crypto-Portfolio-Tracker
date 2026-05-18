'use client';

interface DeltaPillProps {
  pct: number | null | undefined;
}

export default function DeltaPill({ pct }: DeltaPillProps) {
  if (pct == null) {
    return <span className="cf-pill cf-pill-neutral">— 24h</span>;
  }
  const positive = pct >= 0;
  return (
    <span className={`cf-pill ${positive ? 'cf-pill-positive' : 'cf-pill-negative'}`}>
      {positive ? '▲' : '▼'} {Math.abs(pct).toFixed(2)}%
    </span>
  );
}
