'use client';

import { useState } from 'react';
import { ChevronDown, Trash2, Plus } from 'lucide-react';
import { PortfolioAsset, Lot, addLot, deleteLot } from '@/lib/firestore/portfolio';
import CoinMark from '@/components/ui/CoinMark';
import Icon from '@/components/ui/Icon';

interface PortfolioTableProps {
  assets: PortfolioAsset[];
  currentPrices: Record<string, number>;
  userId: string;
  onRemove?: (coinId: string) => void;
  onAssetsUpdate?: (assets: PortfolioAsset[]) => void;
}

// ── Formatters ────────────────────────────────────────────────────────

function fmtPrice(price: number): string {
  if (price >= 1) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}

function fmtAmount(n: number, decimals = 6): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

/** Format ISO timestamp → "14 Jun 2026 · 11.23" (WIB) */
function formatLotDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const dateStr = d.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta',
  });
  const timeStr = d.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
  });
  return `${dateStr} · ${timeStr}`;
}

// ── Cell styles ───────────────────────────────────────────────────────

const cellL: React.CSSProperties = { padding: '16px 24px', borderBottom: '1px solid var(--border)' };
const cellR: React.CSSProperties = { ...cellL, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
const lotCellL: React.CSSProperties = { padding: '11px 14px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 12 };
const lotCellR: React.CSSProperties = { ...lotCellL, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

// ── AddLotForm ────────────────────────────────────────────────────────

function AddLotForm({ onCancel, onAdd }: {
  onCancel: () => void;
  onAdd: (data: { amount: number; buyPrice: number; totalCost: number; note: string }) => void;
}) {
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const totalCost = (parseFloat(amount) || 0) * (parseFloat(price) || 0);
  const valid = parseFloat(amount) > 0 && parseFloat(price) > 0;
  const preview = formatLotDate(new Date().toISOString());

  const handleAdd = async () => {
    if (!valid || loading) return;
    setLoading(true);
    await onAdd({ amount: parseFloat(amount), buyPrice: parseFloat(price), totalCost, note: note.trim() });
    setLoading(false);
  };

  return (
    <div style={{ padding: 16, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, marginTop: 12 }}>
      <div className="cf-section-title" style={{ marginBottom: 14 }}>— Add Purchase</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label className="cf-label">Amount</label>
          <input className="cf-input" inputMode="decimal" placeholder="0.0000" value={amount}
            onChange={e => setAmount(e.target.value)} />
        </div>
        <div>
          <label className="cf-label">Buy Price (USD)</label>
          <input className="cf-input" inputMode="decimal" placeholder="0.00" value={price}
            onChange={e => setPrice(e.target.value)} />
        </div>
        <div>
          <label className="cf-label">Total Cost</label>
          <input className="cf-input" readOnly tabIndex={-1}
            value={'$' + totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            style={{ color: 'var(--ink-3)' }} />
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label className="cf-label">Note (optional)</label>
        <input className="cf-input" placeholder="Beli di Binance…" value={note}
          onChange={e => setNote(e.target.value)} style={{ fontFamily: 'var(--font-sans)' }} />
      </div>
      <div className="cf-ticker" style={{ color: 'var(--ink-3)', marginBottom: 12 }}>
        Akan dicatat pada waktu sekarang — {preview}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="cf-btn cf-btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
        <button className="cf-btn cf-btn-primary" disabled={!valid || loading} onClick={handleAdd}>
          {loading ? 'Saving…' : <><Plus size={13} strokeWidth={1.75} style={{ verticalAlign: '-2px' }} /> Add</>}
        </button>
      </div>
    </div>
  );
}

// ── LotBreakdown ──────────────────────────────────────────────────────

function LotBreakdown({
  asset, price, userId,
  onAddLot, onDeleteLot, onRemoveAsset,
}: {
  asset: PortfolioAsset;
  price: number;
  userId: string;
  onAddLot: (lot: Lot) => void;
  onDeleteLot: (lotId: string) => void;
  onRemoveAsset?: () => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const lots = [...(asset.lots || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const headers = ['DATE ADDED', 'AMOUNT', 'BUY PRICE', 'TOTAL COST', 'CURRENT VALUE', 'P&L', 'NOTE', ''];

  const handleAddLot = async (data: { amount: number; buyPrice: number; totalCost: number; note: string }) => {
    const newId = await addLot(userId, asset.coinId, data);
    const newLot: Lot = { id: newId, createdAt: new Date().toISOString(), ...data };
    onAddLot(newLot);
    setShowAddForm(false);
  };

  const handleDeleteLot = async (lotId: string) => {
    if (!confirm('Hapus lot ini?')) return;
    setDeletingId(lotId);
    await deleteLot(userId, asset.coinId, lotId);
    onDeleteLot(lotId);
    setDeletingId(null);
  };

  return (
    <div style={{ padding: '4px 24px 20px 62px', background: 'var(--surface-inset)' }}>
      {/* Lot table */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--bg)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={h + i} style={{
                  textAlign: i === 0 || i === 6 || i === 7 ? 'left' : 'right',
                  fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: 'var(--ink-3)', fontWeight: 500, padding: '10px 14px',
                  borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lots.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 20, textAlign: 'center', color: 'var(--ink-3)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                  No lots — add a purchase below.
                </td>
              </tr>
            )}
            {lots.map((lot) => {
              const curVal = lot.amount * price;
              const pnl = curVal - lot.totalCost;
              const pos = pnl >= 0;
              return (
                <tr key={lot.id} style={{ opacity: deletingId === lot.id ? 0.4 : 1, transition: 'opacity 160ms' }}>
                  <td style={lotCellL}>{formatLotDate(lot.createdAt)}</td>
                  <td style={lotCellR}>{fmtAmount(lot.amount)}</td>
                  <td style={lotCellR}>{fmtPrice(lot.buyPrice)}</td>
                  <td style={lotCellR}>{fmtPrice(lot.totalCost)}</td>
                  <td style={{ ...lotCellR, fontWeight: 500 }}>{fmtPrice(curVal)}</td>
                  <td style={{ ...lotCellR, color: pos ? 'var(--positive)' : 'var(--negative)', fontWeight: 500 }}>
                    {pos ? '+' : '−'}${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ ...lotCellL, fontFamily: 'var(--font-sans)', color: lot.note ? 'var(--ink-2)' : 'var(--ink-4)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lot.note || '—'}
                  </td>
                  <td style={lotCellL}>
                    <button
                      onClick={() => handleDeleteLot(lot.id)}
                      disabled={deletingId === lot.id || lots.length <= 1}
                      title={lots.length <= 1 ? 'Hapus asset untuk menghapus lot terakhir' : 'Hapus lot'}
                      style={{ background: 'none', border: 'none', cursor: lots.length <= 1 ? 'not-allowed' : 'pointer', color: 'var(--negative)', opacity: lots.length <= 1 ? 0.3 : 1, padding: 4, display: 'flex', alignItems: 'center' }}
                    >
                      <Trash2 size={13} strokeWidth={1.75} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add lot form or button */}
      {showAddForm
        ? <AddLotForm onCancel={() => setShowAddForm(false)} onAdd={handleAddLot} />
        : (
          <button className="cf-btn cf-btn-ghost" style={{ height: 32, marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setShowAddForm(true)}>
            <Plus size={13} strokeWidth={1.75} /> Add Purchase
          </button>
        )}

      {/* Remove entire asset */}
      {onRemoveAsset && (
        <div style={{ marginTop: showAddForm ? 12 : 4 }}>
          <button className="cf-btn cf-btn-ghost" style={{ height: 30, color: 'var(--negative)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={onRemoveAsset}>
            <Trash2 size={13} strokeWidth={1.75} /> Remove entire asset
          </button>
        </div>
      )}
    </div>
  );
}

// ── PortfolioTable ────────────────────────────────────────────────────

export default function PortfolioTable({
  assets, currentPrices, userId, onRemove, onAssetsUpdate,
}: PortfolioTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const cols = ['Asset', 'Holdings', 'Avg Buy', 'Price', 'Value', 'P&L', 'ROI', ''];

  /** Optimistically add a lot to local state and recompute aggregates */
  const handleLotAdded = (assetId: string, newLot: Lot) => {
    if (!onAssetsUpdate) return;
    const updated = assets.map(a => {
      if ((a.id ?? a.coinId) !== assetId) return a;
      const lots = [...(a.lots || []), newLot];
      const totalAmount = lots.reduce((s, l) => s + l.amount, 0);
      const totalInvested = lots.reduce((s, l) => s + l.totalCost, 0);
      const averageBuyPrice = totalAmount > 0 ? totalInvested / totalAmount : 0;
      return { ...a, lots, amount: totalAmount, averageBuyPrice, totalInvested };
    });
    onAssetsUpdate(updated);
  };

  /** Optimistically remove a lot from local state and recompute aggregates */
  const handleLotDeleted = (assetId: string, lotId: string) => {
    if (!onAssetsUpdate) return;
    const updated = assets.map(a => {
      if ((a.id ?? a.coinId) !== assetId) return a;
      const lots = (a.lots || []).filter(l => l.id !== lotId);
      const totalAmount = lots.reduce((s, l) => s + l.amount, 0);
      const totalInvested = lots.reduce((s, l) => s + l.totalCost, 0);
      const averageBuyPrice = totalAmount > 0 ? totalInvested / totalAmount : 0;
      return { ...a, lots, amount: totalAmount, averageBuyPrice, totalInvested };
    });
    onAssetsUpdate(updated);
  };

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
                <th key={h + i} style={{
                  textAlign: i === 0 || i === cols.length - 1 ? 'left' : 'right',
                  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: 'var(--ink-3)', fontWeight: 500, padding: '14px 24px',
                  borderBottom: '1px solid var(--border)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 ? (
              <tr>
                <td colSpan={cols.length} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 12 }}>
                  NO ASSETS YET — ADD ONE WITH THE BUTTON ABOVE
                </td>
              </tr>
            ) : (
              assets.map((asset, i) => {
                const assetKey = asset.id ?? asset.coinId;
                const price = currentPrices[asset.coinId] || 0;
                const value = asset.amount * price;
                const pnl = value - asset.totalInvested;
                const roi = asset.totalInvested > 0 ? (pnl / asset.totalInvested) * 100 : 0;
                const isPos = pnl >= 0;
                const pnlColor = isPos ? 'var(--positive)' : 'var(--negative)';
                const expanded = expandedId === assetKey;
                const lotCount = asset.lots?.length ?? 1;

                return (
                  <tr key={asset.coinId}
                    style={{ animation: `cf-fade-up 240ms ${i * 30}ms both`, cursor: 'pointer', background: expanded ? 'var(--surface-inset)' : 'transparent' }}>
                    <td colSpan={8} style={{ padding: 0 }}>
                      {/* Main row */}
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}
                        onClick={() => setExpandedId(expanded ? null : assetKey)}>
                        <tbody>
                          <tr>
                            <td style={cellL}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <CoinMark symbol={asset.symbol} size={26} />
                                <div>
                                  <div style={{ fontWeight: 500, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 7 }}>
                                    {asset.symbol}
                                    <span style={{ fontSize: 9.5, color: 'var(--ink-3)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', fontWeight: 400 }}>
                                      {lotCount} {lotCount === 1 ? 'lot' : 'lots'}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-sans)' }}>{asset.name}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ ...cellR, color: 'var(--ink)' }}>{fmtAmount(asset.amount)}</td>
                            <td style={{ ...cellR, color: 'var(--ink)' }}>{fmtPrice(asset.averageBuyPrice)}</td>
                            <td style={{ ...cellR, color: 'var(--ink)' }}>{fmtPrice(price)}</td>
                            <td style={{ ...cellR, fontWeight: 500, color: 'var(--ink)' }}>{fmtPrice(value)}</td>
                            <td style={{ ...cellR, color: pnlColor, fontWeight: 500 }}>
                              {isPos ? '+' : '−'}${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ ...cellR, color: pnlColor, display: 'table-cell' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <Icon name={isPos ? 'arrow-up-right' : 'arrow-down-right'} size={13} />
                                {Math.abs(roi).toFixed(2)}%
                              </span>
                            </td>
                            <td style={cellL}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <ChevronDown size={15} strokeWidth={1.75} style={{ flexShrink: 0, transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1)', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--ink-2)' }} />
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Expandable lot breakdown */}
                      {expanded && (
                        <LotBreakdown
                          asset={asset}
                          price={price}
                          userId={userId}
                          onAddLot={(lot) => handleLotAdded(assetKey, lot)}
                          onDeleteLot={(lotId) => handleLotDeleted(assetKey, lotId)}
                          onRemoveAsset={onRemove ? () => { setExpandedId(null); onRemove(asset.coinId); } : undefined}
                        />
                      )}
                    </td>
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
