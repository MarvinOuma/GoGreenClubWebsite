#!/bin/bash

# GoGreen Club Platform - Deployment Script

echo "🌍 GoGreen Club Platform - Deployment"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file from .env.example and add your Firebase config"
    exit 1
fi

# Check if logo exists
if [ ! -f public/logo.png ]; then
    echo "⚠️  Warning: Logo not found at public/logo.png"
    echo "Please add your logo before deploying"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Installing Cloud Functions dependencies..."
cd functions
npm install
cd ..

echo ""
echo "🏗️  Building application..."
npm run build

echo ""
echo "🚀 Deploying to Firebase..."
firebase deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your app is now live! 🎉"
