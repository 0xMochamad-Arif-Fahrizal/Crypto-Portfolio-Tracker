'use client';

import { memo, useMemo } from 'react';
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
  email?: string | null;
  onLogout?: () => void;
}

function AppHeader({ email, onLogout }: AppHeaderProps) {
  const pathname = usePathname();

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
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
          <nav style={{ display: 'flex', gap: 2 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {email && (
            <span className="cf-ticker" style={{ color: 'var(--ink-3)' }}>
              {email}
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
      </div>
    </header>
  );
}

// Custom comparison function for memo
function arePropsEqual(prevProps: AppHeaderProps, nextProps: AppHeaderProps) {
  return prevProps.email === nextProps.email && prevProps.onLogout === nextProps.onLogout;
}

export default memo(AppHeader, arePropsEqual);
