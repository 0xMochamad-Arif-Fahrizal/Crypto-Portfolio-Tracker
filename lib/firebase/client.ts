import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
