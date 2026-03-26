# PharmaConnect Frontend

Next.js 14 frontend for the PharmaConnect online pharmacy marketplace using Firebase Client SDK.

## Project Structure

```
src/
├── app/                              # Next.js App Router pages
│   ├── (auth)/                       # Authentication pages (grouped layout)
│   │   ├── layout.tsx                # Auth layout (centered card)
│   │   ├── login/page.tsx            # Login page (email/phone tabs)
│   │   └── register/page.tsx         # Registration page (role selector)
│   ├── (dashboard)/                  # Dashboard pages (protected with sidebar)
│   │   ├── layout.tsx                # Dashboard layout with sidebar
│   │   ├── customer/page.tsx         # Customer dashboard
│   │   ├── pharmacy/page.tsx         # Pharmacy dashboard
│   │   ├── delivery/page.tsx         # Delivery provider dashboard
│   │   └── admin/page.tsx            # Admin dashboard
│   ├── globals.css                   # Global styles
│   ├── layout.tsx                    # Root layout with AuthProvider
│   └── page.tsx                      # Landing page
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx                # Public navigation bar
│   │   └── Sidebar.tsx               # Dashboard sidebar (role-based)
│   └── ui/
│       ├── Button.tsx                # Button component (variants, states)
│       ├── Input.tsx                 # Input component (with label, error)
│       └── Card.tsx                  # Card components (Card, Header, Content, Footer)
├── contexts/
│   └── AuthContext.tsx               # Firebase auth context provider
└── lib/
    ├── api.ts                        # API client with auth interceptor
    └── firebase.ts                   # Firebase Client SDK initialization
```

## Features

- **Firebase Authentication**: Email/password and phone number authentication
- **Role-Based Access Control**: Customer, Pharmacy, Delivery Provider, Admin roles
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **TypeScript**: Full type safety
- **Protected Routes**: Dashboard routes require authentication
- **API Integration**: Automatic Firebase token injection in API calls
- **Green Theme**: Pharmacy-themed color scheme

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase credentials:

```bash
cp .env.example .env.local
```

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Socket.IO (optional)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Key Components

### AuthContext

Provides authentication state and methods:

```typescript
const { user, profile, signUp, signIn, signOut, signInWithPhone, verifyOtp } = useAuth();
```

Features:
- Listen to Firebase auth state changes
- Automatic Firestore profile fetching
- Backend profile setup on signup
- Phone number authentication with OTP
- Error handling with toast notifications

### API Client

Automatic Firebase token injection:

```typescript
import { apiClient } from '@/lib/api';

// Automatically includes Bearer token header
const data = await apiClient.get('/endpoint');
const result = await apiClient.post('/endpoint', { data });
```

### UI Components

Reusable, customizable components:

- `Button` - Primary, secondary, outline, ghost variants
- `Input` - With label, error state, helper text
- `Card` - Card, CardHeader, CardContent, CardFooter

## Pages

### Public Pages

- `/` - Landing page with hero, features, CTA
- `/login` - Email/phone login
- `/register` - Role-based registration

### Dashboard Pages (Protected)

#### Customer
- `/dashboard/customer` - Main dashboard with orders and nearby pharmacies

#### Pharmacy
- `/dashboard/pharmacy` - Stats, recent orders, low stock alerts

#### Delivery Provider
- `/dashboard/delivery` - Active deliveries, earnings, available orders

#### Admin
- `/dashboard/admin` - Platform stats, flagged chats, pending approvals

## Styling

Uses Tailwind CSS with custom theme:

- **Primary Colors**: Green shades (pharmacy theme)
- **Secondary Colors**: Blue shades
- **Font**: Inter
- **Responsive**: Mobile-first approach

Custom utility classes:
- `.container-custom` - Max width with padding
- `.button-base` - Base button styles
- `.text-gradient` - Gradient text effect

## Firebase Integration

### Initialization

```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, getFirestore, getStorage } from 'firebase/auth';

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### Profile Structure (Firestore)

```typescript
interface UserProfile {
  uid: string;
  email?: string;
  phone?: string;
  name: string;
  role: 'customer' | 'pharmacy' | 'delivery_provider' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}
```

## Backend Integration

After signup, the frontend calls:
```
POST /api/v1/auth/setup-profile
```

With payload:
```json
{
  "uid": "firebase_uid",
  "email": "user@example.com",
  "name": "User Name",
  "role": "customer"
}
```

## Deployment

### Vercel (Recommended)

```bash
vercel
```

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

EXPOSE 3000
CMD ["npm", "start"]
```

## Security

- Firebase auth tokens auto-attached to API requests
- Environment variables for Firebase config (public keys only)
- Protected routes with auth checks
- CORS-safe API calls

## Performance

- Image optimization with Next.js
- CSS-in-JS with Tailwind (no runtime overhead)
- Code splitting via App Router
- Streaming SSR support

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code style
2. Use TypeScript for type safety
3. Test responsive design on mobile
4. Keep components small and reusable

## License

Proprietary - PharmaConnect
