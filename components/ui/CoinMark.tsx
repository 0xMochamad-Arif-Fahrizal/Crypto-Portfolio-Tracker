'use client';

// Coins that have a dedicated SVG in /public/assets/coin-marks/
const KNOWN = new Set(['btc', 'eth', 'sol', 'usdt']);

interface CoinMarkProps {
  symbol: string;
  size?: number;
}

export default function CoinMark({ symbol, size = 36 }: CoinMarkProps) {
  const sym = (symbol || '').toLowerCase();

  if (KNOWN.has(sym)) {
    return (
      <img
        src={`/assets/coin-marks/${sym}.svg`}
        width={size}
        height={size}
        alt={symbol}
        style={{ flexShrink: 0, display: 'block', borderRadius: '50%' }}
      />
    );
  }

  // Fallback for any coin without a dedicated SVG:
  // monogram circle — shows up to 3 chars of the ticker symbol.
  const label = (symbol || '??').slice(0, 3).toUpperCase();
  const fontSize = Math.round(size * 0.35);

  return (
    <div
      aria-label={symbol}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontFamily: 'var(--font-mono)',
        fontSize,
        fontWeight: 600,
        color: 'var(--ink)',
        letterSpacing: '-0.02em',
        userSelect: 'none',
      }}
    >
      {label}
    </div>
  );
}
