/**
 * Create Admin User Script
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json npx ts-node src/scripts/create-admin.ts
 *
 * Or if running from a machine with Firebase CLI logged in:
 *   npx ts-node src/scripts/create-admin.ts
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

const ADMIN_EMAIL = 'admin@pharmaconnect.ng';
const ADMIN_PASSWORD = 'REDACTED_SECRET';
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
