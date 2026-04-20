/**
 * Create Admin User Script
 *
 * Usage:
 *   ADMIN_EMAIL=admin@pharmaconnect.ng ADMIN_PASSWORD=<secure-password> \
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json npx ts-node src/scripts/create-admin.ts
 *
 * Or if running from a machine with Firebase CLI logged in:
 *   ADMIN_EMAIL=admin@pharmaconnect.ng ADMIN_PASSWORD=<secure-password> npx ts-node src/scripts/create-admin.ts
 *
 * Environment variables:
 *   ADMIN_EMAIL    - Admin email address (required)
 *   ADMIN_PASSWORD - Admin password, min 12 chars (required)
 *
 * This script:
 * 1. Creates a Firebase Auth user (or uses existing one)
 * 2. Sets custom claims { role: 'admin' }
 * 3. Creates the user profile in Firestore
 */
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Read credentials from environment variables — never hardcode secrets
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
  console.error('Usage: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=<secure-password> npx ts-node src/scripts/create-admin.ts');
  process.exit(1);
}

if (ADMIN_PASSWORD.length < 12) {
  console.error('ERROR: ADMIN_PASSWORD must be at least 12 characters.');
  process.exit(1);
}

const ADMIN_FIRST_NAME = 'Platform';
const ADMIN_LAST_NAME = 'Admin';
const ADMIN_PHONE = '+2348000000000';

async function createAdmin() {
  const auth = admin.auth();
  const db = admin.firestore();

  let uid: string;

  // Step 1: Create or find user in Firebase Auth
  try {
    const existingUser = await auth.getUserByEmail(ADMIN_EMAIL);
    uid = existingUser.uid;
    console.log(`Found existing user: ${uid}`);
  } catch {
    // User doesn't exist, create one
    const newUser = await auth.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: `${ADMIN_FIRST_NAME} ${ADMIN_LAST_NAME}`,
      phoneNumber: ADMIN_PHONE,
    });
    uid = newUser.uid;
    console.log(`Created new user: ${uid}`);
  }

  // Step 2: Set admin custom claims
  await auth.setCustomUserClaims(uid, { role: 'admin' });
  console.log('Set admin custom claims');

  // Step 3: Create/update Firestore profile
  const now = new Date();
  const userRef = db.collection('users').doc(uid);
  const existing = await userRef.get();

  if (existing.exists) {
    await userRef.update({
      role: 'admin',
      updatedAt: now,
    });
    console.log('Updated existing Firestore profile to admin role');
  } else {
    await userRef.set({
      id: uid,
      email: ADMIN_EMAIL,
      phoneNumber: ADMIN_PHONE,
      firstName: ADMIN_FIRST_NAME,
      lastName: ADMIN_LAST_NAME,
      role: 'admin',
      isActive: true,
      isVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    console.log('Created Firestore profile');
  }

  console.log('\n=== Admin Account Created ===');
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log(`UID: ${uid}`);
  console.log(`Role: admin`);
  console.log('\nYou can now log in at: https://pharmaconnect-frontend-pi.vercel.app/auth/login');
}

createAdmin()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to create admin:', error);
    process.exit(1);
  });
