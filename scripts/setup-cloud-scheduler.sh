#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# PharmaConnect — Cloud Scheduler Setup for Order Escalation
#
# This script creates a Cloud Scheduler job that triggers the order escalation
# endpoint every 15 minutes. The endpoint auto-confirms orders that have been
# pending pharmacy confirmation for too long, and escalates stale deliveries.
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - Firebase project: marketplace-50f56
#   - Backend deployed to Cloud Functions
#   - Service account with appropriate permissions
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

PROJECT_ID="marketplace-50f56"
REGION="us-central1"
API_BASE="https://${REGION}-${PROJECT_ID}.cloudfunctions.net/api"
SERVICE_ACCOUNT="cloud-scheduler@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🔧 Setting up Cloud Scheduler for PharmaConnect order escalation..."

# Step 1: Create a dedicated service account for Cloud Scheduler (if not exists)
echo "Creating service account..."
gcloud iam service-accounts create cloud-scheduler \
  --project="${PROJECT_ID}" \
  --display-name="Cloud Scheduler - Order Escalation" \
  --description="Service account for scheduled order escalation tasks" \
  2>/dev/null || echo "Service account already exists, continuing..."

# Step 2: Grant the service account the Cloud Functions Invoker role
echo "Granting Cloud Functions invoker role..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudfunctions.invoker" \
  --condition=None \
  2>/dev/null || true

# Step 3: Create custom claims for the service account (PLATFORM_ADMIN role)
# Note: The escalation endpoint requires authenticate + authorize(PLATFORM_ADMIN, SUPPORT_ADMIN)
# You need to set custom claims on this service account's Firebase Auth user.
# This is done via Firebase Admin SDK — see scripts/set-scheduler-claims.ts

# Step 4: Create the Cloud Scheduler job
echo "Creating Cloud Scheduler job..."
gcloud scheduler jobs create http order-escalation-check \
  --project="${PROJECT_ID}" \
  --location="${REGION}" \
  --schedule="*/15 * * * *" \
  --uri="${API_BASE}/api/v1/orders/escalation/run" \
  --http-method=POST \
  --headers="Content-Type=application/json" \
  --oidc-service-account-email="${SERVICE_ACCOUNT}" \
  --oidc-token-audience="${API_BASE}" \
  --attempt-deadline="300s" \
  --retry-config-max-retry-count=3 \
  --retry-config-max-retry-duration="600s" \
  --retry-config-min-backoff-duration="30s" \
  --description="Runs order escalation checks every 15 minutes - auto-confirms stale orders, escalates stuck deliveries"

echo ""
echo "✅ Cloud Scheduler job created!"
echo ""
echo "⚠️  IMPORTANT: You still need to:"
echo "  1. Create a Firebase Auth user for the service account"
echo "  2. Set custom claims: { role: 'platform_admin' } on that user"
echo "  3. Use the generated OIDC token for authentication"
echo ""
echo "  Alternatively, modify the escalation endpoint to also accept"
echo "  Cloud Scheduler's OIDC token via a separate middleware path."
echo ""
echo "To test manually:"
echo "  gcloud scheduler jobs run order-escalation-check --project=${PROJECT_ID} --location=${REGION}"
