// Firestore data structure and operations for portfolio management
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

// ── Lot: a single purchase record for an asset ───────────────────────
export interface Lot {
  id: string;
  createdAt: string; // ISO 8601 string with full timestamp, e.g. "2026-06-14T11:23:45.123Z"
  amount: number;
  buyPrice: number;
  totalCost: number;
  note: string;
}

// TypeScript interfaces for portfolio data
export interface PortfolioAsset {
  id?: string; // Firestore document ID
  userId: string;
  coinId: string; // CoinGecko coin ID (e.g., 'bitcoin')
  symbol: string; // e.g., 'BTC'
  name: string; // e.g., 'Bitcoin'
  amount: number; // Total amount of coins owned (aggregated from lots)
  averageBuyPrice: number; // Average purchase price in USD (aggregated from lots)
  totalInvested: number; // Total USD invested (aggregated from lots)
  createdAt: Date;
  updatedAt: Date;
  lots?: Lot[]; // Populated from subcollection when using getUserAssetsWithLots()
}

// Recompute aggregate fields from a set of lots
function recalcFromLots(lots: Lot[]): { amount: number; averageBuyPrice: number; totalInvested: number } {
  const totalAmount = lots.reduce((s, l) => s + l.amount, 0);
  const totalInvested = lots.reduce((s, l) => s + l.totalCost, 0);
  const averageBuyPrice = totalAmount > 0 ? totalInvested / totalAmount : 0;
  return { amount: totalAmount, averageBuyPrice, totalInvested };
}

export interface Transaction {
  id?: string; // Firestore document ID
  userId: string;
  coinId: string;
  symbol: string;
  name: string;
  type: 'buy' | 'sell';
  amount: number; // Amount of coins
  pricePerCoin: number; // Price per coin in USD at transaction time
  totalValue: number; // Total transaction value (amount * pricePerCoin)
  timestamp: Date;
  notes?: string;
}

