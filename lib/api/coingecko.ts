// CoinGecko API integration for fetching real-time crypto prices
// Free tier: 10-50 calls/minute, no API key required

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  // These fields are null when data comes from a fallback source (Binance / CryptoCompare)
  // instead of CoinGecko's full /coins/markets endpoint.
  price_change_percentage_24h: number | null;
  market_cap: number | null;
  total_volume: number | null;
  image?: string | null;
}

/**
 * Fetch current prices for multiple cryptocurrencies
 * Uses internal API route to avoid CORS issues
 * @param coinIds - Array of CoinGecko coin IDs (e.g., ['bitcoin', 'ethereum', 'tether'])
 * @returns Array of coin price data
 */
export async function fetchCoinPrices(
  coinIds: string[] = ['bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana']
): Promise<CoinPrice[]> {
  const ids = coinIds.join(',');
  const url = `/api/prices?ids=${ids}`;

  // Retry logic: try 3 times with exponential backoff
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Prices API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`[fetchCoinPrices] Attempt ${attempt}/3 failed:`, lastError.message);
      
      // Wait before retry (exponential backoff: 500ms, 1000ms, 2000ms)
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
      }
    }
  }

  // All retries failed - return empty array instead of throwing
  console.error('[fetchCoinPrices] All retry attempts failed:', lastError?.message);
  
  // Return empty array with fallback data structure
  return coinIds.map(id => ({
    id,
    symbol: id.substring(0, 3).toUpperCase(),
    name: id.charAt(0).toUpperCase() + id.slice(1),
    current_price: 0,
    price_change_percentage_24h: null,
    market_cap: null,
    total_volume: null,
  }));
}

/**
 * Fetch price for a single cryptocurrency
 * Uses internal API route to avoid CORS issues
 * @param coinId - CoinGecko coin ID (e.g., 'bitcoin')
 * @returns Single coin price data
 */
export async function fetchSingleCoinPrice(coinId: string): Promise<CoinPrice> {
  const prices = await fetchCoinPrices([coinId]);
  if (prices.length === 0) {
    throw new Error(`Coin not found: ${coinId}`);
  }
  return prices[0];
}

/**
 * Search for coins by name or symbol
 * @param query - Search query
 * @returns Array of matching coins
 */
export async function searchCoins(query: string) {
  try {
    const url = `${COINGECKO_API_BASE}/search?query=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    return data.coins || [];
  } catch (error) {
    console.error('Error searching coins:', error);
    throw error;
  }
}
