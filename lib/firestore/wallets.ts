/**
 * Firestore helpers for persisting wallet addresses per user.
 *
 * Path: users/{userId}/settings/wallets
 * Fields: ethAddress, solanaAddress, updatedAt
 */

import { db } from '@/lib/firebase/client';
import { deleteField, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface WalletAddresses {
  ethAddress?: string;
  solanaAddress?: string;
  updatedAt?: Date;
}

/**
 * Save (merge) one or both wallet addresses for the logged-in user.
 * Uses { merge: true } so calling with only ethAddress never wipes solanaAddress.
 */
export async function saveWalletAddresses(
  userId: string,
  addresses: Partial<Pick<WalletAddresses, 'ethAddress' | 'solanaAddress'>>
): Promise<void> {
  if (!db) throw new Error('Firestore not initialised');
  const ref = doc(db, 'users', userId, 'settings', 'wallets');
  await setDoc(ref, { ...addresses, updatedAt: new Date() }, { merge: true });
}

/**
 * Remove one chain's address from the settings document.
 * The other chain's address is untouched.
 */
export async function clearWalletAddress(
  userId: string,
  chain: 'eth' | 'solana'
): Promise<void> {
  if (!db) throw new Error('Firestore not initialised');
  const ref = doc(db, 'users', userId, 'settings', 'wallets');
  const field = chain === 'eth' ? 'ethAddress' : 'solanaAddress';
  await updateDoc(ref, { [field]: deleteField(), updatedAt: new Date() });
}

/**
 * Retrieve saved wallet addresses for the logged-in user.
 * Returns an empty object when nothing has been saved yet.
 */
export async function getWalletAddresses(userId: string): Promise<WalletAddresses> {
  if (!db) return {};
  const ref = doc(db, 'users', userId, 'settings', 'wallets');
  const snap = await getDoc(ref);
  if (!snap.exists()) return {};
  const data = snap.data();
  return {
    ethAddress: data.ethAddress ?? undefined,
    solanaAddress: data.solanaAddress ?? undefined,
  };
}
