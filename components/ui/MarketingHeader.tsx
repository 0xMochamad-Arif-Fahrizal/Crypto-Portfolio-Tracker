'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

export default function MarketingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

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

        {/* Desktop nav */}
        <nav className="hidden md:flex" style={{ alignItems: 'center', gap: 4 }}>
          <a href="/#features" className="cf-btn cf-btn-ghost" style={{ height: 32, textDecoration: 'none' }}>Features</a>
          <a href="/#how" className="cf-btn cf-btn-ghost" style={{ height: 32, textDecoration: 'none' }}>How it works</a>
          <Link href="/login" className="cf-btn cf-btn-secondary" style={{ marginLeft: 8, textDecoration: 'none' }}>Login</Link>
          <Link href="/dashboard" className="cf-btn cf-btn-primary" style={{ textDecoration: 'none' }}>Open app →</Link>
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
          <a href="/#features" className="cf-btn cf-btn-ghost" style={{ justifyContent: 'flex-start', textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Features</a>
          <a href="/#how" className="cf-btn cf-btn-ghost" style={{ justifyContent: 'flex-start', textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>How it works</a>
          <Link href="/login" className="cf-btn cf-btn-secondary" style={{ justifyContent: 'flex-start', textDecoration: 'none', marginTop: 8 }} onClick={() => setMenuOpen(false)}>Login</Link>
          <Link href="/dashboard" className="cf-btn cf-btn-primary" style={{ justifyContent: 'center', textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Open app →</Link>
        </nav>
      </div>
    </header>
  );
}
