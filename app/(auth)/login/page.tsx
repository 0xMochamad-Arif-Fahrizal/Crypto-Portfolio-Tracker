'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="cf-label">{label}</label>
      {children}
      {error && (
        <div className="cf-ticker" style={{ color: 'var(--negative)', marginTop: 6, textTransform: 'none', letterSpacing: 0 }}>{error}</div>
      )}
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fieldErrors = {
    email: email && !EMAIL_RE.test(email) ? 'Email tidak valid.' : '',
    password: password && password.length < 6 ? 'Password minimal 6 karakter.' : '',
  };
  const filled = email && password;
  const valid = filled && !fieldErrors.email && !fieldErrors.password;

  const handleSubmit = async () => {
    setTouched({ email: true, password: true });
    if (!valid) return;

    if (!auth) {
      setError('Firebase Auth is not initialized. Please check your environment variables.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Email atau password salah.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Terlalu banyak percobaan. Coba lagi nanti.');
      } else {
        setError('Gagal login. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* dot-grid backdrop */}
      <div className="cf-dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, transparent 0%, transparent 40%, var(--bg) 80%)' }} />

      {/* Brand header */}
      <header style={{ position: 'relative', padding: '24px 32px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src="/assets/logo/cryptofolio-mark.svg" width={22} height={22} alt="" />
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15, color: 'var(--ink)', letterSpacing: '-0.01em' }}>CryptoFolio</span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--ink)' }} />
        </Link>
      </header>

      {/* Card */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px 64px' }}>
        <div
          className="cf-enter"
          style={{
            width: 'min(420px, 92vw)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 32,
            boxShadow: 'var(--shadow-2)',
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--surface-2)', borderRadius: 10, marginBottom: 24 }}>
            <Link
              href="/register"
              className="cf-btn"
              style={{ flex: 1, height: 34, borderRadius: 8, background: 'transparent', color: 'var(--ink-2)', boxShadow: 'none', textDecoration: 'none' }}
            >
              Register
            </Link>
            <span
              className="cf-btn"
              style={{ flex: 1, height: 34, borderRadius: 8, background: 'var(--bg)', color: 'var(--ink)', boxShadow: 'var(--shadow-1)' }}
            >
              Log in
            </span>
          </div>

          <h1 className="cf-h2" style={{ fontWeight: 600, marginBottom: 4 }}>Welcome back</h1>
          <p className="cf-body cf-muted" style={{ marginBottom: 24 }}>Log in to your CryptoFolio portfolio.</p>

          {error && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--negative-bg)', border: '1px solid rgba(255,59,48,0.25)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--negative)' }}>
              {error}
            </div>
          )}

          <Field label="Email" error={touched.email ? fieldErrors.email : ''}>
            <input
              className="cf-input"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </Field>

          <Field label="Password" error={touched.password ? fieldErrors.password : ''}>
            <input
              className="cf-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            />
          </Field>

          <button
            className="cf-btn cf-btn-primary"
            style={{ width: '100%', height: 44, marginTop: 8 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>

          <div className="cf-ticker cf-muted cf-wrap" style={{ textAlign: 'center', marginTop: 16 }}>
            New here?{' '}
            <Link href="/register" style={{ color: 'var(--ink)' }}>Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
