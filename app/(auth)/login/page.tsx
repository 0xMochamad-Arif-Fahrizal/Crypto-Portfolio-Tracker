'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!auth) {
      setError('Firebase Auth is not initialized. Please check your environment variables.');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later');
      } else {
        setError('Failed to login. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="cf-dot-grid"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg)',
        fontFamily: 'var(--font-sans)',
        padding: 'var(--s-6)',
      }}
    >
      <div
        className="cf-enter"
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: 'var(--s-8)',
          boxShadow: 'var(--shadow-2)',
        }}
      >
        {/* Brand */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--s-2)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-small)',
            color: 'var(--ink-3)',
            textDecoration: 'none',
            marginBottom: 'var(--s-7)',
          }}
        >
          ← CryptoFolio
        </Link>

        {/* Heading */}
        <h1
          className="cf-h2"
          style={{ marginBottom: 'var(--s-2)' }}
        >
          Sign in
        </h1>
        <p
          style={{
            color: 'var(--ink-2)',
            fontSize: 'var(--text-small)',
            marginBottom: 'var(--s-7)',
          }}
        >
          Enter your credentials to continue
        </p>

        {/* Error */}
        {error && (
          <div
            style={{
              marginBottom: 'var(--s-5)',
              padding: 'var(--s-3) var(--s-4)',
              background: 'rgba(255,59,48,0.06)',
              border: '1px solid rgba(255,59,48,0.25)',
              borderRadius: 'var(--radius-input)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-small)',
              color: 'var(--negative)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
          <div>
            <label htmlFor="email" className="cf-label">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="cf-input"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="cf-label">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="cf-input"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="cf-btn cf-btn-primary"
            style={{ width: '100%', height: '44px', marginTop: 'var(--s-2)' }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <hr className="cf-hr" style={{ margin: 'var(--s-6) 0' }} />

        <p
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-small)',
            color: 'var(--ink-3)',
          }}
        >
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'none' }}
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
