'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';

const DEMO_PRICES = [
  { symbol: 'BTC', price: 67420.18, change: 2.34 },
  { symbol: 'ETH', price: 3248.72, change: -1.12 },
  { symbol: 'SOL', price: 182.45, change: 5.67 },
  { symbol: 'USDT', price: 1.00, change: 0.01 },
  { symbol: 'BNB', price: 595.30, change: 1.89 },
] as const;

const FEATURES = [
  {
    eyebrow: '01',
    title: 'One portfolio.\nManual + on-chain.',
    body: 'Track coins held on exchanges by hand, alongside live ETH and Solana wallet balances pulled straight from the chain. One total. One P&L.',
  },
  {
    eyebrow: '02',
    title: 'FIFO cost basis,\nautomatically.',
    body: 'Paste an Ethereum address. We replay every transaction first-in-first-out, reconciling sends against open lots so your cost basis is always honest.',
  },
  {
    eyebrow: '03',
    title: 'Read-only.\nNothing to sign.',
    body: 'No wallet connection. No seed phrase. Just a public address and a CoinGecko feed. You hold the keys; we just read the numbers.',
  },
] as const;

const STEPS = [
  { n: '01', title: 'Add manual assets', body: 'Log the coins you hold on Binance, Coinbase, or anywhere off-chain. Symbol, amount, average buy price. Done.' },
  { n: '02', title: 'Paste a public address', body: 'Drop an ETH or Solana address on the Wallet page. We fetch balances live every minute via public RPC.' },
  { n: '03', title: 'Watch one number', body: 'The Integrated view merges everything. FIFO does the math. You watch a single total move.' },
] as const;

const FREE_FEATURES = [
  'Unlimited manual assets',
  'One ETH wallet · one Solana wallet',
  'FIFO cost basis engine',
  'Live prices · 60s refresh',
  'Address book',
] as const;

