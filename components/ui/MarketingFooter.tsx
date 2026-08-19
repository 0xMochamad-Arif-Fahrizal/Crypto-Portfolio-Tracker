import Link from 'next/link';
import Icon from '@/components/ui/Icon';

const GITHUB_URL = 'https://github.com/0xMochamad-Arif-Fahrizal/Crypto-Portfolio-Tracker';

interface FooterLink {
  label: string;
  href: string;
  id?: string;
  external?: boolean;
}

const PRODUCT_LINKS: FooterLink[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Wallet Tracker', href: '/wallet' },
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
];

const DOCS_LINKS: FooterLink[] = [
  { label: 'Overview', href: '/docs', id: 'docs' },
  { label: 'FIFO Engine', href: '/docs#fifo' },
  { label: 'Wallet Integration', href: '/docs#wallet' },
  { label: 'Limitations', href: '/docs#limitations' },
];

const PROJECT_LINKS: FooterLink[] = [
  { label: 'GitHub Repo', href: GITHUB_URL, external: true },
  { label: 'Privacy', href: '/privacy', id: 'privacy' },
  { label: 'Terms', href: '/terms', id: 'terms' },
  { label: 'Contact', href: '/contact', id: 'contact' },
];

function FooterColumn({ title, links, current }: { title: string; links: FooterLink[]; current?: string }) {
  return (
    <div>
      <div className="cf-ticker" style={{ color: 'rgba(255,255,255,0.38)', marginBottom: 14 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {links.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            target={l.external ? '_blank' : undefined}
            rel={l.external ? 'noopener noreferrer' : undefined}
            className="cf-body"
            style={{
              color: l.id && l.id === current ? '#FFFFFF' : 'rgba(255,255,255,0.68)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              width: 'fit-content',
            }}
          >
            {l.label}
            {l.external && <Icon name="external-link" size={12} style={{ opacity: 0.6 }} />}
          </Link>
        ))}
      </div>
    </div>
  );
}

interface MarketingFooterProps {
  current?: string;
}

export default function MarketingFooter({ current }: MarketingFooterProps) {
  return (
    <footer style={{ background: 'var(--ink)' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '64px 24px 0' }}>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:gap-8">
          <div style={{ maxWidth: 320 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 14 }}>
              <img src="/assets/logo/cryptofolio-mark.svg" width={24} height={24} alt="" />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                CryptoFolio
              </span>
            </Link>
            <p className="cf-body" style={{ color: 'rgba(255,255,255,0.52)', lineHeight: 1.6, margin: '0 0 18px' }}>
              A read-only crypto portfolio tracker built as an undergraduate thesis project. Manual assets, on-chain wallets, and FIFO cost basis in one dashboard.
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="cf-ticker"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                color: 'rgba(255,255,255,0.68)',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: 'var(--radius-pill)',
                padding: '7px 14px',
              }}
            >
              <Icon name="external-link" size={13} />
              View on GitHub
            </a>
          </div>

          <FooterColumn title="Product" links={PRODUCT_LINKS} current={current} />
          <FooterColumn title="Docs" links={DOCS_LINKS} current={current} />
          <FooterColumn title="Project" links={PROJECT_LINKS} current={current} />
        </div>

        <div
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 48, padding: '20px 0 24px' }}
        >
          <span className="cf-ticker cf-wrap" style={{ color: 'rgba(255,255,255,0.4)' }}>
            CryptoFolio For Undergraduate Thesis · Read Only · Next.JS 16
          </span>
          <span className="cf-ticker cf-wrap" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Not financial advice · MIT Licensed
          </span>
        </div>
      </div>
    </footer>
  );
}
