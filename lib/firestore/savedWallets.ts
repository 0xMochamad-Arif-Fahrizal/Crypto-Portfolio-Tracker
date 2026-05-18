import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export type WalletChain = 'ethereum' | 'solana';

export interface SavedWallet {
  id: string;
  chain: WalletChain;
  address: string;
  label: string;
  manualCostBasis: Record<string, { invested: number }>;
  createdAt: Date;
}

export async function getSavedWallets(userId: string): Promise<SavedWallet[]> {
  if (!db) throw new Error('Firestore is not initialized');
  const walletsRef = collection(db, 'savedWallets', userId, 'wallets');
  const snapshot = await getDocs(walletsRef);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      chain: data.chain,
      address: data.address,
      label: data.label || `${data.chain} wallet`,
      manualCostBasis: data.manualCostBasis || {},
      createdAt: data.createdAt?.toDate?.() || new Date(),
    } as SavedWallet;
  });
}

export async function saveWallet(
  userId: string,
  wallet: Omit<SavedWallet, 'createdAt'>
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const walletRef = doc(db, 'savedWallets', userId, 'wallets', wallet.id);
  await setDoc(walletRef, {
    ...wallet,
    createdAt: Timestamp.now(),
  }, { merge: true });
}

export async function deleteSavedWallet(userId: string, walletId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const walletRef = doc(db, 'savedWallets', userId, 'wallets', walletId);
  await deleteDoc(walletRef);
}

export async function updateSavedWalletLabel(
  userId: string,
  walletId: string,
  label: string
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const walletRef = doc(db, 'savedWallets', userId, 'wallets', walletId);
  await updateDoc(walletRef, { label });
}

export async function updateSavedWalletManualCostBasis(
  userId: string,
  walletId: string,
  coingeckoId: string,
  invested: number
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  const walletRef = doc(db, 'savedWallets', userId, 'wallets', walletId);
  await updateDoc(walletRef, {
    [`manualCostBasis.${coingeckoId}`]: { invested },
  });
}
