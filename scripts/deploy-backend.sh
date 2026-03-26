#!/bin/bash
# PharmaConnect Backend Deployment Script
# Deploys the Express.js backend to Firebase Cloud Functions
#
# Prerequisites:
#   1. Node.js 20+ installed
#   2. Firebase CLI installed: npm install -g firebase-tools
#   3. Authenticated: firebase login
#   4. Firebase project: marketplace-50f56
#
# Usage:
#   chmod +x scripts/deploy-backend.sh
#   ./scripts/deploy-backend.sh

set -e

echo "=========================================="
echo "  PharmaConnect Backend Deployment"
echo "=========================================="

# Check Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Install it with:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check authentication
echo "🔑 Checking Firebase authentication..."
firebase projects:list > /dev/null 2>&1 || {
    echo "❌ Not authenticated. Run: firebase login"
    exit 1
}

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "📁 Project directory: $PROJECT_DIR"

# Install shared dependencies
echo "📦 Installing shared dependencies..."
cd shared && npm ci && cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm ci && cd ..

# Build backend
echo "🔨 Building backend..."
cd backend && npm run build && cd ..

# Deploy to Firebase
echo "🚀 Deploying to Firebase Cloud Functions..."
firebase deploy --only functions --project marketplace-50f56

echo ""
echo "=========================================="
echo "  ✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Your API is now live at:"
echo "  https://us-central1-marketplace-50f56.cloudfunctions.net/api"
echo ""
echo "Next steps:"
echo "  1. Set NEXT_PUBLIC_API_URL on Vercel:"
echo "     https://us-central1-marketplace-50f56.cloudfunctions.net/api/v1"
echo "  2. Set NEXT_PUBLIC_SOCKET_URL on Vercel:"
echo "     https://us-central1-marketplace-50f56.cloudfunctions.net/api"
echo ""
