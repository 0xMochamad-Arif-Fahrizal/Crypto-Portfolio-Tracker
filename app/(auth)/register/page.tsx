'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const USERNAME_RE = /^[A-Za-z0-9_]{3,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="cf-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        {hint && <span style={{ color: 'var(--ink-3)', textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--font-sans)' }}>{hint}</span>}
      </label>
      {children}
      {error && (
        <div className="cf-ticker" style={{ color: 'var(--negative)', marginTop: 6, textTransform: 'none', letterSpacing: 0 }}>{error}</div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fieldErrors = {
    email: email && !EMAIL_RE.test(email) ? 'Email tidak valid.' : '',
    username: username && !USERNAME_RE.test(username) ? 'Min 3 karakter — huruf, angka, atau underscore saja.' : '',
    password: password && password.length < 6 ? 'Password minimal 6 karakter.' : '',
  };
  const filled = email && username && password;
  const valid = !!(filled && !fieldErrors.email && !fieldErrors.username && !fieldErrors.password);

  const handleSubmit = async () => {
    setTouched({ email: true, username: true, password: true });
    if (!valid) return;

    if (!auth) {
      setError('Firebase Auth is not initialized. Please check your environment variables.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: username.trim() });
      if (db) {
        await setDoc(doc(db, 'users', cred.user.uid), {
          username: username.trim(),
          email: email.trim().toLowerCase(),
          createdAt: serverTimestamp(),
        });
      }
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Akun dengan email ini sudah ada.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Alamat email tidak valid.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password terlalu lemah.');
      } else {
        setError('Gagal membuat akun. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const usernameValid = username && USERNAME_RE.test(username);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* dot-grid backdrop */}
      <div className="cf-dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, transparent 0%, transparent 40%, var(--bg) 80%)' }} />

      {/* Brand header — padding/height matches the landing page & MarketingHeader
          so the logo sits at the exact same position across every page. */}
      <header style={{ position: 'relative', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
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
            <span
              className="cf-btn"
              style={{ flex: 1, height: 34, borderRadius: 8, background: 'var(--bg)', color: 'var(--ink)', boxShadow: 'var(--shadow-1)' }}
            >
              Register
            </span>
            <Link
              href="/login"
              className="cf-btn"
              style={{ flex: 1, height: 34, borderRadius: 8, background: 'transparent', color: 'var(--ink-2)', boxShadow: 'none', textDecoration: 'none' }}
            >
              Log in
            </Link>
          </div>

          <h1 className="cf-h2" style={{ fontWeight: 600, marginBottom: 4 }}>Create your account</h1>
          <p className="cf-body cf-muted" style={{ marginBottom: 24 }}>Track manual assets and on-chain wallets in one place.</p>

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

          <Field label="Username" hint="huruf, angka, _" error={touched.username ? fieldErrors.username : ''}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 13, pointerEvents: 'none' }}>@</span>
              <input
                className="cf-input"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                style={{ paddingLeft: 26 }}
              />
              {usernameValid && (
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--positive)' }}>✓</span>
              )}
            </div>
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
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <div className="cf-ticker cf-muted cf-wrap" style={{ textAlign: 'center', marginTop: 16 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--ink)' }}>Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
