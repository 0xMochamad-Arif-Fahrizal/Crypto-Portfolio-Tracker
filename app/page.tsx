'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { fetchCoinPrices, CoinPrice } from '@/lib/api/coingecko';
import Icon from '@/components/ui/Icon';
import { useScrollReveal } from '@/components/ui/useScrollReveal';
import { useFluctuatingNumber } from '@/components/ui/useFluctuatingNumber';
import MarketingFooter from '@/components/ui/MarketingFooter';

const DEMO_PRICES = [
  { symbol: 'BTC', price: 67420.18, change: 2.34 },
  { symbol: 'ETH', price: 3248.72, change: -1.12 },
  { symbol: 'SOL', price: 182.45, change: 5.67 },
  { symbol: 'USDT', price: 1.00, change: 0.01 },
  { symbol: 'BNB', price: 595.30, change: 1.89 },
] as const;

// Same five coins as DEMO_PRICES, in the same on-screen order — used to
// fetch real prices via the existing fetchCoinPrices() (also used by
// dashboard/portfolio). DEMO_PRICES above stays as the fallback shown
// until the first fetch resolves, or if it ever fails.
const LIVE_PRICE_IDS = ['bitcoin', 'ethereum', 'solana', 'tether', 'binancecoin'];
const LIVE_PRICE_SYMBOLS = ['BTC', 'ETH', 'SOL', 'USDT', 'BNB'];