export interface WalletCostBasis {
  id?: string; // Firestore document ID
  userId: string;
  walletAddress: string;
  coinSymbol: 'ETH' | 'USDT'; // Only ETH and USDT supported
  averageBuyPrice: number; // Average purchase price in USD
  totalInvested: number; // Total USD invested
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Add or update a portfolio asset
 * If asset exists, updates the amount and average buy price
 * If asset doesn't exist, creates a new one
 */
export async function addOrUpdateAsset(
  userId: string,
  coinId: string,
  symbol: string,
  name: string,
  amount: number,
  buyPrice: number
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');

  const assetRef = doc(db, 'portfolios', userId, 'assets', coinId);
  const assetSnap = await getDoc(assetRef);

  if (assetSnap.exists()) {
    // Update existing asset
    const existingData = assetSnap.data() as PortfolioAsset;
    const newTotalAmount = existingData.amount + amount;
    const newTotalInvested = existingData.totalInvested + (amount * buyPrice);
    const newAverageBuyPrice = newTotalInvested / newTotalAmount;

    await updateDoc(assetRef, {
      amount: newTotalAmount,
      averageBuyPrice: newAverageBuyPrice,
      totalInvested: newTotalInvested,
      updatedAt: Timestamp.now(),
    });
  } else {
    // Create new asset
    const newAsset: Omit<PortfolioAsset, 'id'> = {
      userId,
      coinId,
      symbol,
      name,
      amount,
      averageBuyPrice: buyPrice,
      totalInvested: amount * buyPrice,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(assetRef, newAsset);
  }
}

/**
 * Get all portfolio assets for a user
 */
export async function getUserAssets(userId: string): Promise<PortfolioAsset[]> {
  if (!db) throw new Error('Firestore is not initialized');

  const assetsRef = collection(db, 'portfolios', userId, 'assets');
  const snapshot = await getDocs(assetsRef);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as PortfolioAsset[];
}

/**
 * Get a specific asset
 */
export async function getAsset(userId: string, coinId: string): Promise<PortfolioAsset | null> {
  if (!db) throw new Error('Firestore is not initialized');

  const assetRef = doc(db, 'portfolios', userId, 'assets', coinId);
  const assetSnap = await getDoc(assetRef);

  if (!assetSnap.exists()) return null;

  return {
    id: assetSnap.id,
    ...assetSnap.data(),
    createdAt: assetSnap.data().createdAt?.toDate() || new Date(),
    updatedAt: assetSnap.data().updatedAt?.toDate() || new Date(),
  } as PortfolioAsset;
}

/**
 * Remove an asset from portfolio
 */
export async function removeAsset(userId: string, coinId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');

  const assetRef = doc(db, 'portfolios', userId, 'assets', coinId);
  await deleteDoc(assetRef);
}

// ── Lot CRUD ──────────────────────────────────────────────────────────

/**
 * Get all lots for an asset, sorted newest-first.
 */
export async function getLots(userId: string, coinId: string): Promise<Lot[]> {
  if (!db) throw new Error('Firestore is not initialized');
  const lotsRef = collection(db, 'portfolios', userId, 'assets', coinId, 'lots');
  const snap = await getDocs(lotsRef);
  const lots: Lot[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Lot));
  return lots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Migrate a legacy flat asset to the lots subcollection.
 * Creates one lot from the existing amount/averageBuyPrice/totalInvested.
 * Safe to call multiple times — skips if lots already exist.
 */
export async function migrateLegacyAsset(userId: string, asset: PortfolioAsset): Promise<Lot[]> {
  if (!db) throw new Error('Firestore is not initialized');
  const coinId = asset.coinId;
  const lotsRef = collection(db, 'portfolios', userId, 'assets', coinId, 'lots');
  const existing = await getDocs(lotsRef);
  if (!existing.empty) {
    // Already has lots — return them sorted
    const lots: Lot[] = existing.docs.map(d => ({ id: d.id, ...d.data() } as Lot));
    return lots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  // Build a single migration lot from flat fields
  const legacyCreatedAt = asset.createdAt instanceof Date
    ? asset.createdAt.toISOString()
    : new Date(asset.createdAt).toISOString();
  const migrationLot: Omit<Lot, 'id'> = {
    createdAt: legacyCreatedAt,
    amount: asset.amount,
    buyPrice: asset.averageBuyPrice,
    totalCost: asset.totalInvested,
    note: '',
  };
  const newRef = doc(lotsRef);
  await setDoc(newRef, migrationLot);
  return [{ id: newRef.id, ...migrationLot }];
}

/**
 * Record a new purchase for a coin — the correct entry point from the
 * "Add Asset" form.
 *
 * - If the asset doesn't exist yet, creates an empty shell document first
 *   (so addLot can do updateDoc on it).
 * - Calls addLot() which creates a dated Lot with createdAt = now and
 *   recomputes the aggregate fields (amount, averageBuyPrice, totalInvested).
 *
 * This ensures every purchase through "Add Asset" appears as its own
 * time-stamped lot, exactly like "Add Purchase" in the expanded row.
 */
export async function addAssetWithLot(
  userId: string,
  coinId: string,
  symbol: string,
  name: string,
  amount: number,
  buyPrice: number,
  note: string = '',
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');

  const assetRef = doc(db, 'portfolios', userId, 'assets', coinId);
  const snap = await getDoc(assetRef);

  if (!snap.exists()) {
    // Create the asset shell — aggregates will be written by addLot below
    await setDoc(assetRef, {
      userId,
      coinId,
      symbol,
      name,
      amount: 0,
      averageBuyPrice: 0,
      totalInvested: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await addLot(userId, coinId, { amount, buyPrice, totalCost: amount * buyPrice, note });
}

/**
 * Add a new lot and update the parent asset's aggregate fields.
 * Returns the new lot ID.
 */
export async function addLot(
  userId: string,
  coinId: string,
  lotData: { amount: number; buyPrice: number; totalCost: number; note: string }
): Promise<string> {
  if (!db) throw new Error('Firestore is not initialized');

  const lotsRef = collection(db, 'portfolios', userId, 'assets', coinId, 'lots');
  const assetRef = doc(db, 'portfolios', userId, 'assets', coinId);

  // Save the new lot with a server-side timestamp
  const newLot: Omit<Lot, 'id'> = {
    createdAt: new Date().toISOString(),
    amount: lotData.amount,
    buyPrice: lotData.buyPrice,
    totalCost: lotData.totalCost,
    note: lotData.note,
  };
  const newRef = doc(lotsRef);
  await setDoc(newRef, newLot);

  // Recompute aggregates from all lots
  const allLotsSnap = await getDocs(lotsRef);
  const allLots: Lot[] = allLotsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Lot));
  const { amount, averageBuyPrice, totalInvested } = recalcFromLots(allLots);
  await updateDoc(assetRef, { amount, averageBuyPrice, totalInvested, updatedAt: Timestamp.now() });

  return newRef.id;
}

/**
 * Delete a lot and update the parent asset's aggregate fields.
 */
export async function deleteLot(userId: string, coinId: string, lotId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');

  const lotRef = doc(db, 'portfolios', userId, 'assets', coinId, 'lots', lotId);
  const assetRef = doc(db, 'portfolios', userId, 'assets', coinId);

  await deleteDoc(lotRef);

  // Recompute aggregates from remaining lots
  const lotsRef = collection(db, 'portfolios', userId, 'assets', coinId, 'lots');
  const remainingSnap = await getDocs(lotsRef);
  const remaining: Lot[] = remainingSnap.docs.map(d => ({ id: d.id, ...d.data() } as Lot));
  const { amount, averageBuyPrice, totalInvested } = recalcFromLots(remaining);
  await updateDoc(assetRef, { amount, averageBuyPrice, totalInvested, updatedAt: Timestamp.now() });
}

/**
 * Load all assets for a user with their lots subcollection populated.
 * Auto-migrates legacy assets (no lots) on first access.
 */
export async function getUserAssetsWithLots(userId: string): Promise<PortfolioAsset[]> {
  if (!db) throw new Error('Firestore is not initialized');

  const assetsRef = collection(db, 'portfolios', userId, 'assets');
  const snapshot = await getDocs(assetsRef);

  const assets: PortfolioAsset[] = snapshot.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate() || new Date(),
    updatedAt: d.data().updatedAt?.toDate() || new Date(),
  })) as PortfolioAsset[];

  // Load lots for each asset in parallel; migrate legacy assets
  const assetsWithLots = await Promise.all(
    assets.map(async (asset) => {
      const lots = await migrateLegacyAsset(userId, asset);
      return { ...asset, lots };
    })
  );

  return assetsWithLots;
}

/**
 * Add a transaction record
 */
export async function addTransaction(transaction: Omit<Transaction, 'id'>): Promise<string> {
  if (!db) throw new Error('Firestore is not initialized');

  const transactionsRef = collection(db, 'transactions');
  const docRef = await addDoc(transactionsRef, {
    ...transaction,
    timestamp: Timestamp.fromDate(transaction.timestamp),
  });

  return docRef.id;
}

/**
 * Get all transactions for a user
 */
export async function getUserTransactions(userId: string): Promise<Transaction[]> {
  if (!db) throw new Error('Firestore is not initialized');

  const transactionsRef = collection(db, 'transactions');
  const q = query(transactionsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate() || new Date(),
  })) as Transaction[];
}

