'use client';

import { CoinPrice } from '@/lib/api/coingecko';
import CoinMark from '@/components/ui/CoinMark';
import DeltaPill from '@/components/ui/DeltaPill';
import { useCountUp } from '@/components/ui/useCountUp';

interface PriceCardProps {
  coin: CoinPrice;
}

function fmtBig(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function formatPrice(price: number): string {
  if (price >= 1) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}

export default function PriceCard({ coin }: PriceCardProps) {
  const animated = useCountUp(coin.current_price, 600);
  const pct24h = coin.price_change_percentage_24h ?? null;

  return (
    <div className="cf-card" style={{ height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <CoinMark symbol={coin.symbol} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="cf-h3" style={{ fontSize: 16, fontWeight: 600 }}>{coin.name}</div>
          <div className="cf-ticker">{coin.symbol.toUpperCase()}</div>
        </div>
        <DeltaPill pct={pct24h} />
      </div>

      {/* Price */}
      <div className="cf-num" style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.01em', marginBottom: 16, color: 'var(--ink)' }}>
        {formatPrice(animated)}
      </div>

      {/* Stats */}
      <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="cf-ticker">Market Cap</span>
          <span className="cf-num" style={{ fontSize: 12, color: 'var(--ink)' }}>{fmtBig(coin.market_cap)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="cf-ticker">Volume 24h</span>
          <span className="cf-num" style={{ fontSize: 12, color: 'var(--ink)' }}>{fmtBig(coin.total_volume)}</span>
        </div>
      </div>
    </div>
  );
}
