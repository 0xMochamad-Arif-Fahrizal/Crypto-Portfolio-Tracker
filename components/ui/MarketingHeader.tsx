import Link from 'next/link';

export default function MarketingHeader() {
  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'saturate(180%) blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src="/assets/logo/cryptofolio-mark.svg" width={22} height={22} alt="" />
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            CryptoFolio
          </span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--ink)' }} />
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <a href="/#features" className="cf-btn cf-btn-ghost" style={{ height: 32, textDecoration: 'none' }}>Features</a>
          <a href="/#how" className="cf-btn cf-btn-ghost" style={{ height: 32, textDecoration: 'none' }}>How it works</a>
          <a href="/#pricing" className="cf-btn cf-btn-ghost" style={{ height: 32, textDecoration: 'none' }}>Pricing</a>
          <Link href="/login" className="cf-btn cf-btn-secondary" style={{ marginLeft: 8, textDecoration: 'none' }}>Login</Link>
          <Link href="/dashboard" className="cf-btn cf-btn-primary" style={{ textDecoration: 'none' }}>Open app →</Link>
        </nav>
      </div>
    </header>
  );
}
