'use client';

import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DeltaPillProps {
  pct: number | null | undefined;
}

export default function DeltaPill({ pct }: DeltaPillProps) {
  if (pct == null) {
    return <span className="cf-pill cf-pill-neutral">— 24h</span>;
  }
  const positive = pct >= 0;
  return (
    <span className={`cf-pill ${positive ? 'cf-pill-positive' : 'cf-pill-negative'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {positive
        ? <ArrowUpRight size={11} strokeWidth={1.75} />
        : <ArrowDownRight size={11} strokeWidth={1.75} />}
      {Math.abs(pct).toFixed(2)}%
    </span>
  );
}
