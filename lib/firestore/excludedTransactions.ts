// Firestore operations for managing excluded transactions
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

// TypeScript interface for excluded transaction
export interface ExcludedTransaction {
  txHash: string;
  excludedAt: Date;
  reason: 'internal_transfer' | 'gift' | 'other';
  note?: string;
  asset: 'ETH' | 'USDT';
  amount: number;
}

/**
 * Add a transaction to the excluded list
 * @param uid - User ID
 * @param tx - Excluded transaction data
 */
export async function addExcludedTx(
  uid: string,
  tx: ExcludedTransaction
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');

  const txRef = doc(db, 'users', uid, 'excludedTxs', tx.txHash);

  await setDoc(txRef, {
    txHash: tx.txHash,
    excludedAt: Timestamp.fromDate(tx.excludedAt),
    reason: tx.reason,
    note: tx.note || null,
    asset: tx.asset,
    amount: tx.amount,
  });
}

/**
 * Remove a transaction from the excluded list
 * @param uid - User ID
 * @param txHash - Transaction hash to remove
 */
export async function removeExcludedTx(
  uid: string,
  txHash: string
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');

  const txRef = doc(db, 'users', uid, 'excludedTxs', txHash);
  await deleteDoc(txRef);
}

/**
 * Get all excluded transaction hashes for a user
 * @param uid - User ID
 * @returns Array of transaction hashes
 */
export async function getExcludedTxHashes(uid: string): Promise<string[]> {
  if (!db) throw new Error('Firestore is not initialized');

  const excludedTxsRef = collection(db, 'users', uid, 'excludedTxs');
  const snapshot = await getDocs(excludedTxsRef);

  return snapshot.docs.map((doc) => doc.data().txHash as string);
}

/**
 * Subscribe to excluded transactions changes
 * @param uid - User ID
 * @param callback - Callback function that receives updated hashes array
 * @returns Unsubscribe function
 */
export function subscribeToExcludedTxs(
  uid: string,
  callback: (hashes: string[]) => void
): () => void {
  if (!db) throw new Error('Firestore is not initialized');

  const excludedTxsRef = collection(db, 'users', uid, 'excludedTxs');

  const unsubscribe = onSnapshot(excludedTxsRef, (snapshot) => {
    const hashes = snapshot.docs.map((doc) => doc.data().txHash as string);
    callback(hashes);
  });

  return unsubscribe;
}
