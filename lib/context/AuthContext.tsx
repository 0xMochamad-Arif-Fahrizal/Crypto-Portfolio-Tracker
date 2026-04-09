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
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="max-w-md p-8 bg-red-900/20 border border-red-500 rounded-lg">
          <h2 className="text-xl font-bold text-red-500 mb-4">Authentication Error</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <div className="text-sm text-gray-400">
            <p className="mb-2">Please ensure:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>You have created a <code className="bg-gray-800 px-1 rounded">.env.local</code> file</li>
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
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