/**
 * Calculate portfolio summary (total value, total PnL, etc.)
 */
export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalPnL: number;
  totalPnLPercentage: number;
}

export function calculatePortfolioSummary(
  assets: PortfolioAsset[],
  currentPrices: Record<string, number>
): PortfolioSummary {
  let totalInvested = 0;
  let totalCurrentValue = 0;

  assets.forEach(asset => {
    totalInvested += asset.totalInvested;
    const currentPrice = currentPrices[asset.coinId] || 0;
    totalCurrentValue += asset.amount * currentPrice;
  });

  const totalPnL = totalCurrentValue - totalInvested;
  const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  return {
    totalInvested,
    totalCurrentValue,
    totalPnL,
    totalPnLPercentage,
  };
}

/**
 * Save or update wallet cost basis for a specific coin
 */
export async function saveWalletCostBasis(
  userId: string,
  walletAddress: string,
  coinSymbol: 'ETH' | 'USDT',
  averageBuyPrice: number,
  totalInvested: number
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');

  const costBasisRef = doc(db, 'walletCostBasis', userId, 'coins', coinSymbol);
  const costBasisSnap = await getDoc(costBasisRef);

  if (costBasisSnap.exists()) {
    // Update existing cost basis
    await updateDoc(costBasisRef, {
      walletAddress,
      averageBuyPrice,
      totalInvested,
      updatedAt: Timestamp.now(),
    });
  } else {
    // Create new cost basis
    const newCostBasis: Omit<WalletCostBasis, 'id'> = {
      userId,
      walletAddress,
      coinSymbol,
      averageBuyPrice,
      totalInvested,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(costBasisRef, newCostBasis);
  }
}

/**
 * Get wallet cost basis for all coins
 */
export async function getWalletCostBasis(userId: string): Promise<Record<string, WalletCostBasis>> {
  if (!db) throw new Error('Firestore is not initialized');

  const costBasisRef = collection(db, 'walletCostBasis', userId, 'coins');
  const snapshot = await getDocs(costBasisRef);

  const costBasisMap: Record<string, WalletCostBasis> = {};
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    costBasisMap[doc.id] = {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as WalletCostBasis;
  });

  return costBasisMap;
}

/**
 * Get wallet cost basis for a specific coin
 */
export async function getWalletCostBasisForCoin(
  userId: string,
  coinSymbol: 'ETH' | 'USDT'
): Promise<WalletCostBasis | null> {
  if (!db) throw new Error('Firestore is not initialized');

  const costBasisRef = doc(db, 'walletCostBasis', userId, 'coins', coinSymbol);
  const costBasisSnap = await getDoc(costBasisRef);

  if (!costBasisSnap.exists()) return null;

  return {
    id: costBasisSnap.id,
    ...costBasisSnap.data(),
    createdAt: costBasisSnap.data().createdAt?.toDate() || new Date(),
    updatedAt: costBasisSnap.data().updatedAt?.toDate() || new Date(),
  } as WalletCostBasis;
}

/**
 * Delete wallet cost basis for a specific coin
 */
export async function deleteWalletCostBasis(
  userId: string,
  coinSymbol: 'ETH' | 'USDT'
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');

  const costBasisRef = doc(db, 'walletCostBasis', userId, 'coins', coinSymbol);
  await deleteDoc(costBasisRef);
}
