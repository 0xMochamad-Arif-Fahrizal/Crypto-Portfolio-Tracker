import { useMemo } from 'react';

// Types for input data
export interface AssetWithPnL {
  id?: string;
  coinId: string;
  symbol: string;
  name?: string;
  buyPrice: number;
  quantity: number;
  currentPrice: number;
  currentValue: number;
  pnl: number;
  roiPercent: number;
  isProfit: boolean;
}

export interface ManualPortfolio {
  totalValue: number;
  totalPnL: number;
  totalROI: number;
  assets: AssetWithPnL[];
}

export interface WalletPortfolio {
  ethBalance: string;
  usdtBalance: string;
  ethValueUSD: number;
  usdtValueUSD: number;
  totalWalletValue: number;
  isLoaded: boolean;
}

export interface PriceMap {
  BTC?: number;
  ETH?: number;
  USDT?: number;
  [key: string]: number | undefined;
}

export interface IntegratedSummary {
  // Totals
  grandTotalValue: number;
  grandTotalPnL: number;
  
  // Breakdown by source
  manualAllocation: number;
  walletAllocation: number;
  
  // Breakdown by asset
  btcTotalValue: number;
  ethTotalValue: number;
  usdtTotalValue: number;
  
  // Metadata
  lastUpdated: Date;
  hasWalletData: boolean;
  dataCompleteness: 'full' | 'manual-only' | 'wallet-only';
}

/**
 * Custom hook to aggregate portfolio data from manual (Firebase) and wallet (Blockchain) sources
 * Pure calculation hook - does not fetch any data
 */
export function usePortfolioAggregator(
  manualPortfolio: ManualPortfolio,
  walletPortfolio: WalletPortfolio,
  prices: PriceMap
): IntegratedSummary {
  return useMemo(() => {
    // 1. Total value from each source
    const manualTotal = manualPortfolio.totalValue || 0;
    const walletTotal = walletPortfolio.isLoaded ? walletPortfolio.totalWalletValue : 0;

    // 2. Grand total
    const grandTotal = manualTotal + walletTotal;

    // 3. Allocation per source (%)
    const manualAllocation = grandTotal > 0 ? (manualTotal / grandTotal) * 100 : 0;
    const walletAllocation = grandTotal > 0 ? (walletTotal / grandTotal) * 100 : 0;

    // 4. Aggregation per coin
    // Manual: sum by symbol
    const manualBTC = sumBySymbol(manualPortfolio.assets, 'BTC');
    const manualETH = sumBySymbol(manualPortfolio.assets, 'ETH');
    const manualUSDT = sumBySymbol(manualPortfolio.assets, 'USDT');

    // Wallet: ETH and USDT only (BTC not tracked on-chain in this system)
    const walletETH = walletPortfolio.isLoaded ? walletPortfolio.ethValueUSD : 0;
    const walletUSDT = walletPortfolio.isLoaded ? walletPortfolio.usdtValueUSD : 0;

    // 5. Determine data completeness
    const hasManual = manualPortfolio.assets.length > 0;
    const hasWallet = walletPortfolio.isLoaded;
    
    let dataCompleteness: 'full' | 'manual-only' | 'wallet-only';
    if (hasManual && hasWallet) {
      dataCompleteness = 'full';
    } else if (hasManual) {
      dataCompleteness = 'manual-only';
    } else if (hasWallet) {
      dataCompleteness = 'wallet-only';
    } else {
      dataCompleteness = 'manual-only'; // empty state = prompt user
    }

    return {
      grandTotalValue: grandTotal,
      grandTotalPnL: manualPortfolio.totalPnL || 0, // wallet excluded (no cost basis)

      manualAllocation,
      walletAllocation,

      btcTotalValue: manualBTC, // wallet doesn't track BTC
      ethTotalValue: manualETH + walletETH,
      usdtTotalValue: manualUSDT + walletUSDT,

      lastUpdated: new Date(),
      hasWalletData: walletPortfolio.isLoaded,
      dataCompleteness,
    };
  }, [manualPortfolio, walletPortfolio, prices]);
}

/**
 * Helper function to sum asset values by symbol
 */
function sumBySymbol(assets: AssetWithPnL[], symbol: string): number {
  return assets
    .filter(a => a.symbol.toUpperCase() === symbol.toUpperCase())
    .reduce((sum, a) => sum + (a.currentValue || 0), 0);
}
