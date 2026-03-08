#!/bin/bash

echo "🔥 Firebase Setup Script"
echo "========================"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Installing Firebase CLI..."
    npm install -g firebase-tools
fi

# Login to Firebase
echo "Step 1: Login to Firebase"
firebase login

# List projects
echo ""
echo "Step 2: Your Firebase Projects:"
firebase projects:list

# Prompt for project selection
echo ""
read -p "Enter your Firebase Project ID: " PROJECT_ID

# Use the project
firebase use "$PROJECT_ID"

echo ""
echo "✅ Firebase project set to: $PROJECT_ID"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Firebase credentials"
echo "2. Enable Authentication (Email + Google) in Firebase Console"
echo "3. Create Firestore Database in Firebase Console"
echo "4. Enable Storage in Firebase Console"
echo "5. Run: firebase deploy --only firestore:rules,storage:rules,functions"
echo ""
echo "Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID"
