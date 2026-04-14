'use client';

import Image from 'next/image';
import { CoinPrice } from '@/lib/api/coingecko';

interface PriceCardProps {
  coin: CoinPrice;
}

export default function PriceCard({ coin }: PriceCardProps) {
  const isPositive = coin.price_change_percentage_24h >= 0;
  const priceChangeColor = isPositive ? 'text-emerald-400' : 'text-red-400';
  const priceChangeBg = isPositive ? 'bg-emerald-400/10' : 'bg-red-400/10';

  // Format large numbers (market cap, volume)
  const formatLargeNumber = (num: number): string => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  // Format price with appropriate decimals
  const formatPrice = (price: number): string => {
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 card-glow transition-colors">
      {/* Header: Logo + Name + Symbol */}
      <div className="flex items-center gap-3 mb-4">
        <Image
          src={coin.image}
          alt={coin.name}
          width={40}
          height={40}
          className="rounded-full"
        />
        <div>
          <h3 className="text-lg font-semibold text-white font-mono">{coin.name}</h3>
          <p className="text-sm text-zinc-500 uppercase tracking-wider font-mono">{coin.symbol}</p>
        </div>
      </div>

      {/* Current Price */}
      <div className="mb-3">
        <p className="text-3xl font-bold text-white font-mono">
          {formatPrice(coin.current_price)}
        </p>
      </div>

      {/* 24h Change */}
      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${priceChangeBg} mb-4`}>
        <span className={`text-sm font-medium font-mono ${priceChangeColor}`}>
          {isPositive ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
        </span>
        <span className="text-xs text-zinc-500 font-mono">24h</span>
      </div>

      {/* Market Stats */}
      <div className="space-y-2 pt-4 border-t border-zinc-800">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500 uppercase tracking-wider font-mono">Market Cap</span>
          <span className="text-white font-medium font-mono">{formatLargeNumber(coin.market_cap)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500 uppercase tracking-wider font-mono">Volume (24h)</span>
          <span className="text-white font-medium font-mono">{formatLargeNumber(coin.total_volume)}</span>
        </div>
      </div>
    </div>
  );
}
