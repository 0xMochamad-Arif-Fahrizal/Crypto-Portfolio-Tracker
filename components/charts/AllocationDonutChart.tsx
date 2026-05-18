'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export interface AssetSlice {
  /** Display label, e.g. "Solana" */
  name: string;
  /** Ticker symbol, e.g. "SOL" — used for colour lookup */
  symbol: string;
  /** Current USD value */
  value: number;
}

interface AllocationDonutChartProps {
  /** All assets to display. Zero-value slices are filtered out automatically. */
  assets: AssetSlice[];
}

const SYMBOL_COLORS: Record<string, string> = {
  BTC:  '#F7931A',
  ETH:  '#627EEA',
  USDT: '#26A17B',
  USDC: '#2775CA',
  SOL:  '#9945FF',
  BNB:  '#F3BA2F',
  XRP:  '#00AAE4',
  ADA:  '#0033AD',
  DOGE: '#C2A633',
  DOT:  '#E6007A',
  MATIC:'#8247E5',
  AVAX: '#E84142',
};

const FALLBACK_PALETTE = [
  '#6366F1', '#F59E0B', '#10B981', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
];

export default function AllocationDonutChart({ assets }: AllocationDonutChartProps) {
  const total = assets.reduce((s, a) => s + (isNaN(a.value) ? 0 : a.value), 0);

  const data = assets
    .filter(a => !isNaN(a.value) && a.value > 0)
    .map(a => ({
      name:       a.symbol.toUpperCase(),
      label:      a.name,
      value:      a.value,
      percentage: total > 0 ? (a.value / total) * 100 : 0,
    }));

  let fallbackIdx = 0;
  const colourOf = (sym: string) =>
    SYMBOL_COLORS[sym] ?? FALLBACK_PALETTE[fallbackIdx++ % FALLBACK_PALETTE.length];

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--font-mono)', boxShadow: 'var(--shadow-1)' }}>
        <p style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13, marginBottom: 4 }}>{d.label} ({d.name})</p>
        <p style={{ color: 'var(--ink-2)', fontSize: 12, marginBottom: 2 }}>
          ${d.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p style={{ color: 'var(--ink-3)', fontSize: 12, fontWeight: 600 }}>{d.percentage.toFixed(1)}%</p>
      </div>
    );
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
        {payload.map((entry: any, i: number) => (
          <div key={`legend-${i}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: entry.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{entry.value}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{entry.payload.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                ${entry.payload.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', minWidth: '3rem', textAlign: 'right' }}>
                {entry.payload.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="cf-card">
        <div className="cf-section-title" style={{ marginBottom: 16 }}>— Asset Allocation</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <p className="cf-ticker" style={{ color: 'var(--ink-3)' }}>No assets to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cf-card">
      <div className="cf-section-title" style={{ marginBottom: 16 }}>— Asset Allocation</div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
            stroke="var(--bg)"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colourOf(entry.name)} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
