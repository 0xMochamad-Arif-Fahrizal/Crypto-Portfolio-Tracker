import { NextRequest, NextResponse } from 'next/server';

interface EtherscanTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
}

interface HistoricalPrice {
  timestamp: number;
  price: number;
}

interface CostBasisResult {
  eth: {
    totalInvested: number;
    averageCostBasis: number;
    currentBalance: number;
    transactions: number;
  };
  usdt: {
    totalInvested: number;
    averageCostBasis: number;
    currentBalance: number;
    transactions: number;
  };
}

/**
 * Analyze wallet transaction history to calculate cost basis
 * Uses Etherscan API to fetch transactions and CoinGecko for historical prices
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
    if (!ETHERSCAN_API_KEY) {
      return NextResponse.json(
        { error: 'Etherscan API key not configured' },
        { status: 500 }
      );
    }

    console.log('Starting transaction analysis for:', address);

    // Fetch ETH transactions (V2 API)
    const ethTxUrl = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`;
    
    // Fetch USDT (ERC-20) transactions (V2 API)
    const USDT_CONTRACT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
    const usdtTxUrl = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokentx&contractaddress=${USDT_CONTRACT}&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`;

    const [ethResponse, usdtResponse] = await Promise.all([
      fetch(ethTxUrl),
      fetch(usdtTxUrl),
    ]);

    if (!ethResponse.ok || !usdtResponse.ok) {
      throw new Error('Failed to fetch transaction history from Etherscan');
    }

    const ethData = await ethResponse.json();
    const usdtData = await usdtResponse.json();

    if (ethData.status !== '1' && ethData.message !== 'No transactions found') {
      console.error('Etherscan ETH error:', ethData.message);
    }

    if (usdtData.status !== '1' && usdtData.message !== 'No transactions found') {
      console.error('Etherscan USDT error:', usdtData.message);
    }

    const ethTransactions: EtherscanTransaction[] = ethData.result || [];
    const usdtTransactions: EtherscanTransaction[] = usdtData.result || [];

    console.log(`Found ${ethTransactions.length} ETH transactions`);
    console.log(`Found ${usdtTransactions.length} USDT transactions`);

    // Calculate cost basis for ETH
    const ethCostBasis = await calculateEthCostBasis(
      ethTransactions,
      address.toLowerCase()
    );

    // Calculate cost basis for USDT
    const usdtCostBasis = await calculateUsdtCostBasis(
      usdtTransactions,
      address.toLowerCase()
    );

    const result: CostBasisResult = {
      eth: ethCostBasis,
      usdt: usdtCostBasis,
    };

    console.log('Cost basis analysis complete:', result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Transaction analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze transactions', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Calculate ETH cost basis from transaction history
 * Uses FIFO method: tracks both incoming and outgoing to calculate accurate cost basis
 */
