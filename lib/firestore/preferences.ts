// User preferences (UI settings) stored in Firestore.
// Path: users/{uid}/preferences/dashboard — covered by the existing
// users/{uid}/{document=**} rule, so no firestore.rules change is needed.
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export const DASHBOARD_MAX_VISIBLE_COINS = 6;

export interface DashboardPreferences {
  visibleCoinIds: string[]; // CoinGecko ids; capped at DASHBOARD_MAX_VISIBLE_COINS
  updatedAt?: Date;
}

const EMPTY: DashboardPreferences = { visibleCoinIds: [] };

export async function getDashboardPreferences(
  userId: string
): Promise<DashboardPreferences> {
  if (!db) throw new Error('Firestore is not initialized');
  const ref = doc(db, 'users', userId, 'preferences', 'dashboard');
  const snap = await getDoc(ref);
  if (!snap.exists()) return EMPTY;
  const data = snap.data() as Partial<DashboardPreferences> & {
    updatedAt?: { toDate?: () => Date };
  };
  return {
    visibleCoinIds: Array.isArray(data.visibleCoinIds)
      ? data.visibleCoinIds.slice(0, DASHBOARD_MAX_VISIBLE_COINS)
      : [],
    updatedAt: data.updatedAt?.toDate?.() || undefined,
  };
}

export async function saveDashboardPreferences(
  userId: string,
  prefs: DashboardPreferences
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const ref = doc(db, 'users', userId, 'preferences', 'dashboard');
  await setDoc(
    ref,
    {
      visibleCoinIds: prefs.visibleCoinIds.slice(0, DASHBOARD_MAX_VISIBLE_COINS),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}
