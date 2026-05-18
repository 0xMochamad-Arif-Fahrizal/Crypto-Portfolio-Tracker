'use client';

import { PortfolioAsset } from '@/lib/firestore/portfolio';
import CoinMark from '@/components/ui/CoinMark';

interface PortfolioTableProps {
  assets: PortfolioAsset[];
  currentPrices: Record<string, number>;
  onRemove?: (coinId: string) => void;
}

function fmtPrice(price: number): string {
  if (price >= 1) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}

const cellL: React.CSSProperties = { padding: '16px 20px', borderBottom: '1px solid var(--border)' };
const cellR: React.CSSProperties = { ...cellL, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

export default function PortfolioTable({ assets, currentPrices, onRemove }: PortfolioTableProps) {
  const cols = ['Asset', 'Holdings', 'Avg Buy', 'Price', 'Value', 'P&L', 'ROI', ''];

  return (
    <div className="cf-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <div className="cf-section-title">— Manual Assets · {assets.length}</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          <thead>
            <tr>
              {cols.map((h, i) => (
                <th
                  key={h + i}
                  style={{
                    textAlign: i === 0 || i === cols.length - 1 ? 'left' : 'right',
                    fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: 'var(--ink-3)', fontWeight: 500, padding: '14px 20px',
                    borderBottom: '1px solid var(--border)', background: 'var(--surface-2)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 ? (
              <tr>
                <td colSpan={cols.length} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 12 }}>
                  No assets in portfolio yet — add one with the button above.
                </td>
              </tr>
            ) : (
              assets.map((asset, i) => {
                const price = currentPrices[asset.coinId] || 0;
                const value = asset.amount * price;
                const pnl = value - asset.totalInvested;
                const roi = asset.totalInvested > 0 ? (pnl / asset.totalInvested) * 100 : 0;
                const isPos = pnl >= 0;
                const pnlColor = isPos ? 'var(--positive)' : 'var(--negative)';

                return (
                  <tr
                    key={asset.coinId}
                    style={{ animation: `cf-fade-up 240ms ${i * 30}ms both` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={cellL}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CoinMark symbol={asset.symbol} size={26} />
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{asset.symbol}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-sans)' }}>{asset.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...cellR, color: 'var(--ink)' }}>{asset.amount.toLocaleString('en-US', { maximumFractionDigits: 8 })}</td>
                    <td style={{ ...cellR, color: 'var(--ink)' }}>{fmtPrice(asset.averageBuyPrice)}</td>
                    <td style={{ ...cellR, color: 'var(--ink)' }}>{fmtPrice(price)}</td>
                    <td style={{ ...cellR, fontWeight: 500, color: 'var(--ink)' }}>{fmtPrice(value)}</td>
                    <td style={{ ...cellR, color: pnlColor, fontWeight: 500 }}>
                      {isPos ? '+' : '−'}${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ ...cellR, color: pnlColor }}>
                      {isPos ? '▲' : '▼'} {Math.abs(roi).toFixed(2)}%
                    </td>
                    {onRemove ? (
                      <td style={cellL}>
                        <button
                          onClick={() => onRemove(asset.coinId)}
                          className="cf-btn cf-btn-ghost"
                          style={{ height: 28, padding: '0 8px', color: 'var(--ink-3)', fontSize: 11 }}
                          title="Remove asset"
                        >
                          ✕
                        </button>
                      </td>
                    ) : <td />}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
