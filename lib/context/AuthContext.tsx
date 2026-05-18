'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if auth is initialized
    if (!auth) {
      setError('Firebase Auth is not initialized. Please check your environment variables.');
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Auth initialization error:', err);
      setError('Failed to initialize authentication');
      setLoading(false);
    }
  }, []);

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#ffffff' }}>
        <div style={{ maxWidth: 440, padding: '32px', background: '#ffffff', border: '1px solid #e5e5e5', borderRadius: 12 }}>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 600, color: '#FF3B30', marginBottom: 12 }}>Authentication Error</h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#FF3B30', marginBottom: 16 }}>{error}</p>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#A3A3A3' }}>
            <p style={{ marginBottom: 8 }}>Please ensure:</p>
            <ul style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>You have created a <code style={{ background: '#F4F4F4', padding: '1px 4px', borderRadius: 4 }}>.env.local</code> file</li>
              <li>All Firebase environment variables are set correctly</li>
              <li>Your Firebase project is properly configured</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#ffffff' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #e5e5e5', borderTopColor: '#0a0a0a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