async function calculateEthCostBasis(
  transactions: EtherscanTransaction[],
  walletAddress: string
): Promise<CostBasisResult['eth']> {
  // Separate incoming and outgoing transactions
  const incomingTxs = transactions.filter(
    (tx) => tx.to.toLowerCase() === walletAddress && tx.value !== '0'
  );
  
  const outgoingTxs = transactions.filter(
    (tx) => tx.from.toLowerCase() === walletAddress && tx.value !== '0'
  );

  console.log(`Processing ${incomingTxs.length} incoming and ${outgoingTxs.length} outgoing ETH transactions`);

  // Track purchases with FIFO queue
  interface Purchase {
    amount: number;
    pricePerEth: number;
    timestamp: number;
  }
  
  const purchases: Purchase[] = [];
  let totalInvestedUSD = 0;
  let totalEthRemaining = 0;

  // Limit to recent transactions to avoid too many API calls
  const recentIncomingTxs = incomingTxs.slice(-20); // Last 20 incoming transactions
  console.log(`Analyzing last ${recentIncomingTxs.length} incoming transactions (limited for performance)`);

  // Process all incoming transactions (purchases)
  for (const tx of recentIncomingTxs) {
    const ethAmount = parseFloat(tx.value) / 1e18;
    const timestamp = parseInt(tx.timeStamp);
    const ethPrice = await getHistoricalEthPrice(timestamp);

    if (ethPrice > 0) {
      purchases.push({
        amount: ethAmount,
        pricePerEth: ethPrice,
        timestamp,
      });
      
      totalInvestedUSD += ethAmount * ethPrice;
      totalEthRemaining += ethAmount;

      console.log(
        `IN  ${tx.hash.substring(0, 10)}...: +${ethAmount.toFixed(4)} ETH @ $${ethPrice.toFixed(2)}`
      );
    }
  }

  // Process recent outgoing transactions using FIFO
  const recentOutgoingTxs = outgoingTxs.slice(-20); // Last 20 outgoing transactions
  
  for (const tx of recentOutgoingTxs) {
    const ethAmount = parseFloat(tx.value) / 1e18;
    let remainingToRemove = ethAmount;

    console.log(
      `OUT ${tx.hash.substring(0, 10)}...: -${ethAmount.toFixed(4)} ETH`
    );

    // Remove from purchases using FIFO
    while (remainingToRemove > 0 && purchases.length > 0) {
      const oldestPurchase = purchases[0];
      
      if (oldestPurchase.amount <= remainingToRemove) {
        // Remove entire purchase
        const costBasisRemoved = oldestPurchase.amount * oldestPurchase.pricePerEth;
        totalInvestedUSD -= costBasisRemoved;
        totalEthRemaining -= oldestPurchase.amount;
        remainingToRemove -= oldestPurchase.amount;
        purchases.shift();
        
        console.log(`  Removed purchase: ${oldestPurchase.amount.toFixed(4)} ETH @ $${oldestPurchase.pricePerEth.toFixed(2)}`);
      } else {
        // Partially remove from purchase
        const costBasisRemoved = remainingToRemove * oldestPurchase.pricePerEth;
        totalInvestedUSD -= costBasisRemoved;
        totalEthRemaining -= remainingToRemove;
        oldestPurchase.amount -= remainingToRemove;
        
        console.log(`  Partially removed: ${remainingToRemove.toFixed(4)} ETH @ $${oldestPurchase.pricePerEth.toFixed(2)}`);
        remainingToRemove = 0;
      }
    }
  }

  const averageCostBasis = totalEthRemaining > 0 ? totalInvestedUSD / totalEthRemaining : 0;

  console.log(`Final ETH: ${totalEthRemaining.toFixed(4)} ETH, Cost Basis: $${totalInvestedUSD.toFixed(2)}, Avg: $${averageCostBasis.toFixed(2)}`);

  return {
    totalInvested: totalInvestedUSD,
    averageCostBasis,
    currentBalance: totalEthRemaining,
    transactions: recentIncomingTxs.length,
  };
}

/**
 * Calculate USDT cost basis from transaction history
 * USDT is a stablecoin, so we assume $1 per USDT
 * Uses FIFO method to track remaining balance
 */
