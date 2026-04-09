// CoinGecko API integration for fetching real-time crypto prices
// Free tier: 10-50 calls/minute, no API key required

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image: string;
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
  try {
    const ids = coinIds.join(',');
    // Use internal API route instead of direct CoinGecko call
    const url = `/api/prices?ids=${ids}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Prices API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching coin prices:', error);
    throw error;
  }
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
