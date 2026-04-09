import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

// Valid coins and days
const VALID_COINS = ['bitcoin', 'ethereum', 'tether'];
const VALID_DAYS = [7, 30, 90];

export async function GET(request: NextRequest) {
  try {
    // Get query params
    const { searchParams } = new URL(request.url);
    const coin = searchParams.get('coin');
    const daysParam = searchParams.get('days');

    // Validate coin
    if (!coin || !VALID_COINS.includes(coin)) {
      return NextResponse.json(
        { error: 'Invalid coin. Valid coins: bitcoin, ethereum, tether' },
        { status: 400 }
      );
    }

    // Validate days
    const days = parseInt(daysParam || '7');
    if (!VALID_DAYS.includes(days)) {
      return NextResponse.json(
        { error: 'Invalid days. Valid days: 7, 30, 90' },
        { status: 400 }
      );
    }

    // Fetch from CoinGecko
    const url = `${COINGECKO_API_BASE}/coins/${coin}/market_chart?vs_currency=usd&days=${days}`;
    
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour (historical data doesn't change often)
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform data: { prices: [[timestamp_ms, price], ...] }
    // to: Array<{ date: string, price: number }>
    const prices = data.prices || [];
    
    let transformedData = prices.map((item: [number, number]) => {
      const timestamp = item[0];
      const price = item[1];
      
      return {
        date: format(new Date(timestamp), 'dd MMM'), // Format: "09 Apr"
        price: Math.round(price * 100) / 100, // Round to 2 decimal places
      };
    });

    // For 7 days: sample every 4th data point (too many points otherwise)
    if (days === 7) {
      transformedData = transformedData.filter((_: any, index: number) => index % 4 === 0);
    }
    // For 30 and 90 days: use data as-is (already daily)

    return NextResponse.json(transformedData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (error: any) {
    console.error('Error fetching historical data from CoinGecko:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch historical price data',
        details: error.message 
      },
      { status: 502 }
    );
  }
}
