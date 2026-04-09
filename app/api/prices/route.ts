import { NextRequest, NextResponse } from 'next/server';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

export async function GET(request: NextRequest) {
  try {
    // Get coin IDs from query params (optional)
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    
    // Default coins if not specified
    const coinIds = idsParam || 'bitcoin,ethereum,tether,binancecoin,solana';
    
    // Fetch from CoinGecko
    const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;
    
    const response = await fetch(url, {
      next: { revalidate: 60 }, // Cache for 60 seconds on server
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    // Return with cache headers
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (error: any) {
    console.error('Error fetching prices from CoinGecko:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch cryptocurrency prices',
        details: error.message 
      },
      { status: 502 }
    );
  }
}