async function calculateUsdtCostBasis(
  transactions: EtherscanTransaction[],
  walletAddress: string
): Promise<CostBasisResult['usdt']> {
  // Separate incoming and outgoing transactions
  const incomingTxs = transactions.filter(
    (tx) => tx.to.toLowerCase() === walletAddress && tx.value !== '0'
  );
  
  const outgoingTxs = transactions.filter(
    (tx) => tx.from.toLowerCase() === walletAddress && tx.value !== '0'
  );

  console.log(`Processing ${incomingTxs.length} incoming and ${outgoingTxs.length} outgoing USDT transactions`);

  let totalUsdtRemaining = 0;

  // Process incoming transactions
  for (const tx of incomingTxs) {
    const usdtAmount = parseFloat(tx.value) / 1e6; // USDT has 6 decimals
    totalUsdtRemaining += usdtAmount;

    console.log(
      `IN  ${tx.hash.substring(0, 10)}...: +${usdtAmount.toFixed(2)} USDT`
    );
  }

  // Process outgoing transactions
  for (const tx of outgoingTxs) {
    const usdtAmount = parseFloat(tx.value) / 1e6;
    totalUsdtRemaining -= usdtAmount;

    console.log(
      `OUT ${tx.hash.substring(0, 10)}...: -${usdtAmount.toFixed(2)} USDT`
    );
  }

  // USDT is a stablecoin, so cost basis = remaining amount
  const totalInvestedUSD = totalUsdtRemaining;
  const averageCostBasis = 1.0; // $1 per USDT

  console.log(`Final USDT: ${totalUsdtRemaining.toFixed(2)} USDT, Cost Basis: $${totalInvestedUSD.toFixed(2)}`);

  return {
    totalInvested: totalInvestedUSD,
    averageCostBasis,
    currentBalance: totalUsdtRemaining,
    transactions: incomingTxs.length,
  };
}

/**
 * Fetch historical ETH price at a specific timestamp
 * Uses CoinGecko API with caching and fallback strategies
 */
const priceCache = new Map<string, number>();
let currentEthPrice = 0; // Fallback to current price

async function getHistoricalEthPrice(timestamp: number): Promise<number> {
  // Convert timestamp to date string (YYYY-MM-DD)
  const date = new Date(timestamp * 1000);
  const dateStr = date.toISOString().split('T')[0];

  // Check cache first
  const cacheKey = `eth-${dateStr}`;
  if (priceCache.has(cacheKey)) {
    return priceCache.get(cacheKey)!;
  }

  // If current price not fetched yet, fetch it once
  if (currentEthPrice === 0) {
    try {
      const currentPriceUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';
      const response = await fetch(currentPriceUrl);
      if (response.ok) {
        const data = await response.json();
        currentEthPrice = data.ethereum?.usd || 3500; // Default fallback
      }
    } catch (error) {
      console.warn('Failed to fetch current ETH price, using default');
      currentEthPrice = 3500; // Default fallback
    }
  }

  // For recent transactions (< 90 days), use current price as approximation
  const daysSinceTransaction = (Date.now() - timestamp * 1000) / (1000 * 60 * 60 * 24);
  if (daysSinceTransaction < 90) {
    console.log(`Using current price for recent transaction (${daysSinceTransaction.toFixed(0)} days ago): $${currentEthPrice}`);
    priceCache.set(cacheKey, currentEthPrice);
    return currentEthPrice;
  }

  try {
    // Try market_chart endpoint for historical data (more reliable)
    const fromTimestamp = timestamp;
    const toTimestamp = timestamp + 86400; // +1 day
    
    const url = `https://api.coingecko.com/api/v3/coins/ethereum/market_chart/range?vs_currency=usd&from=${fromTimestamp}&to=${toTimestamp}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Failed to fetch price for ${dateStr}, using current price as fallback`);
      priceCache.set(cacheKey, currentEthPrice);
      return currentEthPrice;
    }

    const data = await response.json();
    
    // Extract price from market_chart data
    if (data.prices && data.prices.length > 0) {
      const price = data.prices[0][1]; // [timestamp, price]
      priceCache.set(cacheKey, price);
      
      console.log(`Historical price for ${dateStr}: $${price.toFixed(2)}`);
      
      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      return price;
    } else {
      console.warn(`No price data for ${dateStr}, using current price as fallback`);
      priceCache.set(cacheKey, currentEthPrice);
      return currentEthPrice;
    }
  } catch (error) {
    console.error(`Error fetching historical price for ${dateStr}:`, error);
    priceCache.set(cacheKey, currentEthPrice);
    return currentEthPrice;
  }
}
