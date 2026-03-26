# PharmaConnect Frontend - Quick Start Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project with Email/Password and Phone auth enabled
- Firestore database initialized

## 1. Installation

```bash
# Install dependencies
npm install

# Or using yarn
yarn install
```

## 2. Configure Firebase

Get your Firebase credentials from the Firebase Console:

1. Go to Project Settings
2. Copy your web app config
3. Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

4. Fill in your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## 3. Configure Firestore

Create the following collection structure in Firestore:

```
- profiles (collection)
  - {uid} (document)
    - uid: string
    - email: string
    - phone: string (optional)
    - name: string
    - role: 'customer' | 'pharmacy' | 'delivery_provider' | 'admin'
    - createdAt: timestamp
    - updatedAt: timestamp
```

## 4. Enable Firebase Auth Methods

In Firebase Console:

1. **Authentication > Sign-in method**
2. Enable:
   - Email/Password
   - Phone Number (requires reCAPTCHA v3)

## 5. Start Development Server

```bash
npm run dev
```

Server starts on `http://localhost:3000`

## 6. Test the App

### Landing Page
```
http://localhost:3000
```

### Sign Up (Customer)
```
http://localhost:3000/register?role=customer
```

### Sign Up (Pharmacy)
```
http://localhost:3000/register?role=pharmacy
```

### Sign Up (Delivery Provider)
```
http://localhost:3000/register?role=delivery_provider
```

### Login
```
http://localhost:3000/login
```

### Dashboards (After Login)
- Customer: `http://localhost:3000/dashboard/customer`
- Pharmacy: `http://localhost:3000/dashboard/pharmacy`
- Delivery: `http://localhost:3000/dashboard/delivery`
- Admin: `http://localhost:3000/dashboard/admin`

## Common Issues

### Firebase Config Error
**Problem**: `Firebase: Error (auth/invalid-api-key)`

**Solution**: Check that all `NEXT_PUBLIC_FIREBASE_*` environment variables are set correctly

### Firestore Connection Error
**Problem**: `Failed to load profile` or permission errors

**Solution**:
1. Ensure Firestore database is created
2. Check Firestore security rules allow read/write to profiles collection

### reCAPTCHA Error (Phone Auth)
**Problem**: reCAPTCHA fails on phone login

**Solution**:
1. Enable reCAPTCHA v3 in Firebase Auth
2. Ensure domain is authorized in Firebase Console

## Development

### Project Structure

```
src/
├── app/              # Pages and layouts
├── components/       # Reusable components
├── contexts/         # React contexts (Auth)
└── lib/              # Utilities (Firebase, API)
```

### Adding a New Page

Create a new file in `src/app`:

```tsx
// src/app/about/page.tsx
export default function AboutPage() {
  return <h1>About PharmaConnect</h1>;
}
```

### Adding a New Component

Create in `src/components`:

```tsx
// src/components/ui/Badge.tsx
interface BadgeProps {
  children: string;
  variant?: 'primary' | 'secondary';
}

export default function Badge({ children, variant = 'primary' }: BadgeProps) {
  return (
    <span className={`px-2 py-1 rounded-full text-sm ${
      variant === 'primary' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'
    }`}>
      {children}
    </span>
  );
}
```

### Using the Auth Context

```tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const { user, profile, signOut } = useAuth();

  return (
    <div>
      <h1>Welcome, {profile?.name}</h1>
      <p>Email: {user?.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Making API Calls

```tsx
'use client';

import { apiClient } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await apiClient.get('/orders', {
          params: { limit: 10 }
        });
        setOrders(data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      }
    };

    fetchOrders();
  }, []);

  return <div>{/* render orders */}</div>;
}
```

## Building for Production

```bash
# Build the app
npm run build

# Start production server
npm run start
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set environment variables in Vercel project settings.

### Docker

See [README.md](./README.md#deployment) for Docker deployment guide.

## Next Steps

1. **Integrate Backend**: Connect to your Node.js/Express backend
2. **Add Features**:
   - Product catalog
   - Shopping cart
   - Order management
   - Chat system
3. **Customize Theme**: Edit `tailwind.config.ts`
4. **Add more pages**: Dashboard sub-pages, settings, etc.
5. **Mobile app**: Use `apps/mobile` for React Native version

## Support

- Firebase Docs: https://firebase.google.com/docs
- Next.js Docs: https://nextjs.org/docs
- Tailwind Docs: https://tailwindcss.com/docs
