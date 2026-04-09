# Crypto Portfolio Tracker

A production-ready cryptocurrency portfolio tracker built with Next.js, Firebase, and Ethers.js.

## Features

- 🔐 **Authentication** - Firebase Auth with email/password
- 💰 **Live Prices** - Real-time crypto prices from CoinGecko API
- 📊 **Portfolio Management** - Track your crypto holdings with PnL calculations
- 🔗 **Blockchain Integration** - Read wallet balances directly from Ethereum blockchain
- 📈 **Historical Charts** - Interactive price charts with Recharts
- 🎨 **Modern UI** - Dark theme with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication & Database**: Firebase v10
- **Blockchain**: Ethers.js v6 + Infura
- **Charts**: Recharts
- **Price API**: CoinGecko API v3

## Getting Started

### Prerequisites

- Node.js 18+ 
- Firebase account
- Infura account (for blockchain features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/0xMochamad-Arif-Fahrizal/Crypto-Portfolio-Tracker.git
cd Crypto-Portfolio-Tracker
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file in the root directory:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Server-only
INFURA_API_KEY=your_infura_project_id
USDT_CONTRACT_ADDRESS=0xdAC17F958D2ee523a2206206994597C13D831ec7
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
crypto-portfolio/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── api/             # API routes
│   ├── dashboard/       # Dashboard page
│   ├── portfolio/       # Portfolio management
│   ├── wallet/          # Blockchain wallet viewer
│   └── history/         # Price charts
├── components/          # Reusable components
├── lib/
│   ├── api/            # API utilities
│   ├── context/        # React contexts
│   ├── firebase/       # Firebase config
│   └── firestore/      # Firestore operations
└── .kiro/              # Kiro steering files
```

## Features Overview

### Authentication
- Email/password registration and login
- Protected routes with middleware
- Session management with Firebase Auth

### Portfolio Management
- Add/edit/delete crypto assets
- Real-time PnL calculations
- Portfolio summary with total value and ROI

### Blockchain Integration
- Read ETH and USDT balances from any Ethereum address
- Direct blockchain queries via Infura
- No wallet connection required

### Historical Charts
- Interactive price charts for BTC, ETH, USDT
- Multiple timeframes: 7D, 30D, 90D
- Responsive design with Recharts

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The app will be live at `https://your-project.vercel.app`

## Security

- Firebase Security Rules configured for data isolation
- API keys stored in environment variables
- Server-side API routes for external calls
- Protected routes with authentication checks

## License

MIT

## Author

Mochamad Arif Fahrizal
