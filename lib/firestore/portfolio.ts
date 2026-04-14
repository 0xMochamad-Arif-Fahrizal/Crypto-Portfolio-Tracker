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

// TypeScript interfaces for portfolio data
export interface PortfolioAsset {
  id?: string; // Firestore document ID
  userId: string;
  coinId: string; // CoinGecko coin ID (e.g., 'bitcoin')
  symbol: string; // e.g., 'BTC'
  name: string; // e.g., 'Bitcoin'
  amount: number; // Total amount of coins owned
  averageBuyPrice: number; // Average purchase price in USD
  totalInvested: number; // Total USD invested
  createdAt: Date;
  updatedAt: Date;
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