// Demo tile figures (decorative, not real data). The animated total wanders
// around DEMO_TOTAL_VALUE; P&L $ and P&L % are always derived from it
// against a fixed DEMO_COST_BASIS, so the three numbers never contradict
// each other no matter what the total lands on.
const DEMO_TOTAL_VALUE = 12_847.32;
const DEMO_PNL = 1_247.5;
const DEMO_COST_BASIS = DEMO_TOTAL_VALUE - DEMO_PNL;

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

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [livePrices, setLivePrices] = useState<CoinPrice[]>([]);
  const demo = useFluctuatingNumber({ base: DEMO_TOTAL_VALUE, volatility: 0.025 });
  const demoPnl = demo.value - DEMO_COST_BASIS;
  const demoPnlPercent = (demoPnl / DEMO_COST_BASIS) * 100;
  const demoMotionStyle = {
    filter: demo.blur > 0.05 ? `blur(${demo.blur.toFixed(2)}px)` : 'none',
    transform: `translateY(${demo.shiftY.toFixed(2)}px)`,
    willChange: 'filter, transform',
  } as const;

  useScrollReveal();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    let cancelled = false;

    const loadLivePrices = async () => {
      const data = await fetchCoinPrices(LIVE_PRICE_IDS);
      // Only adopt the fetched prices if at least one came back non-zero —
      // fetchCoinPrices() resolves with zeroed placeholders (never throws)
      // when every retry fails, and showing those would be worse than
      // just keeping the static DEMO_PRICES fallback.
      if (!cancelled && data.some((c) => c.current_price > 0)) {
        setLivePrices(data);
      }
    };

    loadLivePrices();
    const interval = setInterval(loadLivePrices, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const orderedLive = LIVE_PRICE_SYMBOLS
    .map((sym) => livePrices.find((c) => c.symbol.toUpperCase() === sym))
    .filter((c): c is CoinPrice => Boolean(c));
  const displayPrices = orderedLive.length === LIVE_PRICE_SYMBOLS.length
    ? orderedLive.map((c) => ({
        symbol: c.symbol.toUpperCase(),
        price: c.current_price,
        change: c.price_change_percentage_24h ?? 0,
      }))
    : DEMO_PRICES;

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

          {/* Desktop nav */}
          <nav className="hidden md:flex" style={{ alignItems: 'center', gap: 4 }}>
            <a href="#features" className="cf-btn cf-btn-ghost" style={{ height: 32, textDecoration: 'none' }}>Features</a>
            <a href="#how" className="cf-btn cf-btn-ghost" style={{ height: 32, textDecoration: 'none' }}>How it works</a>
            <Link href="/login" className="cf-btn cf-btn-secondary" style={{ marginLeft: 8, textDecoration: 'none' }}>Sign in</Link>
            <Link href="/register" className="cf-btn cf-btn-primary" style={{ textDecoration: 'none' }}>Get started →</Link>
          </nav>

          {/* Mobile hamburger toggle — wrapped in a plain span so `md:hidden`
              (a Tailwind utility, layered) isn't fought over `display` by
              `.cf-btn` (unlayered custom CSS always wins layered rules). */}
          <span className="md:hidden">
            <button
              type="button"
              className="cf-btn cf-btn-ghost"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              style={{ width: 40, height: 40, padding: 0 }}
            >
              <Icon name={menuOpen ? 'x' : 'menu'} size={18} />
            </button>
          </span>
        </div>

        {/* Mobile nav panel */}
        <div
          className="md:hidden"
          style={{
            maxHeight: menuOpen ? 320 : 0,
            opacity: menuOpen ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 260ms ease, opacity 200ms ease',
            borderTop: menuOpen ? '1px solid var(--border)' : 'none',
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 24px 20px', maxWidth: 1080, margin: '0 auto' }}>
            <a href="#features" className="cf-btn cf-btn-ghost" style={{ justifyContent: 'flex-start', textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how" className="cf-btn cf-btn-ghost" style={{ justifyContent: 'flex-start', textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>How it works</a>
            <Link href="/login" className="cf-btn cf-btn-secondary" style={{ justifyContent: 'flex-start', textDecoration: 'none', marginTop: 8 }} onClick={() => setMenuOpen(false)}>Sign in</Link>
            <Link href="/register" className="cf-btn cf-btn-primary" style={{ justifyContent: 'center', textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Get started →</Link>
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
            Crypto portfolio tracker · ETH + SOL · real-time
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
            FIFO cost basis. Live prices. No wallet connect, just paste a public address.
          </p>

          {/* Demo tile */}
          <div
            className="cf-card cf-enter"
            style={{ maxWidth: 420, margin: '0 auto 28px', background: 'var(--bg)', boxShadow: 'var(--shadow-2)', animationDelay: '80ms' }}
          >
            <div className="cf-section-title" style={{ marginBottom: 14 }}>Total Portfolio Value</div>
            <div className="cf-display-pixel" style={{ fontSize: 'clamp(32px, 9vw, 56px)', overflowWrap: 'anywhere', ...demoMotionStyle }}>
              ${demo.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
              <div style={{ textAlign: 'left' }}>
                <div className="cf-ticker" style={{ color: 'var(--ink-3)' }}>24h P&amp;L</div>
                <div className="cf-num" style={{ fontSize: 18, fontWeight: 500, marginTop: 4, color: 'var(--positive)', ...demoMotionStyle }}>
                  +${demoPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <span className="cf-pill cf-pill-positive" style={demoMotionStyle}>▲ {demoPnlPercent.toFixed(2)}%</span>
            </div>
          </div>

          <div className="cf-enter" style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', animationDelay: '120ms' }}>
            <Link href="/register" className="cf-btn cf-btn-primary" style={{ height: 44, padding: '0 20px', textDecoration: 'none' }}>
              Start tracking
            </Link>
          </div>
          <div className="cf-ticker" style={{ color: 'var(--ink-3)', marginTop: 18 }}>
            Free forever
          </div>
        </div>
      </section>

      {/* ── Price Strip ── */}
      <section style={{ borderBottom: '1px solid var(--border)' }}>
        <div
          data-reveal
          className="cf-reveal flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-8"
          style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 24px' }}
        >
          <span className="cf-section-title flex-shrink-0">Live</span>
          <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:gap-8 lg:overflow-x-auto">
            {displayPrices.map((c) => (
              <div key={c.symbol} className="flex items-center justify-between gap-2 lg:justify-start lg:flex-shrink-0">
                <span className="flex items-center gap-2">
                  <span className="cf-ticker">{c.symbol}</span>
                  <span className="cf-num" style={{ fontSize: 13, fontWeight: 500 }}>
                    ${c.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
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
          <div data-reveal className="cf-reveal">
            <div className="cf-section-title" style={{ marginBottom: 14 }}>What it does</div>
            <h2
              className="cf-h1"
              style={{ margin: '0 0 56px', fontSize: 'clamp(32px, 4vw, 44px)', maxWidth: 720, letterSpacing: '-0.02em' }}
            >
              Built for people who already know<br />
              <span style={{ color: 'var(--ink-3)' }}>how to count their coins.</span>
            </h2>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
          }}>
            {FEATURES.map((f, i) => (
              <div
                key={f.eyebrow}
                data-reveal
                className="cf-reveal"
                style={{ background: 'var(--bg)', padding: '32px 28px', transitionDelay: `${i * 80}ms` }}
              >
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
          <div data-reveal className="cf-reveal">
            <div className="cf-section-title" style={{ marginBottom: 14 }}>How it works</div>
            <h2
              className="cf-h1"
              style={{ margin: '0 0 48px', fontSize: 'clamp(32px, 4vw, 44px)', letterSpacing: '-0.02em' }}
            >
              Three steps. <span style={{ color: 'var(--ink-3)' }}>Under a minute.</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                data-reveal
                className="cf-card cf-reveal"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="cf-num" style={{ fontSize: 28, color: 'var(--ink-3)', letterSpacing: '-0.02em', marginBottom: 24 }}>{s.n}</div>
                <h3 className="cf-h3" style={{ fontSize: 18, margin: '0 0 8px', fontWeight: 600 }}>{s.title}</h3>
                <p className="cf-body cf-muted" style={{ margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Real audit, not staged numbers ── */}
      <section id="proof" style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '80px 24px' }}>
          <div data-reveal className="cf-reveal" style={{ marginBottom: 40 }}>
            <div className="cf-section-title" style={{ marginBottom: 14 }}>Real data, not a demo</div>
            <h2 className="cf-h1" style={{ margin: '0 0 16px', fontSize: 'clamp(32px, 4vw, 44px)', letterSpacing: '-0.02em' }}>
              We ran it for real. <span style={{ color: 'var(--ink-3)' }}>Here&apos;s the receipt.</span>
            </h2>
            <p className="cf-body cf-muted" style={{ margin: 0, maxWidth: 620 }}>
              To verify this actually works, we combined one manual entry with two live on-chain wallets and let CryptoFolio read them for real. The Solana address is a public documentation example, linked below so you can check it yourself; the Ethereum wallet is a real address we tested against, kept unlinked here since it belongs to someone else.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ marginBottom: 20 }}>
            <div data-reveal className="cf-card cf-reveal" style={{ transitionDelay: '0ms' }}>
              <div className="cf-section-title" style={{ marginBottom: 4 }}>Manual entry</div>
              <div className="cf-ticker" style={{ color: 'var(--ink-3)', marginBottom: 16 }}>Firestore · 0.15 BTC</div>
              <div className="cf-num" style={{ fontSize: 26, fontWeight: 600 }}>$9,643.05</div>
              <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--positive)' }}>+$943.05 · ▲ 10.84%</div>
            </div>
            <div data-reveal className="cf-card cf-reveal" style={{ transitionDelay: '80ms' }}>
              <div className="cf-section-title" style={{ marginBottom: 4 }}>Ethereum wallet</div>
              <div className="cf-ticker" style={{ color: 'var(--ink-3)', marginBottom: 16 }}>Alchemy RPC · 0.5314 ETH + 1,867 USDT</div>
              <div className="cf-num" style={{ fontSize: 26, fontWeight: 600 }}>$2,882.68</div>
              <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--negative)' }}>-$2.69 · ▼ 0.09%</div>
            </div>
            <div data-reveal className="cf-card cf-reveal" style={{ transitionDelay: '160ms' }}>
              <div className="cf-section-title" style={{ marginBottom: 4 }}>Solana wallet</div>
              <div className="cf-ticker" style={{ color: 'var(--ink-3)', marginBottom: 16 }}>Helius RPC · 0.0399 SOL</div>
              <div className="cf-num" style={{ fontSize: 26, fontWeight: 600 }}>$3.07</div>
              <a
                href="https://solscan.io/account/vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none' }}
              >
                vines1…6NKPTg <Icon name="external-link" size={11} />
              </a>
            </div>
          </div>

          <div data-reveal className="cf-reveal cf-card" style={{ transitionDelay: '220ms', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)' }}>
            <div>
              <div className="cf-ticker" style={{ color: 'var(--ink-3)', marginBottom: 6 }}>Combined total · Integrated view</div>
              <div className="cf-display-pixel" style={{ fontSize: 'clamp(28px, 5vw, 40px)' }}>$12,525.73</div>
              <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--positive)' }}>+$940.36 · ▲ 8.12% total P&amp;L</div>
            </div>
            <p className="cf-body cf-muted" style={{ margin: 0, maxWidth: 380, fontSize: 13.5, lineHeight: 1.6 }}>
              Manual entries always have an exact cost basis. On-chain, prices come from a live lookup chain per transaction; where it can&apos;t resolve one automatically, a manual override fills the gap so FIFO stays accurate. See{' '}
              <a href="/docs#limitations" style={{ color: 'var(--ink-2)', textDecoration: 'underline', textUnderlineOffset: 2 }}>Docs → Limitations</a>.
            </p>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
