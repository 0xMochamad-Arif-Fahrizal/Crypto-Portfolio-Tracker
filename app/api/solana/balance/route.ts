import { NextRequest, NextResponse } from 'next/server';
import {
  getSolBalance,
  getSplTokens,
  getTokenMetadata,
  isValidSolanaAddress,
} from '@/lib/solana';

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

    if (address.startsWith('0x')) {
      return NextResponse.json(
        { error: 'Ethereum address is not valid for Solana endpoint' },
        { status: 400 }
      );
    }

    if (!isValidSolanaAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Solana address format' },
        { status: 400 }
      );
    }

    const [sol, tokens] = await Promise.all([
      getSolBalance(address),
      getSplTokens(address),
    ]);

    const metadataEntries = await Promise.all(
      tokens.map(async (token) => [token.mint, await getTokenMetadata(token.mint)] as const)
    );
    const metadataByMint = new Map(metadataEntries);

    const tokensWithMetadata = tokens.map((token) => {
      const metadata = metadataByMint.get(token.mint);
      return {
        ...token,
        symbol: metadata?.symbol ?? null,
        name: metadata?.name ?? null,
      };
    });

    return NextResponse.json({
      sol,
      tokens: tokensWithMetadata,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read Solana wallet data';
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
