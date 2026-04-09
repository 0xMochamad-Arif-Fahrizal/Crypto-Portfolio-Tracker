# crypto portfolio tracker

track your crypto holdings with real-time prices and on-chain data.

## what it does

- live crypto prices from coingecko
- portfolio tracking with pnl calculations
- read wallet balances directly from ethereum blockchain
- historical price charts
- firebase auth + firestore

## stack

next.js 16 · typescript · tailwind · firebase · ethers.js · recharts

## setup

```bash
npm install
```

create `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

INFURA_API_KEY=
USDT_CONTRACT_ADDRESS=0xdAC17F958D2ee523a2206206994597C13D831ec7
```

```bash
npm run dev
```

## features

**auth** - email/password with firebase

**dashboard** - live prices for btc, eth, usdt, bnb, sol

**portfolio** - add assets, track pnl, see total value

**wallet** - check any ethereum address balance (eth + usdt)

**history** - price charts with 7d/30d/90d views

## deploy

works on vercel out of the box. just add env vars and deploy.

## notes

- usdt uses 6 decimals, not 18
- coingecko free tier has rate limits
- infura needed for blockchain reads

built for learning and portfolio purposes.
