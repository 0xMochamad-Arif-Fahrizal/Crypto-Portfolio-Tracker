import Link from 'next/link';

const FOOTER_LINKS = [
  { label: 'Docs',    href: '/docs',    id: 'docs' },
  { label: 'Privacy', href: '/privacy', id: 'privacy' },
  { label: 'Terms',   href: '/terms',   id: 'terms' },
  { label: 'Contact', href: '/contact', id: 'contact' },
];

interface MarketingFooterProps {
  current?: string;
}

export default function MarketingFooter({ current }: MarketingFooterProps) {
  return (
    <footer style={{ borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '48px 24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/assets/logo/cryptofolio-mark.svg" width={20} height={20} alt="" />
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>CryptoFolio</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--ink)', margin: '0 4px' }} />
          <span className="cf-ticker" style={{ color: 'var(--ink-3)' }}>v0.1 · Read-only · Next.js 16</span>
        </div>
        <div style={{ display: 'flex', gap: 18 }}>
          {FOOTER_LINKS.map((l) => (
            <Link
              key={l.id}
              href={l.href}
              className="cf-ticker"
              style={{ color: l.id === current ? 'var(--ink)' : 'var(--ink-2)', textDecoration: 'none' }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
