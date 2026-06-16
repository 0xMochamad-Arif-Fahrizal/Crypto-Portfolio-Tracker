# Crypto Portfolio Tracker

A blockchain-integrated portfolio management system with FIFO-based cost basis reconstruction from on-chain transaction history.

## Overview

This system addresses the fragmentation problem in cryptocurrency portfolio tracking: users maintain assets across multiple platforms (centralized exchanges, hardware wallets, software wallets) with no unified view of cost basis and profit/loss. Traditional portfolio trackers require manual entry of every transaction, while blockchain data alone lacks purchase price history.

This implementation provides:

1. **Manual portfolio tracking** with lot-based purchase recording in Firestore
2. **On-chain balance reading** from Ethereum and Solana mainnets via JSON-RPC
3. **FIFO cost basis reconstruction** from complete Ethereum transaction history
4. **Unified aggregation** combining manual and on-chain holdings with consistent P&L calculation

The system operates in read-only mode—no private keys are stored or transmitted. All blockchain interactions use public RPC endpoints for balance and transaction queries.

## Key Features

### Manual Portfolio Tracking

- Lot-based purchase recording (date, amount, price per unit)
- Automatic aggregate calculation (total holdings, average cost basis)
- Per-asset P&L computation using current market prices
- Firebase Firestore persistence with per-user isolation

### Ethereum Wallet Integration

- Direct ETH and USDT balance queries via Alchemy RPC
- Complete transaction history retrieval from Etherscan API
- FIFO cost basis engine with:
  - Historical price lookup from CoinGecko
  - Gas fee accounting (derived from `gasUsed × gasPrice`)
  - Outgoing transaction matching using purchase queue
  - Balance reconciliation validation

### Solana Wallet Integration

- SOL balance queries via Helius RPC
- SPL token discovery and balance tracking
- Token metadata resolution from Solana DAS API
- Support for Jupiter-aggregated token mappings

### FIFO Cost Basis Engine

Reconstructs cost basis from blockchain history without requiring manual transaction logs:

1. **Purchase Queue Construction**: All incoming transactions fetched from Etherscan, with historical price lookup for each transaction timestamp
2. **Outgoing Transaction Processing**: Removes oldest lots first (FIFO) to compute realized cost basis
3. **Gas Fee Drain**: Accounts for transaction fees by removing ETH from purchase queue
4. **Balance Validation**: Compares reconstructed balance against on-chain balance with mismatch metric

**Validation Metric**: Balance mismatch for test wallet `0x742d35Cc...` shows `Δ ≈ 1.46×10⁻⁹ ETH`, indicating accurate reconstruction within rounding error tolerance.

### Multi-Source Price Fallback

Five-tier fallback architecture ensures price availability:

1. **CoinGecko API** (primary, 30-second throttled cache)
2. **Coinbase spot API** (public endpoint, no authentication)
3. **Kraken ticker API** (public ticker data)
4. **Firestore cache** (last successful CoinGecko fetch with timestamp)
5. **Memory cache** (process-lifetime last known price)

### Near Real-Time Updates

Client-side polling with 60-second interval for:
- Current market prices (CoinGecko → fallback chain)
- On-chain balances (Alchemy/Helius RPC)
- Firestore portfolio updates (snapshot listeners)

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js 16 App Router + React 19)               │
│  - TypeScript type safety                                   │
│  - Tailwind CSS styling                                     │
│  - Client-side polling (60s interval)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴──────────────┐
        │                           │
┌───────▼─────────┐      ┌─────────▼──────────┐
│  API Routes     │      │  Firebase           │
│  /api/prices    │      │  - Authentication   │
│  /api/wallet    │      │  - Firestore DB     │
│  /api/wallet/   │      │  - Security Rules   │
│    analyze      │      └─────────────────────┘
│  /api/solana/   │
│    balance      │
└────────┬────────┘
         │
    ┌────┴─────────────────────────────────┐
    │                                      │
┌───▼──────────────┐          ┌───────────▼────────┐
│ Blockchain RPCs  │          │  Price Providers   │
│ - Alchemy (ETH)  │          │  - CoinGecko       │
│ - Helius (SOL)   │          │  - Coinbase        │
│ - Etherscan      │          │  - Kraken          │
└──────────────────┘          │  - CryptoCompare   │
                              └────────────────────┘
