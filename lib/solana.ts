const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const SOL_DECIMALS = 1_000_000_000;
const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]+$/;

export type SplToken = {
  mint: string;
  amount: string;
  decimals: number;
  uiAmount: number;
};

export type TokenMeta = {
  symbol: string | null;
  name: string | null;
};

type JsonRpcResponse<T> = {
  result?: T;
  error?: { code: number; message: string };
};

function getHeliusEndpoint(): string {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) {
    throw new Error('HELIUS_API_KEY is not configured');
  }
  return `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
}

export function isValidSolanaAddress(address: string): boolean {
  if (!address || address.startsWith('0x')) {
    return false;
  }
  return address.length >= 32 && address.length <= 44 && BASE58_REGEX.test(address);
}

export async function heliusRpc<T>(method: string, params: unknown): Promise<T> {
  const response = await fetch(getHeliusEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: `${method}-${Date.now()}`,
      method,
      params,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Helius RPC HTTP error ${response.status}`);
  }

  const payload = (await response.json()) as JsonRpcResponse<T>;
  if (payload.error) {
    throw new Error(`Helius RPC ${method} failed: ${payload.error.message}`);
  }
  if (payload.result === undefined) {
    throw new Error(`Helius RPC ${method} returned empty result`);
  }

  return payload.result;
}

export async function getSolBalance(address: string): Promise<number> {
  if (!isValidSolanaAddress(address)) {
    throw new Error('Invalid Solana address format');
  }

  const result = await heliusRpc<{ value: number }>('getBalance', [address]);
  return result.value / SOL_DECIMALS;
}

export async function getSplTokens(address: string): Promise<SplToken[]> {
  if (!isValidSolanaAddress(address)) {
    throw new Error('Invalid Solana address format');
  }

  const result = await heliusRpc<{
    value: Array<{
      account: {
        data: {
          parsed?: {
            info?: {
              mint?: string;
              tokenAmount?: {
                amount?: string;
                decimals?: number;
                uiAmount?: number;
              };
            };
          };
        };
      };
    }>;
  }>('getTokenAccountsByOwner', [
    address,
    { programId: TOKEN_PROGRAM_ID },
    { encoding: 'jsonParsed' },
  ]);

  return result.value
    .map((item) => {
      const info = item.account.data.parsed?.info;
      const amountInfo = info?.tokenAmount;
      if (!info?.mint || !amountInfo?.amount || amountInfo.decimals === undefined) {
        return null;
      }

      return {
        mint: info.mint,
        amount: amountInfo.amount,
        decimals: amountInfo.decimals,
        uiAmount: amountInfo.uiAmount ?? 0,
      };
    })
    .filter((token): token is SplToken => token !== null);
}

function extractMetadata(result: any): TokenMeta | null {
  const content = result?.content?.metadata;
  const symbol =
    (typeof content?.symbol === 'string' && content.symbol) ||
    (typeof result?.token_info?.symbol === 'string' && result.token_info.symbol) ||
    null;
  const name =
    (typeof content?.name === 'string' && content.name) ||
    (typeof result?.token_info?.name === 'string' && result.token_info.name) ||
    null;

  if (!symbol && !name) {
    return null;
  }

  return { symbol, name };
}

export async function getTokenMetadata(mint: string): Promise<TokenMeta | null> {
  if (!isValidSolanaAddress(mint)) {
    return null;
  }

  try {
    const result = await heliusRpc<any>('getAsset', { id: mint });
    const metadata = extractMetadata(result);
    if (metadata) {
      return metadata;
    }
  } catch (_error) {
    // Continue with fallback searchAssets.
  }

  try {
    const result = await heliusRpc<{ items?: any[] }>('searchAssets', {
      ownerAddress: mint,
      tokenType: 'fungible',
      limit: 1,
      page: 1,
    });
    const first = result.items?.[0];
    return first ? extractMetadata(first) : null;
  } catch (_error) {
    return null;
  }
}
