#!/bin/bash

# Script untuk deploy Firestore rules ke Firebase
# Project: crypto-portfolio-28

echo "🚀 Deploying Firestore Rules..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null
then
    echo "❌ Firebase CLI belum terinstall."
    echo ""
    echo "Install dengan salah satu cara berikut:"
    echo ""
    echo "1. Via npm (recommended):"
    echo "   npm install -g firebase-tools"
    echo ""
    echo "2. Via Homebrew (Mac):"
    echo "   brew install firebase-cli"
    echo ""
    echo "3. Via standalone binary:"
    echo "   curl -sL https://firebase.tools | bash"
    echo ""
    exit 1
fi

echo "✓ Firebase CLI terdeteksi"
echo ""

# Check if user is logged in
if ! firebase projects:list &> /dev/null
then
    echo "❌ Anda belum login ke Firebase."
    echo ""
    echo "Jalankan command berikut untuk login:"
    echo "   firebase login"
    echo ""
    exit 1
fi

echo "✓ Anda sudah login ke Firebase"
echo ""

# Deploy rules
echo "📤 Deploying rules ke project crypto-portfolio-28..."
firebase deploy --only firestore:rules --project crypto-portfolio-28

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Rules berhasil di-deploy!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Logout dari aplikasi (http://localhost:3000)"
    echo "2. Login kembali"
    echo "3. Test save wallet di /wallet page"
    echo ""
    echo "Verify di Firebase Console:"
    echo "https://console.firebase.google.com/project/crypto-portfolio-28/firestore/rules"
else
    echo ""
    echo "❌ Deploy gagal. Coba deploy manual via Firebase Console:"
    echo "https://console.firebase.google.com/project/crypto-portfolio-28/firestore/rules"
fi