```

### Data Flow

1. **User Authentication**: Firebase Auth with email/password
2. **Manual Portfolio**: Stored in Firestore with per-user document isolation
3. **On-Chain Reading**: JSON-RPC calls to Alchemy (Ethereum) and Helius (Solana)
4. **Transaction Analysis**: Etherscan API → FIFO engine → cost basis output
5. **Price Resolution**: CoinGecko primary with four-tier fallback
6. **Aggregation**: Client-side merge of manual + on-chain with unified P&L

## FIFO Cost Basis Engine

### Algorithm Overview

The FIFO (First-In-First-Out) engine reconstructs historical cost basis from blockchain transaction data:

```typescript
// Simplified conceptual flow
interface PurchaseLot {
  txHash: string;
  timestamp: number;
  amount: number;          // ETH quantity
  pricePerEth: number;     // USD price at purchase time
  costBasis: number;       // amount × pricePerEth
}

// 1. Build purchase queue from incoming transactions
const queue: PurchaseLot[] = incomingTxs.map(tx => ({
  txHash: tx.hash,
  timestamp: tx.timestamp,
  amount: tx.value / 1e18,
  pricePerEth: await getHistoricalPrice(tx.timestamp),
  costBasis: (tx.value / 1e18) * historicalPrice
}));

// 2. Process outgoing transactions (oldest-first removal)
for (const outTx of outgoingTxs) {
  let remaining = outTx.value / 1e18;
  while (remaining > 0 && queue.length > 0) {
    const oldest = queue[0];
    if (oldest.amount <= remaining) {
      remaining -= oldest.amount;
      queue.shift(); // Remove entire lot
    } else {
      oldest.amount -= remaining;
      remaining = 0;    // Partial lot removal
    }
  }
}

// 3. Account for gas fees (also removes from queue)
const gasFees = allTxs
  .filter(tx => tx.from === wallet)
  .reduce((sum, tx) => sum + (tx.gasUsed * tx.gasPrice) / 1e18, 0);
drainFromQueue(queue, gasFees);

// 4. Validate against on-chain balance
const fifoBalance = queue.reduce((sum, lot) => sum + lot.amount, 0);
const onChainBalance = await provider.getBalance(wallet);
const mismatch = Math.abs(fifoBalance - onChainBalance);
```

### Historical Price Resolution

For each incoming transaction timestamp `t`:

1. Query CoinGecko historical API: `GET /coins/ethereum/history?date=DD-MM-YYYY`
2. If exact date unavailable, retry with `t±1 day`
3. If still missing, prompt user for manual price override
4. Cache all resolved prices in memory to avoid duplicate API calls

### Gas Fee Accounting

Ethereum transaction costs (gas) are not reflected in the `value` field of transactions. The engine computes gas cost as:

```
gasETH = (gasUsed × gasPrice) / 10^18
```

For every transaction where `from === walletAddress`, the corresponding `gasETH` is removed from the FIFO queue using the same lot-matching logic as outgoing transactions. This ensures cost basis accurately reflects all ETH outflows.

### Balance Reconciliation

After processing all transactions, the engine compares:

```
fifoBalance = Σ(remaining lots)
onChainBalance = RPC query result
mismatch = |fifoBalance - onChainBalance|
```

**Interpretation**:

- `mismatch < 10⁻⁶ ETH`: Excellent reconstruction accuracy
- `mismatch > 10⁻³ ETH`: Indicates missing transaction data (e.g., internal transfers not captured by Etherscan)

For test wallet `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`, observed mismatch is `1.46×10⁻⁹ ETH`, confirming accurate FIFO queue reconstruction.

### Limitations

- Only processes incoming/outgoing transfers, not smart contract interactions
- Etherscan free tier has rate limits (5 calls/second)
- Historical price data availability limited to CoinGecko's dataset (post-2015)
- Internal transactions (contract-to-wallet) may not appear in standard transaction list

## Supported Networks & Assets

| Network  | Assets              | Features                                  |
|----------|---------------------|-------------------------------------------|
| Ethereum | ETH, USDT (ERC-20)  | FIFO cost basis, transaction history      |
| Solana   | SOL, SPL tokens     | Balance tracking only (no FIFO analysis)  |

**Ethereum Implementation**:
- RPC Provider: Alchemy (mainnet)
- Transaction History: Etherscan API v2
- Supported Assets: Native ETH + USDT (0xdAC17F958D2ee523a2206206994597C13D831ec7)

**Solana Implementation**:
- RPC Provider: Helius
- Asset Discovery: `getTokenAccountsByOwner` with metadata resolution
- No historical transaction analysis (current balances only)

**Not Supported**:
- Bitcoin, Binance Smart Chain, Polygon (no RPC integration)
- DeFi positions (staking, liquidity pools)
- NFT valuation

## Technology Stack

### Frontend

| Component       | Technology          | Purpose                                    |
|-----------------|---------------------|--------------------------------------------|
| Framework       | Next.js 16          | React framework with App Router            |
| Language        | TypeScript 5        | Type-safe development                      |
| Styling         | Tailwind CSS 4      | Utility-first CSS framework                |
| Charts          | Recharts 3.8        | Data visualization                         |
| Icons           | Lucide React        | Icon library                               |
| State           | React Context       | Authentication state management            |

### Backend & Infrastructure

| Component            | Technology              | Purpose                                 |
|----------------------|-------------------------|-----------------------------------------|
| API Routes           | Next.js API (Node.js)   | Server-side request handlers            |
| Authentication       | Firebase Auth           | User identity management                |
| Database             | Cloud Firestore         | NoSQL document store                    |
| Ethereum RPC         | Alchemy                 | Mainnet balance/transaction queries     |
| Solana RPC           | Helius                  | Mainnet balance/token queries           |
| Transaction History  | Etherscan API v2        | Historical ETH/USDT transactions        |
| Hosting              | Vercel                  | Serverless deployment platform          |

### Data Providers

| Provider       | Purpose                        | Fallback Tier |
|----------------|--------------------------------|---------------|
| CoinGecko      | Current & historical prices    | Primary (1)   |
| Coinbase       | Current ETH price (spot API)   | Tier 2        |
| Kraken         | Current ETH price (ticker)     | Tier 3        |
| CryptoCompare  | Historical price lookup        | Tier 4        |
| Firestore      | Cached price data              | Tier 5        |

## Installation

### Prerequisites

- Node.js 18+ and npm
- Firebase project (free Spark plan sufficient)
- Alchemy API key (free tier: 300M compute units/month)
- Helius API key (free tier available)
- Etherscan API key (free tier: 5 calls/second)

### Setup

```bash
# Clone repository
git clone <repository-url>
cd crypto-portfolio

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
# Edit .env.local with your API keys (see below)

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Environment Variables

