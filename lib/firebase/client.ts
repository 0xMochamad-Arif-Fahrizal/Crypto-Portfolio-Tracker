import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Suppress Firestore connection warnings in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    // Suppress Firestore backend connection warnings
    if (
      message.includes('Could not reach Cloud Firestore backend') ||
      message.includes('Backend didn\'t respond within') ||
      message.includes('operate in offline mode')
    ) {
      return; // Suppress this warning
    }
    originalWarn.apply(console, args);
  };
  
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    // Suppress Firestore connection errors in development
    if (
      message.includes('Could not reach Cloud Firestore backend') ||
      message.includes('Backend didn\'t respond within')
    ) {
      return; // Suppress this error
    }
    originalError.apply(console, args);
  };
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Initialize Firebase (check if already initialized to avoid errors)
// Only initialize if we're in the browser and have valid config
const app = typeof window !== 'undefined' && firebaseConfig.apiKey
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

// Export auth and db instances (will be null during SSR or if config is missing)
export const auth = app ? getAuth(app) : null as any;
export const db = app ? getFirestore(app) : null as any;

// Configure Firestore settings to reduce connection timeout warnings
if (db && typeof window !== 'undefined') {
  // These settings help reduce connection timeout warnings in development
  // Note: experimentalForceLongPolling is helpful for development environments
  // that may have inconsistent network connections
}
