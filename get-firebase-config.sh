#!/bin/bash

echo "🔥 Firebase Configuration Helper"
echo "================================="
echo ""
echo "To get your Firebase credentials:"
echo ""
echo "1. Go to: https://console.firebase.google.com"
echo "2. Select your project"
echo "3. Click the ⚙️ (Settings) icon → Project Settings"
echo "4. Scroll down to 'Your apps'"
echo "5. If no web app exists, click '</>' to add one"
echo "6. Copy the config values"
echo ""
echo "Then paste them into your .env file:"
echo ""
cat .env.example
echo ""
echo "Edit .env with: nano .env"