Create `.env.local` in the project root:

```env
# Firebase Configuration (from Firebase Console → Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456:web:abcdef

# Firebase Admin SDK (for server-side Firestore)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Blockchain RPC Providers
ALCHEMY_API_KEY=your-alchemy-key
HELIUS_API_KEY=your-helius-key

# Transaction History
ETHERSCAN_API_KEY=your-etherscan-key

# Smart Contract Addresses
USDT_CONTRACT_ADDRESS=0xdAC17F958D2ee523a2206206994597C13D831ec7
```

### Obtaining API Keys

**Alchemy** (Ethereum RPC):
1. Sign up at https://www.alchemy.com/
2. Create new app → Ethereum → Mainnet
3. Copy API key from dashboard

**Helius** (Solana RPC):
1. Sign up at https://www.helius.dev/
2. Create API key
3. Free tier includes sufficient request quota

**Etherscan** (Transaction History):
1. Sign up at https://etherscan.io/apis
2. Generate free API key
3. Rate limit: 5 calls/second

## Project Structure

```
crypto-portfolio/
├── app/
│   ├── (auth)/              # Authentication routes (login, register)
│   ├── api/                 # Next.js API routes
│   │   ├── prices/          # Multi-source price fetching
│   │   ├── wallet/          # Ethereum balance & analysis
│   │   │   └── analyze/     # FIFO cost basis calculation
│   │   └── solana/          # Solana balance queries
│   ├── dashboard/           # Live prices & portfolio overview
│   ├── portfolio/           # Manual asset management
│   ├── wallet/              # Wallet address settings
│   └── integrated/          # Unified manual + on-chain view
├── components/              # React components
│   ├── charts/              # Recharts visualizations
│   └── ui/                  # Reusable UI primitives
├── lib/
│   ├── api/                 # External API clients (CoinGecko)
│   ├── context/             # React context providers (Auth)
│   ├── firebase/            # Firebase initialization (client + admin)
│   ├── firestore/           # Firestore CRUD operations
│   ├── hooks/               # Custom React hooks
│   └── solana.ts            # Solana RPC utilities
├── logs/                    # FIFO audit logs (gitignored)
├── public/                  # Static assets
├── .env.local              # Environment variables (gitignored)
├── .env.local.example      # Template for environment setup
├── firestore.rules         # Firestore security rules
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration
```

### Key Implementation Files

- **`app/api/wallet/analyze/route.ts`** (1,142 lines): Complete FIFO engine implementation with gas accounting and balance reconciliation
- **`lib/firestore/portfolio.ts`** (974 lines): Lot-based portfolio CRUD, aggregate calculation
- **`lib/hooks/usePortfolioAggregator.ts`**: Client-side manual + on-chain aggregation logic
- **`app/integrated/page.tsx`**: Unified portfolio view with FIFO cost basis display

## Design Decisions

### Why Polling Instead of WebSocket Streaming?

The system uses 60-second polling intervals rather than WebSocket connections because:

