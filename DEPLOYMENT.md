# PharmaConnect — Production Deployment Guide

## Prerequisites

- Firebase CLI installed and authenticated
- gcloud CLI installed and authenticated
- Access to Firebase project: `marketplace-50f56`
- Node.js 20 LTS

## 1. Environment Variables

### Backend (Cloud Functions)

Set these via Firebase Functions secrets:

```bash
# REQUIRED — will fail to start without these in production
firebase functions:secrets:set ENCRYPTION_KEY
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

firebase functions:secrets:set JWT_SECRET
# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# REQUIRED — payment processing
firebase functions:secrets:set PAYSTACK_SECRET_KEY
firebase functions:secrets:set PAYSTACK_PUBLIC_KEY

# OPTIONAL — monitoring (recommended)
firebase functions:secrets:set SENTRY_DSN

# OPTIONAL — AI features
firebase functions:secrets:set ANTHROPIC_API_KEY
```

Set these via Firebase Functions config:

```bash
firebase functions:config:set \
  app.node_env="production" \
  app.client_url="https://pharmaconnect-frontend-pi.vercel.app" \
  app.admin_url="https://pharmaconnect-frontend-pi.vercel.app" \
  app.allowed_origins="https://pharmaconnect-frontend-pi.vercel.app" \
  app.log_level="info"
```

### Frontend (Vercel)

Set in Vercel dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=marketplace-50f56.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=marketplace-50f56
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=marketplace-50f56.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_API_URL=https://us-central1-marketplace-50f56.cloudfunctions.net/api/api/v1
NEXT_PUBLIC_SOCKET_URL=https://us-central1-marketplace-50f56.cloudfunctions.net/api
```

## 2. Deploy Firestore Rules and Indexes

```bash
cd pharmaconnect

# Deploy security rules
firebase deploy --only firestore:rules

# Deploy composite indexes
firebase deploy --only firestore:indexes
```

## 3. Deploy Backend (Cloud Functions)

```bash
cd pharmaconnect

# Build shared types
cd shared && npm run build && cd ..

# Deploy functions
firebase deploy --only functions
```

## 4. Set Up Cloud Scheduler

Run the setup script:

```bash
chmod +x scripts/setup-cloud-scheduler.sh
./scripts/setup-cloud-scheduler.sh
```

Or manually:

```bash
gcloud scheduler jobs create http order-escalation-check \
  --project=marketplace-50f56 \
  --location=us-central1 \
  --schedule="*/15 * * * *" \
  --uri="https://us-central1-marketplace-50f56.cloudfunctions.net/api/api/v1/orders/escalation/run" \
  --http-method=POST \
  --oidc-service-account-email=cloud-scheduler@marketplace-50f56.iam.gserviceaccount.com
```

## 5. Redis / Memorystore (Optional)

The rate limiter now has an in-memory fallback, so Redis is not a launch blocker.

For production Redis, set up Cloud Memorystore:

```bash
gcloud redis instances create pharmaconnect-cache \
  --project=marketplace-50f56 \
  --region=us-central1 \
  --tier=basic \
  --size=1 \
  --redis-version=redis_7_0
```

Then set `REDIS_URL` in Cloud Functions config.

## 6. Post-Deploy Verification

```bash
# Health check
curl https://us-central1-marketplace-50f56.cloudfunctions.net/api/health

# Test escalation (requires admin auth)
# Use Firebase Auth admin token

# Verify Sentry is receiving events
# Check Sentry dashboard for test errors
```

## 7. Monitoring

- **Sentry**: Error tracking and performance monitoring (set SENTRY_DSN)
- **Cloud Logging**: Automatic via Cloud Functions
- **Cloud Monitoring**: Set up alerts for 5xx error rate, latency, and function crashes

## Rollback

```bash
# List deployed functions
firebase functions:list

# Roll back to previous version
firebase functions:delete api
firebase deploy --only functions
```
