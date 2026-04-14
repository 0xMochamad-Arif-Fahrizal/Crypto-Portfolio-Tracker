# Wallet Cost Basis Feature - Automatic Transaction Analysis

## Overview

Fitur ini **secara otomatis menganalisis transaksi historis** dari wallet Ethereum Anda untuk menghitung cost basis dan P&L yang akurat. Tidak perlu input manual!

## Cara Kerja

### 1. Analisis Transaksi Otomatis

Ketika Anda memasukkan wallet address dan klik "Load Wallet", sistem akan:

1. **Membaca semua transaksi historis** dari blockchain menggunakan Etherscan API
2. **Mengidentifikasi transaksi incoming** (pembelian/transfer masuk) untuk ETH dan USDT
3. **Mengambil harga historis** dari CoinGecko pada saat setiap transaksi terjadi
4. **Menghitung cost basis** menggunakan metode FIFO (First In First Out)
5. **Menyimpan hasil** ke Firebase untuk akses cepat di masa depan

### 2. Perhitungan Cost Basis

**Untuk ETH:**
- Membaca semua transaksi incoming ETH
- Untuk setiap transaksi, mengambil harga ETH pada tanggal transaksi
- Menghitung: Total Invested = Σ(ETH Amount × Price at Transaction Time)
- Average Cost Basis = Total Invested / Total ETH Received

**Untuk USDT:**
- Membaca semua transaksi incoming USDT
- USDT adalah stablecoin, jadi diasumsikan $1 per USDT
- Total Invested = Total USDT Received

### 3. Perhitungan P&L

```
ETH P&L = (Current ETH Balance × Current ETH Price) - ETH Cost Basis
USDT P&L = (Current USDT Balance × $1) - USDT Cost Basis
Total Wallet P&L = ETH P&L + USDT P&L
Total P&L = Manual Portfolio P&L + Total Wallet P&L
```

## Setup

### 1. Dapatkan Etherscan API Key (Gratis)

1. Kunjungi https://etherscan.io/apis
2. Sign up untuk akun gratis
3. Buat API key baru
4. Copy API key

### 2. Tambahkan ke Environment Variables

Edit file `.env.local`:

```env
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### 3. Restart Development Server

```bash
npm run dev
```

## Cara Menggunakan

### 1. Load Wallet Address

1. Buka halaman **Integrated** (`/integrated`)
2. Masukkan alamat Ethereum wallet Anda
3. Klik **Load Wallet**
4. Tunggu proses analisis (bisa memakan waktu 30-60 detik tergantung jumlah transaksi)

### 2. Lihat Hasil Otomatis

Setelah analisis selesai, Anda akan melihat:
- **Total Portfolio Value**: Gabungan manual + wallet
- **Total P&L**: P&L yang akurat berdasarkan cost basis historis
- **Manual Portfolio**: P&L dari Firebase
- **Wallet Portfolio**: P&L dari blockchain dengan cost basis otomatis

### 3. Manual Override (Opsional)

Jika Anda ingin mengubah cost basis secara manual:
1. Klik tombol **Manual Override**
2. Input cost basis yang Anda inginkan
3. Save

## Contoh Hasil

### Skenario: Wallet dengan 1.3286 ETH dan $273 USDT

**Transaksi Historis:**
```
2023-01-15: Received 0.5 ETH @ $1,200 = $600
2023-06-20: Received 0.8286 ETH @ $1,800 = $1,491.48
2023-09-10: Received 273 USDT @ $1 = $273
```

**Perhitungan:**
```
ETH Cost Basis: $600 + $1,491.48 = $2,091.48
USDT Cost Basis: $273

Current Value:
- ETH: 1.3286 × $3,500 = $4,650.10
- USDT: 273 × $1 = $273

P&L:
- ETH P&L: $4,650.10 - $2,091.48 = +$2,558.62
- USDT P&L: $273 - $273 = $0
- Total Wallet P&L: +$2,558.62

If Manual Portfolio P&L = +$2.93
Total P&L = $2.93 + $2,558.62 = +$2,561.55
```

## Keuntungan vs Manual Input

| Aspek | Manual Input | Automatic Analysis |
|-------|--------------|-------------------|
| Setup | Perlu input cost basis manual | Otomatis dari blockchain |
| Akurasi | Tergantung ingatan user | Berdasarkan transaksi real |
| Update | Perlu update manual jika ada transaksi baru | Otomatis re-analyze |
| Waktu | Instant | 30-60 detik (first time) |
| Maintenance | Perlu tracking manual | Zero maintenance |

## Limitasi

### 1. Hanya Transaksi Incoming
- Sistem hanya menghitung transaksi incoming (transfer masuk)
- Transaksi outgoing (transfer keluar) tidak diperhitungkan
- Cocok untuk tracking "berapa banyak yang saya investasikan"

### 2. Transfer Antar Wallet Sendiri
- Jika Anda transfer dari wallet A ke wallet B (keduanya milik Anda), sistem akan menghitung transfer tersebut sebagai "pembelian" di wallet B
- Solusi: Gunakan manual override untuk wallet yang menerima transfer internal

### 3. Rate Limiting
- CoinGecko free tier: 10-30 calls/minute
- Sistem menambahkan delay 2 detik antar request
- Untuk wallet dengan banyak transaksi (>50), proses bisa memakan waktu beberapa menit

### 4. Historical Price Availability
- CoinGecko menyediakan historical price sejak 2015
- Transaksi sebelum 2015 mungkin tidak memiliki data harga

## Troubleshooting

### Analisis Gagal
- **Cek Etherscan API key**: Pastikan valid dan belum expired
- **Rate limit**: Tunggu beberapa menit dan coba lagi
- **Wallet baru**: Jika wallet tidak memiliki transaksi, cost basis akan 0

### P&L Tidak Akurat
- **Transfer internal**: Gunakan manual override
- **Transaksi kompleks**: Untuk DeFi, staking, dll, gunakan manual override
- **Missing transactions**: Etherscan mungkin tidak menampilkan semua transaksi untuk kontrak tertentu

### Proses Terlalu Lama
- **Banyak transaksi**: Normal untuk wallet dengan >50 transaksi
- **Cek console log**: Lihat progress di browser console
- **Fallback**: Sistem akan menggunakan saved cost basis jika analisis gagal

## Technical Details

### API Endpoints

**Etherscan API:**
- ETH Transactions: `https://api.etherscan.io/api?module=account&action=txlist`
- USDT Transactions: `https://api.etherscan.io/api?module=account&action=tokentx`

**CoinGecko API:**
- Historical Price: `https://api.coingecko.com/api/v3/coins/ethereum/history?date=DD-MM-YYYY`

### Data Storage

Cost basis disimpan di Firebase Firestore:
```
walletCostBasis/
  {userId}/
    coins/
      ETH/
        - totalInvested: number
        - averageCostBasis: number
        - walletAddress: string
        - updatedAt: timestamp
      USDT/
        - totalInvested: number
        - averageCostBasis: number
        - walletAddress: string
        - updatedAt: timestamp
```

### Caching

- Historical prices di-cache dalam memory untuk menghindari duplicate requests
- Cost basis hasil analisis disimpan di Firebase untuk akses cepat
- Re-analysis hanya dilakukan jika user klik "Load Wallet" lagi

## Future Improvements

1. **Support untuk lebih banyak token** (USDC, DAI, WBTC, dll)
2. **Tracking transaksi outgoing** untuk perhitungan realized gains
3. **Support untuk DeFi protocols** (Uniswap, Aave, dll)
4. **Export tax report** untuk keperluan pajak
5. **Background sync** untuk auto-update cost basis

