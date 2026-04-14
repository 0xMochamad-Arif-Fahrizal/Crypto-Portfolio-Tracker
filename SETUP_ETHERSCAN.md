# Setup Etherscan API

## Mengapa Perlu Etherscan API?

Etherscan API digunakan untuk membaca transaksi historis dari blockchain Ethereum. Dengan ini, sistem bisa secara otomatis menghitung cost basis wallet Anda tanpa perlu input manual.

## Langkah-langkah Setup

### 1. Buat Akun Etherscan (Gratis)

1. Kunjungi https://etherscan.io/
2. Klik **Sign In** di pojok kanan atas
3. Klik **Click to sign up** jika belum punya akun
4. Isi form registrasi:
   - Username
   - Email address
   - Password
5. Verifikasi email Anda

### 2. Generate API Key

1. Login ke Etherscan
2. Klik username Anda di pojok kanan atas
3. Pilih **API Keys** dari dropdown menu
4. Klik tombol **+ Add** untuk membuat API key baru
5. Isi form:
   - **AppName**: Masukkan nama aplikasi (contoh: "Crypto Portfolio Tracker")
   - Klik **Create New API Key**
6. Copy API key yang muncul (format: `XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

### 3. Tambahkan ke Environment Variables

1. Buka file `.env.local` di root project
2. Tambahkan baris berikut:

```env
ETHERSCAN_API_KEY=paste_your_api_key_here
```

3. Save file

### 4. Restart Development Server

```bash
# Stop server (Ctrl+C)
# Start server again
npm run dev
```

## Verifikasi Setup

### Test API Key

Anda bisa test API key dengan curl:

```bash
curl "https://api.etherscan.io/api?module=account&action=balance&address=0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae&tag=latest&apikey=YOUR_API_KEY"
```

Response yang benar:
```json
{
  "status":"1",
  "message":"OK",
  "result":"748997604382925139479303"
}
```

### Test di Aplikasi

1. Buka halaman Integrated (`http://localhost:3000/integrated`)
2. Masukkan wallet address (contoh: `0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae`)
3. Klik **Load Wallet**
4. Jika berhasil, Anda akan melihat:
   - "Analyzing transaction history..." di bawah input
   - Setelah selesai, cost basis akan otomatis terisi

## Rate Limits

### Free Tier (Default)
- **5 calls/second**
- **100,000 calls/day**
- Cukup untuk penggunaan normal

### Jika Kena Rate Limit
Error yang muncul:
```
Max rate limit reached
```

Solusi:
1. Tunggu beberapa detik
2. Coba lagi
3. Sistem sudah menambahkan delay 2 detik antar request untuk menghindari rate limit

## Troubleshooting

### API Key Invalid
**Error:** `Invalid API Key`

**Solusi:**
1. Cek apakah API key sudah benar di `.env.local`
2. Pastikan tidak ada spasi di awal/akhir API key
3. Restart development server

### API Key Not Found
**Error:** `Etherscan API key not configured`

**Solusi:**
1. Pastikan file `.env.local` ada di root project
2. Pastikan nama variable adalah `ETHERSCAN_API_KEY` (huruf besar semua)
3. Restart development server

### Rate Limit Exceeded
**Error:** `Max rate limit reached`

**Solusi:**
1. Tunggu 1-2 menit
2. Coba lagi
3. Jika sering terjadi, pertimbangkan upgrade ke paid plan

### No Transactions Found
**Message:** `No transactions found`

**Kemungkinan:**
1. Wallet address belum pernah melakukan transaksi
2. Wallet address salah
3. Wallet baru dibuat

**Solusi:**
- Cek wallet address di Etherscan.io untuk memastikan ada transaksi
- Gunakan manual override jika perlu

## Security Best Practices

### 1. Jangan Commit API Key ke Git

File `.env.local` sudah ada di `.gitignore`, tapi pastikan:

```bash
# Check .gitignore
cat .gitignore | grep .env.local
```

Harus ada baris:
```
.env.local
```

### 2. Jangan Share API Key

- API key bersifat pribadi
- Jangan share di public repository
- Jangan share di screenshot/video

### 3. Regenerate Jika Ter-expose

Jika API key tidak sengaja ter-expose:
1. Login ke Etherscan
2. Go to API Keys
3. Delete API key lama
4. Generate API key baru
5. Update `.env.local`

## Upgrade ke Paid Plan (Opsional)

Jika Anda butuh rate limit lebih tinggi:

### Community Plan ($99/month)
- 10 calls/second
- 500,000 calls/day

### Professional Plan ($299/month)
- 20 calls/second
- 2,000,000 calls/day

### Enterprise Plan (Custom)
- Custom rate limits
- Dedicated support

**Untuk kebanyakan user, free tier sudah cukup!**

## Alternative: Alchemy/Infura

Jika Etherscan tidak tersedia, Anda bisa menggunakan:

### Alchemy
- https://www.alchemy.com/
- Free tier: 300M compute units/month
- Lebih generous rate limits

### Infura
- https://infura.io/
- Free tier: 100,000 requests/day
- Sudah digunakan untuk membaca balance

**Note:** Implementasi saat ini menggunakan Etherscan karena API-nya lebih simple untuk transaction history.

## FAQ

### Q: Apakah API key gratis selamanya?
**A:** Ya, Etherscan free tier gratis selamanya dengan rate limit 5 calls/second.

### Q: Apakah aman menggunakan API key?
**A:** Ya, API key hanya untuk read-only access. Tidak bisa digunakan untuk melakukan transaksi atau mengakses private key.

### Q: Berapa lama proses analisis transaksi?
**A:** Tergantung jumlah transaksi:
- 1-10 transaksi: ~10-20 detik
- 10-50 transaksi: ~30-60 detik
- 50+ transaksi: ~2-5 menit

### Q: Apakah perlu re-analyze setiap kali load wallet?
**A:** Tidak. Hasil analisis disimpan di Firebase. Re-analysis hanya dilakukan jika Anda klik "Load Wallet" lagi atau jika ada transaksi baru.

### Q: Bagaimana jika saya punya banyak wallet?
**A:** Anda bisa load wallet yang berbeda. Cost basis akan disimpan per wallet address.

## Support

Jika ada masalah dengan Etherscan API:
- Etherscan Support: https://etherscan.io/contactus
- Etherscan API Docs: https://docs.etherscan.io/
- Etherscan Status: https://status.etherscan.io/
