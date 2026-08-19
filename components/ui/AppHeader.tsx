'use client';

import { memo, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/Icon';

const TABS = [
  { id: 'dashboard',  label: 'Dashboard',  href: '/dashboard',  icon: 'bar-chart-3' as const },
  { id: 'portfolio',  label: 'Portfolio',  href: '/portfolio',  icon: 'coins'        as const },
  { id: 'wallet',     label: 'Wallet',     href: '/wallet',     icon: 'wallet'       as const },
  { id: 'integrated', label: 'Integrated', href: '/integrated', icon: 'layers'       as const },
];

interface AppHeaderProps {
  displayName?: string | null;
  onLogout?: () => void;
}

function AppHeader({ displayName, onLogout }: AppHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const active = useMemo(() =>
    TABS.find((t) => pathname.startsWith(t.href))?.id ?? '',
    [pathname]
  );

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'saturate(180%) blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 32,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, minWidth: 0 }}>
          <Link
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <img src="/assets/logo/cryptofolio-mark.svg" width={22} height={22} alt="" />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                fontSize: 15,
                color: 'var(--ink)',
                letterSpacing: '-0.01em',
              }}
            >
              CryptoFolio
            </span>
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: 'var(--ink)',
                flexShrink: 0,
              }}
            />
          </Link>
          {/* Desktop tabs */}
          <nav className="hidden md:flex" style={{ gap: 2 }}>
            {TABS.map((t) => (
              <Link
                key={t.id}
                href={t.href}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  padding: '8px 12px',
                  borderRadius: 6,
                  color: t.id === active ? 'var(--ink)' : 'var(--ink-2)',
                  background: t.id === active ? 'var(--surface-2)' : 'transparent',
                  fontWeight: t.id === active ? 500 : 400,
                  textDecoration: 'none',
                  transition: 'color 160ms, background 160ms',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Icon name={t.icon} size={13} />
                {t.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop: username + logout */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 12 }}>
          {displayName && (
            <span className="cf-ticker" style={{ color: 'var(--ink-3)' }}>
              {displayName}
            </span>
          )}
          {onLogout && (
            <button
              className="cf-btn cf-btn-ghost"
              onClick={onLogout}
              style={{ height: 32, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Icon name="log-out" size={14} />
              Logout
            </button>
          )}
        </div>

        {/* Mobile hamburger toggle — wrapped in a plain span so `md:hidden`
            (a Tailwind utility, layered) isn't fought over `display` by
            `.cf-btn` (unlayered custom CSS always wins layered rules). */}
        <span className="md:hidden" style={{ flexShrink: 0 }}>
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

      {/* Mobile menu panel: tabs + username + logout */}
      <div
        className="md:hidden"
        style={{
          maxHeight: menuOpen ? 400 : 0,
          opacity: menuOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 260ms ease, opacity 200ms ease',
          borderTop: menuOpen ? '1px solid var(--border)' : 'none',
        }}
      >
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 24px', maxWidth: 1200, margin: '0 auto' }}>
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                padding: '10px 12px',
                borderRadius: 6,
                color: t.id === active ? 'var(--ink)' : 'var(--ink-2)',
                background: t.id === active ? 'var(--surface-2)' : 'transparent',
                fontWeight: t.id === active ? 500 : 400,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Icon name={t.icon} size={14} />
              {t.label}
            </Link>
          ))}
        </nav>
        {(displayName || onLogout) && (
          <div
            style={{
              padding: '12px 24px 20px',
              maxWidth: 1200,
              margin: '0 auto',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {displayName && (
              <span className="cf-ticker" style={{ color: 'var(--ink-3)' }}>
                {displayName}
              </span>
            )}
            {onLogout && (
              <button
                className="cf-btn cf-btn-ghost"
                onClick={() => { setMenuOpen(false); onLogout(); }}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}
              >
                <Icon name="log-out" size={14} />
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

// Custom comparison function for memo
function arePropsEqual(prevProps: AppHeaderProps, nextProps: AppHeaderProps) {
  return prevProps.displayName === nextProps.displayName && prevProps.onLogout === nextProps.onLogout;
}

export default memo(AppHeader, arePropsEqual);
