'use client';

import { useState } from 'react';

interface TransactionDetail {
  txHash: string;
  timestamp: number;
  dateStr: string;
  direction: 'in' | 'out';
  asset: 'ETH' | 'USDT';
  amount: number;
  priceAtTime: number;
  valueUSD: number;
  isExcluded: boolean;
}

interface WalletTransactionListProps {
  ethTransactions: TransactionDetail[];
  usdtTransactions: TransactionDetail[];
  excludedHashes: string[];
  /** txHash → user-entered buy price (USD). Overrides CoinGecko market price
   *  for cost basis calculation. Useful for ETH received from exchanges. */
  priceOverrides: Record<string, number>;
  onExclude: (txHash: string, asset: 'ETH' | 'USDT', amount: number) => void;
  onInclude: (txHash: string) => void;
  /** Called when user saves or clears a price override. Pass null to reset
   *  to the CoinGecko market price. */
  onPriceOverride: (txHash: string, priceUsd: number | null) => void;
}

type ReasonOption = 'Internal Transfer' | 'Gift Received' | 'Other';

function EditablePriceInput({
  txHash,
  marketPrice,
  override,
  onSave,
  onReset,
}: {
  txHash: string;
  marketPrice: number;
  override?: number;
  onSave: (price: number) => void;
  onReset: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const effectivePrice = override ?? marketPrice;
  const isOverridden = override !== undefined;
  const isMissingPrice = marketPrice === 0 && !isOverridden;

  if (isEditing) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span className="cf-ticker" style={{ color: 'var(--ink-3)' }}>@&nbsp;$</span>
        <input
          type="number"
          min="0"
          step="any"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { const p = parseFloat(draft); if (p > 0) onSave(p); setIsEditing(false); }
            if (e.key === 'Escape') setIsEditing(false);
          }}
          style={{ width: 80, fontFamily: 'var(--font-mono)', fontSize: 12, padding: '2px 6px', border: '1px solid var(--ink)', borderRadius: 4, background: 'var(--bg)', color: 'var(--ink)', outline: 'none' }}
          autoFocus
        />
        <button onClick={() => { const p = parseFloat(draft); if (p > 0) onSave(p); setIsEditing(false); }} className="cf-ticker" style={{ color: 'var(--ink)', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>Save</button>
        <button onClick={() => setIsEditing(false)} className="cf-ticker" style={{ color: 'var(--ink-3)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>✕</button>
      </span>
    );
  }

  if (isMissingPrice) {
    return (
      <button
        onClick={() => { setDraft(''); setIsEditing(true); }}
        title="Harga historis tidak tersedia — klik untuk masukkan harga beli dari exchange"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,152,0,0.08)', border: '1px solid rgba(255,152,0,0.3)', color: '#FF9800', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer' }}
      >
        ✎ Masukkan harga beli
      </button>
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <button
        onClick={() => { setDraft(effectivePrice.toFixed(2)); setIsEditing(true); }}
        title={isOverridden ? `Harga exchange: $${effectivePrice.toFixed(2)} — klik untuk edit` : `Harga pasar CoinGecko: $${effectivePrice.toFixed(2)} — klik untuk masukkan harga beli exchange`}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 13, textDecoration: 'underline dotted', cursor: 'pointer', background: 'none', border: 'none', padding: 0, color: isOverridden ? '#F59E0B' : 'var(--ink-3)' }}
      >
        @ ${effectivePrice.toFixed(2)}{isOverridden ? ' ✎' : ''}
      </button>
      {isOverridden && (
        <button onClick={onReset} title="Reset ke harga pasar CoinGecko" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>reset</button>
      )}
    </span>
  );
}

