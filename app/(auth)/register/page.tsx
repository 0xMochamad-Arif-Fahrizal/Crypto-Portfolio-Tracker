'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!auth) {
      setError('Firebase Auth is not initialized. Please check your environment variables.');
      return;
    }

    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError('Failed to create account. Please try again');
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
          Create account
        </h1>
        <p
          style={{
            color: 'var(--ink-2)',
            fontSize: 'var(--text-small)',
            marginBottom: 'var(--s-7)',
          }}
        >
          Start tracking your crypto portfolio
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

          <div>
            <label htmlFor="confirmPassword" className="cf-label">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Creating account...' : 'Create account'}
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
          Already have an account?{' '}
          <Link
            href="/login"
            style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'none' }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
