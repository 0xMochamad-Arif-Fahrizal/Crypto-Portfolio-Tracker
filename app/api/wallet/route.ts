import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// ERC-20 ABI for balanceOf function
const ERC20_ABI = ['function balanceOf(address) view returns (uint256)'];

export async function GET(request: NextRequest) {
  try {
    // Get address from query params
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    // Validate address
    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    if (!ethers.isAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address' },
        { status: 400 }
      );
    }

    // Create Infura provider
    const INFURA_API_KEY = process.env.INFURA_API_KEY;
    if (!INFURA_API_KEY) {
      return NextResponse.json(
        { error: 'Infura API key not configured' },
        { status: 500 }
      );
    }

    const provider = new ethers.JsonRpcProvider(
      `https://mainnet.infura.io/v3/${INFURA_API_KEY}`
    );

    // USDT contract address (Ethereum Mainnet)
    const USDT_ADDRESS = process.env.USDT_CONTRACT_ADDRESS || 
      '0xdAC17F958D2ee523a2206206994597C13D831ec7';

    // Create USDT contract instance
    const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);

    // Fetch ETH and USDT balances in parallel
    const [ethBalanceRaw, usdtBalanceRaw] = await Promise.all([
      provider.getBalance(address),
      usdtContract.balanceOf(address),
    ]);

    // Convert balances
    // ETH: 18 decimals - use formatEther
    const ethBalance = ethers.formatEther(ethBalanceRaw);

    // USDT: 6 decimals - NOT formatEther
    // CRITICAL: Use BigInt division with 10^6
    const usdtBalance = (BigInt(usdtBalanceRaw.toString()) / 10n ** 6n).toString();

    // Fetch current prices from CoinGecko
    let ethPrice = 0;
    let usdtPrice = 1; // USDT is always ~$1
    
    try {
      const priceResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      );
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        ethPrice = priceData.ethereum?.usd || 0;
      }
    } catch (priceError) {
      console.error('Failed to fetch ETH price:', priceError);
    }

    // Calculate USD values
    const ethValueUSD = parseFloat(ethBalance) * ethPrice;
    const usdtValueUSD = parseFloat(usdtBalance) * usdtPrice;
    const totalValueUSD = ethValueUSD + usdtValueUSD;

    return NextResponse.json({
      address,
      ethBalance: ethBalance,
      usdtBalance: usdtBalance,
      ethValueUSD,
      usdtValueUSD,
      totalValueUSD,
      // Legacy fields for backward compatibility
      eth: ethBalance,
      usdt: usdtBalance,
    });
  } catch (error: any) {
    console.error('Blockchain read error:', error);
    return NextResponse.json(
      { error: 'Failed to read blockchain data', details: error.message },
      { status: 502 }
    );
  }
}