1. **Rate Limits**: CoinGecko free tier (10-30 calls/minute) makes frequent updates impractical
2. **Simplicity**: Polling avoids WebSocket connection management and reconnection logic
3. **User Behavior**: Portfolio values change slowly enough that 60-second updates are acceptable
4. **Cost**: Blockchain RPC providers charge per request, not per connection duration

### Why Read-Only Architecture?

No private keys are stored or transmitted because:

1. **Security**: Eliminates attack surface for key theft
2. **Trust**: Users don't need to trust the application with signing authority
3. **Scope**: The application is a viewer, not a transaction executor

All blockchain queries use public RPC methods (`eth_getBalance`, `eth_call`, `getTokenAccountsByOwner`).

### Why FIFO for Cost Basis?

FIFO was chosen over other methods (LIFO, average cost) because:

1. **Tax Compliance**: Many jurisdictions default to FIFO for capital gains calculation
2. **Determinism**: Given the same transaction history, FIFO always produces identical results
3. **Auditability**: FIFO lot matching can be traced and verified in audit logs

### Why Fallback API Architecture?

The five-tier price fallback system exists because:

1. **Rate Limits**: CoinGecko free tier frequently hits 429 errors during development
2. **Availability**: Single-source dependency creates fragility
3. **User Experience**: Showing $0 portfolio value due to API downtime is unacceptable

Each fallback tier has increasing staleness tolerance (Firestore cache can be minutes old, memory cache can be hours old).

## Limitations

This section documents known limitations to set realistic expectations:

### Ethereum FIFO Analysis

- **Only ETH and USDT supported**: ERC-20 tokens beyond USDT require additional contract ABI integration
- **Incoming transactions only**: Outgoing transactions are matched for cost basis calculation, but realized gains are not separately tracked
- **No smart contract interactions**: DEX trades, staking deposits/withdrawals not captured
- **Historical price availability**: CoinGecko historical data starts ~2015; earlier transactions require manual price input

### Solana Integration

- **No FIFO analysis**: Solana balance tracking is current-state only (no historical transaction parsing)
- **SPL token metadata**: Some tokens may display as "Unknown Token" if metadata resolution fails
- **No staking positions**: Staked SOL appears in account balance but is not broken out separately

### API Dependencies

- **Rate limits**: Etherscan free tier (5 calls/second), CoinGecko (10-30 calls/minute)
- **Downtime propagation**: If all price providers fail, system falls back to stale cached data
- **Third-party changes**: Breaking changes to Etherscan/CoinGecko APIs may require code updates

### Transaction Analysis Accuracy

- **Internal transfers**: Contract-initiated transfers may not appear in standard Etherscan transaction list
- **Mining rewards**: Coinbase transactions (block rewards) not included in cost basis calculation
- **Bridge transfers**: Cross-chain transfers appear as outgoing on one chain, incoming on another (must be manually marked as internal)

### Performance

- **Large wallets**: Wallets with >100 transactions are truncated to prevent analysis timeout
- **Cold start**: First FIFO analysis can take 30-60 seconds due to historical price lookups
- **Polling interval**: 60-second price updates mean portfolio values may lag real-time by up to 1 minute

## Academic Context

This software repository supports undergraduate research in blockchain-based portfolio management systems. The research focuses on:

- **Automated cost basis reconstruction** from public blockchain transaction data
- **Data quality validation** using balance mismatch metrics
- **Multi-source fallback architecture** for resilient price data acquisition
- **Integration challenges** between on-chain and off-chain portfolio tracking

This work explores the feasibility of FIFO-based tax reporting without centralized exchange records, which has implications for:

1. **Financial transparency**: Blockchain provides verifiable transaction history
2. **Regulatory compliance**: FIFO is accepted by many tax jurisdictions
3. **User sovereignty**: No dependence on exchange export features

The repository is designed to be:

- **Reproducible**: Complete environment setup and dependency documentation
- **Extensible**: Modular architecture supports adding new blockchains/assets
- **Educational**: Code includes comments explaining FIFO algorithm logic

This is academic software—not a production financial tool. No warranty is provided regarding tax accuracy.

## Open Source Contribution

Contributions are welcome via pull requests. Areas of interest:

- **Additional blockchain support**: Bitcoin, Polygon, Binance Smart Chain integration
- **DeFi position tracking**: Staking, liquidity pool, lending protocol integration
- **Improved price resolution**: Additional historical price data sources
- **Performance optimization**: Batch transaction processing, parallel API calls
- **Testing**: Unit tests for FIFO engine, integration tests for API routes

Educational and research use is strongly encouraged. Please cite this repository if used in academic work.

## License

MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

**Note**: This software is for educational and research purposes. It should not be used as the sole basis for tax reporting or financial decisions without independent verification.