export default function WalletTransactionList({
  ethTransactions,
  usdtTransactions,
  excludedHashes,
  priceOverrides,
  onExclude,
  onInclude,
  onPriceOverride,
}: WalletTransactionListProps) {
  const [showReasonDropdown, setShowReasonDropdown] = useState<string | null>(null);

  const markExcluded = (transactions: TransactionDetail[]): TransactionDetail[] =>
    transactions.map((tx) => ({ ...tx, isExcluded: excludedHashes.includes(tx.txHash.toLowerCase()) }));

  const ethTxsRaw = markExcluded(ethTransactions).filter((tx) => tx.amount > 0);
  const usdtTxs = markExcluded(usdtTransactions);

  const ethExcludedCount = ethTxsRaw.filter((tx) => tx.isExcluded).length;
  const usdtExcludedCount = usdtTxs.filter((tx) => tx.isExcluded).length;

  const handleMarkAsInternal = (txHash: string) => { setShowReasonDropdown(txHash); };

  const handleReasonSelect = (txHash: string, asset: 'ETH' | 'USDT', amount: number, _reason: ReasonOption) => {
    onExclude(txHash, asset, amount);
    setShowReasonDropdown(null);
  };

  const renderTransaction = (tx: TransactionDetail) => {
    const isShowingDropdown = showReasonDropdown === tx.txHash;
    const isEthIn = tx.asset === 'ETH' && tx.direction === 'in';
    const override = priceOverrides[tx.txHash];
    const effectivePrice = override ?? tx.priceAtTime;
    const effectiveValue = isEthIn ? tx.amount * effectivePrice : tx.valueUSD;
    const isIn = tx.direction === 'in';

    return (
      <div
        key={tx.txHash}
        style={{ borderBottom: '1px solid var(--border)', padding: '16px 0', opacity: tx.isExcluded ? 0.45 : 1 }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          {/* Left side */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="cf-ticker" style={{ color: 'var(--ink-3)' }}>{tx.dateStr}</span>

              <span style={{ padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, background: isIn ? 'rgba(0,200,83,0.08)' : 'rgba(255,59,48,0.08)', color: isIn ? 'var(--positive)' : 'var(--negative)', border: `1px solid ${isIn ? 'rgba(0,200,83,0.2)' : 'rgba(255,59,48,0.2)'}` }}>
                {isIn ? 'IN' : 'OUT'}
              </span>

              {tx.isExcluded && (
                <span style={{ padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, background: 'var(--surface-2)', color: 'var(--ink-3)', border: '1px solid var(--border)' }}>EXCLUDED</span>
              )}
              {isEthIn && override !== undefined && (
                <span style={{ padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, background: 'rgba(245,158,11,0.08)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>HARGA MANUAL</span>
              )}
              {isEthIn && tx.priceAtTime === 0 && override === undefined && (
                <span style={{ padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, background: 'rgba(255,152,0,0.08)', color: '#FF9800', border: '1px solid rgba(255,152,0,0.2)' }}>HARGA MISSING</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: isIn ? 'var(--positive)' : 'var(--negative)', textDecoration: tx.isExcluded ? 'line-through' : 'none' }}>
                {isIn ? '+' : '-'}{tx.amount.toFixed(tx.asset === 'ETH' ? 4 : 2)} {tx.asset}
              </span>

              {tx.direction === 'in' && tx.priceAtTime > 0 && (
                <>
                  {isEthIn ? (
                    <EditablePriceInput txHash={tx.txHash} marketPrice={tx.priceAtTime} override={override} onSave={(p) => onPriceOverride(tx.txHash, p)} onReset={() => onPriceOverride(tx.txHash, null)} />
                  ) : (
                    <span className="cf-ticker" style={{ color: 'var(--ink-3)' }}>@ ${tx.priceAtTime.toFixed(2)}</span>
                  )}
                  <span className="cf-ticker" style={{ color: 'var(--ink-2)' }}>${effectiveValue.toFixed(2)}</span>
                </>
              )}
            </div>

            <div className="cf-ticker" style={{ color: 'var(--ink-3)', fontSize: 11 }}>
              {tx.txHash.substring(0, 10)}…{tx.txHash.substring(tx.txHash.length - 8)}
            </div>
          </div>

          {/* Right side: actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!tx.isExcluded ? (
              <>
                <button onClick={() => handleMarkAsInternal(tx.txHash)} className="cf-btn cf-btn-ghost" style={{ fontSize: 12, padding: '0 12px', height: 32, whiteSpace: 'nowrap' }}>
                  Mark as Internal
                </button>
                {isShowingDropdown && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
                    <span className="cf-ticker" style={{ color: 'var(--ink-3)', padding: '4px 8px' }}>Select reason:</span>
                    {(['Internal Transfer', 'Gift Received', 'Other'] as ReasonOption[]).map((reason) => (
                      <button key={reason} onClick={() => handleReasonSelect(tx.txHash, tx.asset, tx.amount, reason)} className="cf-btn cf-btn-ghost" style={{ fontSize: 12, textAlign: 'left', justifyContent: 'flex-start', height: 32, padding: '0 8px' }}>
                        {reason}
                      </button>
                    ))}
                    <button onClick={() => setShowReasonDropdown(null)} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', cursor: 'pointer', background: 'none', border: 'none', padding: '4px 8px', textAlign: 'left' }}>Cancel</button>
                  </div>
                )}
              </>
            ) : (
              <button onClick={() => onInclude(tx.txHash)} className="cf-btn cf-btn-secondary" style={{ fontSize: 12, padding: '0 12px', height: 32, whiteSpace: 'nowrap' }}>
                Include
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* ETH Transactions */}
      <div className="cf-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="cf-section-title">— ETH Transactions</div>
          <span className="cf-ticker" style={{ color: 'var(--ink-3)' }}>{ethTxsRaw.length} tx ({ethExcludedCount} excluded)</span>
        </div>
        <div style={{ padding: '0 24px 8px' }}>
          <p className="cf-ticker" style={{ color: 'var(--ink-3)', padding: '12px 0', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
            Klik harga&nbsp;
            <span style={{ textDecoration: 'underline dotted' }}>@ $…</span>
            &nbsp;pada transaksi IN untuk masukkan harga beli dari exchange. Harga default adalah harga pasar CoinGecko saat transaksi.
          </p>
          {ethTxsRaw.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>No transactions found</div>
          ) : (
            <div>{ethTxsRaw.map((tx) => renderTransaction(tx))}</div>
          )}
        </div>
      </div>

      {/* USDT Transactions */}
      <div className="cf-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="cf-section-title">— USDT Transactions</div>
          <span className="cf-ticker" style={{ color: 'var(--ink-3)' }}>{usdtTxs.length} tx ({usdtExcludedCount} excluded)</span>
        </div>
        <div style={{ padding: '0 24px 8px' }}>
          {usdtTxs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>No transactions found</div>
          ) : (
            <div>{usdtTxs.map((tx) => renderTransaction(tx))}</div>
          )}
        </div>
      </div>
    </div>
  );
}
