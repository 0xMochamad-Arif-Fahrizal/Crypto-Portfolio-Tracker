/**
 * Firestore helpers for the Wallet Address Book.
 *
 * Path: users/{userId}/walletBook/{walletId}
 * Fields: name, address, chain, isActive, createdAt
 *
 * Invariant: at most one entry per chain has isActive=true at any time.
 * setActiveWallet() maintains this invariant via a batch write, and also
 * syncs the chosen address into users/{userId}/settings/wallets so the
 * rest of the app (dashboard, integrated) always reads the current active.
 */

import { db } from '@/lib/firebase/client';
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { saveWalletAddresses } from './wallets';

export interface WalletBookEntry {
  id: string;
  name: string;
  address: string;
  chain: 'ETH' | 'SOL';
  isActive: boolean;
  createdAt: Date;
}

function colRef(userId: string) {
  if (!db) throw new Error('Firestore not initialised');
  return collection(db, 'users', userId, 'walletBook');
}

/** Load all entries, sorted oldest-first. */
export async function getWalletBook(userId: string): Promise<WalletBookEntry[]> {
  if (!db) return [];
  const snap = await getDocs(query(colRef(userId), orderBy('createdAt', 'asc')));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id:        d.id,
      name:      data.name     as string,
      address:   data.address  as string,
      chain:     data.chain    as 'ETH' | 'SOL',
      isActive:  (data.isActive as boolean) ?? false,
      createdAt: (data.createdAt as Timestamp | undefined)?.toDate() ?? new Date(),
    };
  });
}

/**
 * Add a new entry to the address book.
 * @returns The new document ID.
 */
export async function addWalletBookEntry(
  userId: string,
  entry: {
    name: string;
    address: string;
    chain: 'ETH' | 'SOL';
    isActive?: boolean;
  },
): Promise<string> {
  if (!db) throw new Error('Firestore not initialised');
  const ref = await addDoc(colRef(userId), {
    name:      entry.name,
    address:   entry.address,
    chain:     entry.chain,
    isActive:  entry.isActive ?? false,
    createdAt: new Date(),
  });
  return ref.id;
}

/**
 * Mark `walletId` as the active wallet for its chain.
 *
 * - Sets isActive=true on the chosen entry.
 * - Sets isActive=false on every other entry of the same chain.
 * - Syncs the address to settings/wallets so dashboard + integrated
 *   auto-load the correct wallet on next visit.
 */
export async function setActiveWallet(
  userId: string,
  walletId: string,
  chain: 'ETH' | 'SOL',
  address: string,
  allEntries: WalletBookEntry[],
): Promise<void> {
  if (!db) throw new Error('Firestore not initialised');

  const batch = writeBatch(db);
  for (const entry of allEntries) {
    if (entry.chain !== chain) continue;
    batch.update(
      doc(db, 'users', userId, 'walletBook', entry.id),
      { isActive: entry.id === walletId },
    );
  }
  await batch.commit();

  // Keep settings/wallets in sync (read by dashboard + integrated)
  if (chain === 'ETH') {
    await saveWalletAddresses(userId, { ethAddress: address });
  } else {
    await saveWalletAddresses(userId, { solanaAddress: address });
  }
}

/** Rename an existing entry. Address is immutable after creation. */
export async function renameWalletBookEntry(
  userId: string,
  walletId: string,
  name: string,
): Promise<void> {
  if (!db) throw new Error('Firestore not initialised');
  await updateDoc(doc(db, 'users', userId, 'walletBook', walletId), { name });
}

/**
 * One-time deduplication: reads the walletBook directly from Firestore,
 * finds entries with the same (address + chain), and deletes all but the
 * first one encountered (Firestore natural order — no orderBy needed).
 *
 * Safe to call on every mount — it is a no-op when there are no duplicates.
 * Duplicates can appear when React Strict Mode double-invokes the auto-
 * migration effect on the first visit, creating two identical documents.
 */
export async function deduplicateWalletBook(userId: string): Promise<void> {
  if (!db) return;

  // No orderBy here — avoids composite index requirement and we don't care
  // which duplicate we keep, only that exactly one survives per address+chain.
  const snap = await getDocs(collection(db, 'users', userId, 'walletBook'));
  if (snap.size <= 1) return;

  const seen = new Map<string, string>(); // normalised key → first docId kept
  const toDelete: string[] = [];

  snap.docs.forEach((d) => {
    const data = d.data();
    const key = `${(data.address as string).toLowerCase()}-${data.chain as string}`;
    if (seen.has(key)) {
      toDelete.push(d.id); // duplicate — will be deleted
    } else {
      seen.set(key, d.id); // first occurrence — keep
    }
  });

  if (toDelete.length === 0) return;

  const batch = writeBatch(db);
  for (const id of toDelete) {
    batch.delete(doc(db, 'users', userId, 'walletBook', id));
  }
  await batch.commit();
  console.log(`[WalletBook] Removed ${toDelete.length} duplicate(s)`);
}

/**
 * Delete an entry from the address book.
 * Caller must ensure the entry is not currently active before calling.
 */
export async function deleteWalletBookEntry(
  userId: string,
  walletId: string,
): Promise<void> {
  if (!db) throw new Error('Firestore not initialised');
  await deleteDoc(doc(db, 'users', userId, 'walletBook', walletId));
}