const PRO_FEATURES = [
  'Unlimited wallets, all chains',
  'Tax-lot CSV (HIFO, LIFO too)',
  'DeFi position decoding',
  'Custom alerts',
  'API access',
] as const;

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  if (loading || user) return null;

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'saturate(180%) blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <img src="/assets/logo/cryptofolio-mark.svg" width={22} height={22} alt="" />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              CryptoFolio
            </span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--ink)' }} />
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <a href="#features" className="cf-btn cf-btn-ghost" style={{ height: 32, textDecoration: 'none' }}>Features</a>
            <a href="#how" className="cf-btn cf-btn-ghost" style={{ height: 32, textDecoration: 'none' }}>How it works</a>
            <a href="#pricing" className="cf-btn cf-btn-ghost" style={{ height: 32, textDecoration: 'none' }}>Pricing</a>
            <Link href="/login" className="cf-btn cf-btn-secondary" style={{ marginLeft: 8, textDecoration: 'none' }}>Sign in</Link>
            <Link href="/register" className="cf-btn cf-btn-primary" style={{ textDecoration: 'none' }}>Get started →</Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
        <div className="cf-dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 45%, transparent 0%, transparent 30%, var(--bg) 75%)',
        }} />
        <div style={{ position: 'relative', maxWidth: 1080, margin: '0 auto', padding: '96px 24px 64px', textAlign: 'center' }}>
          <div className="cf-section-title" style={{ marginBottom: 24 }}>
            — Crypto portfolio tracker · ETH + SOL · real-time
          </div>
          <h1
            className="cf-h1 cf-enter"
            style={{ margin: '0 auto 18px', maxWidth: 760, fontSize: 'clamp(40px, 6vw, 64px)', lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 600 }}
          >
            Track every coin.<br />Everywhere.
          </h1>
          <p
            className="cf-body cf-muted cf-enter"
            style={{ margin: '0 auto 32px', maxWidth: 540, fontSize: 16, lineHeight: 1.5, animationDelay: '40ms' }}
          >
            One unified view of your exchange holdings and on-chain wallets.
            FIFO cost basis. Live prices. No wallet connect — just paste a public address.
          </p>

          {/* Demo tile */}
          <div
            className="cf-card cf-enter"
            style={{ maxWidth: 420, margin: '0 auto 28px', background: 'var(--bg)', boxShadow: 'var(--shadow-2)', animationDelay: '80ms' }}
          >
            <div className="cf-section-title" style={{ marginBottom: 14 }}>Total Portfolio Value</div>
            <div className="cf-display-pixel" style={{ fontSize: 56 }}>$12,847.32</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
              <div style={{ textAlign: 'left' }}>
                <div className="cf-ticker" style={{ color: 'var(--ink-3)' }}>24h P&amp;L</div>
                <div className="cf-num" style={{ fontSize: 18, fontWeight: 500, marginTop: 4, color: 'var(--positive)' }}>+$1,247.50</div>
              </div>
              <span className="cf-pill cf-pill-positive">▲ 10.74%</span>
            </div>
          </div>

          <div className="cf-enter" style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', animationDelay: '120ms' }}>
            <Link href="/register" className="cf-btn cf-btn-primary" style={{ height: 44, padding: '0 20px', textDecoration: 'none' }}>
              Start tracking
            </Link>
            <Link href="/login" className="cf-btn cf-btn-ghost" style={{ height: 44, padding: '0 20px', textDecoration: 'none' }}>
              Sign in
            </Link>
          </div>
          <div className="cf-ticker" style={{ color: 'var(--ink-3)', marginTop: 18 }}>
            No credit card · Free forever
          </div>
        </div>
      </section>

      {/* ── Price Strip ── */}
      <section style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 32, overflowX: 'auto' }}>
          <span className="cf-section-title" style={{ flexShrink: 0 }}>— Live</span>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {DEMO_PRICES.map((c) => (
              <div key={c.symbol} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span className="cf-ticker">{c.symbol}</span>
                <span className="cf-num" style={{ fontSize: 13, fontWeight: 500 }}>
                  ${c.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: c.change >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                  {c.change >= 0 ? '▲' : '▼'} {Math.abs(c.change).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '80px 24px' }}>
          <div className="cf-section-title" style={{ marginBottom: 14 }}>— What it does</div>
          <h2
            className="cf-h1"
            style={{ margin: '0 0 56px', fontSize: 'clamp(32px, 4vw, 44px)', maxWidth: 720, letterSpacing: '-0.02em' }}
          >
            Built for people who already know<br />
            <span style={{ color: 'var(--ink-3)' }}>how to count their coins.</span>
          </h2>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
          }}>
            {FEATURES.map((f) => (
              <div key={f.eyebrow} style={{ background: 'var(--bg)', padding: '32px 28px' }}>
                <div className="cf-num" style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>{f.eyebrow}</div>
                <h3 className="cf-h3" style={{ fontSize: 22, margin: '20px 0 12px', whiteSpace: 'pre-line', letterSpacing: '-0.01em', fontWeight: 600 }}>{f.title}</h3>
                <p className="cf-body cf-muted" style={{ margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '80px 24px' }}>
          <div className="cf-section-title" style={{ marginBottom: 14 }}>— How it works</div>
          <h2
            className="cf-h1"
            style={{ margin: '0 0 48px', fontSize: 'clamp(32px, 4vw, 44px)', letterSpacing: '-0.02em' }}
          >
            Three steps. <span style={{ color: 'var(--ink-3)' }}>Under a minute.</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {STEPS.map((s) => (
              <div key={s.n} className="cf-card">
                <div className="cf-num" style={{ fontSize: 28, color: 'var(--ink-3)', letterSpacing: '-0.02em', marginBottom: 24 }}>{s.n}</div>
                <h3 className="cf-h3" style={{ fontSize: 18, margin: '0 0 8px', fontWeight: 600 }}>{s.title}</h3>
                <p className="cf-body cf-muted" style={{ margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '80px 24px' }}>
          <div className="cf-section-title" style={{ marginBottom: 14 }}>— Pricing</div>
          <h2
            className="cf-h1"
            style={{ margin: '0 0 48px', fontSize: 'clamp(32px, 4vw, 44px)', letterSpacing: '-0.02em' }}
          >
            One tier. <span style={{ color: 'var(--ink-3)' }}>Free.</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* Free tier */}
            <div className="cf-card" style={{ padding: 32 }}>
              <div className="cf-section-title" style={{ marginBottom: 14 }}>Free</div>
              <div className="cf-num" style={{ fontSize: 56, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1 }}>$0</div>
              <div className="cf-ticker" style={{ color: 'var(--ink-3)', marginTop: 6 }}>Per month · forever</div>
              <hr className="cf-hr" style={{ margin: '24px 0' }} />
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {FREE_FEATURES.map((t) => (
                  <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-sans)', fontSize: 14 }}>
                    <span style={{ color: 'var(--positive)', fontWeight: 700, fontSize: 12 }}>✓</span>
                    {t}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="cf-btn cf-btn-primary" style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: 28, height: 44, textDecoration: 'none' }}>
                Get started
              </Link>
            </div>

            {/* Pro tier — coming soon */}
            <div className="cf-card" style={{ padding: 32, background: 'var(--surface)' }}>
              <div className="cf-section-title" style={{ marginBottom: 14 }}>Pro — soon</div>
              <div className="cf-num" style={{ fontSize: 56, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--ink-3)' }}>$0</div>
              <div className="cf-ticker" style={{ color: 'var(--ink-3)', marginTop: 6 }}>Coming when it earns it</div>
              <hr className="cf-hr" style={{ margin: '24px 0' }} />
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--ink-2)' }}>
                {PRO_FEATURES.map((t) => (
                  <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-sans)', fontSize: 14 }}>
                    <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>›</span>
                    {t}
                  </li>
                ))}
              </ul>
              <button className="cf-btn cf-btn-secondary" style={{ width: '100%', marginTop: 28, height: 44 }} disabled>
                Notify me when it ships
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '48px 24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/assets/logo/cryptofolio-mark.svg" width={20} height={20} alt="" />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>CryptoFolio</span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--ink)', margin: '0 4px' }} />
            <span className="cf-ticker" style={{ color: 'var(--ink-3)' }}>v0.1 · Read-only · Next.js 16</span>
          </div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            {['Docs', 'Privacy', 'Terms', 'Contact'].map((l) => (
              <a key={l} href="#" className="cf-ticker" style={{ color: 'var(--ink-2)', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
