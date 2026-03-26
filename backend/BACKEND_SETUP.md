# PharmaConnect Backend Setup Guide

## Overview

The PharmaConnect backend is a Node.js + Express.js server that uses Firebase Admin SDK for authentication and data management, with Redis for caching and rate limiting. It provides REST APIs and WebSocket support for real-time chat and delivery tracking.

## Architecture

- **Framework**: Express.js 4.18+
- **Language**: TypeScript 5.3+
- **Database**: Firestore (Firebase)
- **Cache**: Redis (ioredis)
- **Real-time**: Socket.IO 4.7+
- **Authentication**: Firebase Auth (custom claims for roles)
- **Payments**: Paystack integration
- **File Storage**: Firebase Storage
- **Validation**: Zod
- **Logging**: Winston

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── index.ts          # Environment config with Zod validation
│   │   ├── firebase.ts       # Firebase Admin SDK initialization
│   │   └── redis.ts          # Redis connection setup
│   │
│   ├── middleware/
│   │   ├── authenticate.ts   # Firebase Auth verification
│   │   ├── authorize.ts      # Role-based access control
│   │   ├── validate.ts       # Zod validation middleware
│   │   ├── rateLimiter.ts    # Redis-based rate limiting
│   │   └── errorHandler.ts   # Global error handling
│   │
│   ├── modules/
│   │   ├── auth/            # User authentication & profiles
│   │   ├── pharmacy/        # Pharmacy management
│   │   ├── order/           # Order processing
│   │   ├── delivery/        # Delivery assignments & verification
│   │   ├── payment/         # Paystack integration & webhooks
│   │   ├── chat/            # Chat with moderation
│   │   └── admin/           # Admin operations & approvals
│   │
│   ├── services/
│   │   └── moderation/      # Chat moderation (keyword matching)
│   │
│   ├── utils/
│   │   ├── helpers.ts       # Utility functions
│   │   └── logger.ts        # Winston logger
│   │
│   ├── app.ts              # Express app factory
│   └── index.ts            # Entry point
│
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Required environment variables:
- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment (development, production, test)
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Firebase service account email
- `FIREBASE_PRIVATE_KEY` - Firebase private key (with newlines as `\n`)
- `FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `REDIS_URL` - Redis connection URL
- `PAYSTACK_SECRET_KEY` - Paystack secret key
- `PAYSTACK_PUBLIC_KEY` - Paystack public key
- `CLIENT_URL` - Client application URL
- `ADMIN_URL` - Admin dashboard URL

### 3. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:4000`

### 4. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /setup-profile` - Create Firestore profile after Firebase signup
- `GET /me` - Get current user profile
- `PUT /me` - Update user profile

### Pharmacies (`/api/v1/pharmacies`)
- `POST /register` - Register new pharmacy
- `GET /nearby` - Get nearby pharmacies
- `GET /search` - Search pharmacies
- `GET /:pharmacyId` - Get pharmacy details
- `GET /:pharmacyId/products` - Get pharmacy products
- `POST /:pharmacyId/products` - Add product to pharmacy

### Orders (`/api/v1/orders`)
- `POST /` - Create new order
- `GET /user/my-orders` - Get user's orders
- `GET /:orderId` - Get order details
- `PATCH /:orderId/status` - Update order status
- `POST /:orderId/cancel` - Cancel order

### Delivery (`/api/v1/delivery`)
- `POST /providers/register` - Register delivery provider
- `GET /available` - Get available delivery providers
- `POST /assignments` - Create delivery assignment
- `GET /assignments/:assignmentId` - Get assignment details
- `PATCH /assignments/:assignmentId/status` - Update assignment status
- `POST /assignments/:assignmentId/verify-code` - Verify security code

### Payments (`/api/v1/payments`)
- `POST /initialize` - Initialize Paystack payment
- `GET /verify/:reference` - Verify payment
- `POST /webhook` - Paystack webhook handler
- `POST /refund` - Request refund

### Chat (`/api/v1/chat`)
- `POST /conversations` - Create conversation
- `GET /conversations` - Get user conversations
- `GET /conversations/:conversationId` - Get conversation with messages
- `POST /conversations/:conversationId/messages` - Send message
- `PATCH /conversations/:conversationId/messages/:messageId/read` - Mark as read
- `POST /conversations/:conversationId/close` - Close conversation

### Admin (`/api/v1/admin`)
- `GET /pending-pharmacies` - Get pending pharmacies
- `POST /pharmacies/:pharmacyId/approve` - Approve pharmacy
- `POST /pharmacies/:pharmacyId/reject` - Reject pharmacy
- `GET /pending-providers` - Get pending delivery providers
- `POST /providers/:providerId/approve` - Approve provider
- `POST /providers/:providerId/reject` - Reject provider
- `GET /flagged-alerts` - Get flagged chat alerts
- `POST /flagged-alerts/:alertId/review` - Review flagged alert
- `GET /dashboard` - Get dashboard statistics
- `GET /transactions` - Get all transactions

## Socket.IO Events

Real-time communication for chat and delivery:

### Chat Events
- `chat:join_room` - Join chat room
- `chat:leave_room` - Leave chat room
- `chat:send_message` - Send message
- `chat:receive_message` - Receive message
- `chat:mark_read` - Mark message as read
- `chat:typing` - User is typing
- `chat:stopped_typing` - User stopped typing

### Delivery Events
- `delivery:location_update` - Update delivery location
- `delivery:status_changed` - Delivery status changed
- `delivery:rider_arriving` - Rider arriving at destination
- `delivery:completed` - Delivery completed
- `delivery:cancelled` - Delivery cancelled

## Authentication

The backend uses Firebase Authentication with custom claims for role management:

1. **Client-side signup**: Users sign up via Firebase Client SDK
2. **Backend profile setup**: After signup, clients call `/auth/setup-profile` to create Firestore profile and set custom claims
3. **Token verification**: All protected endpoints verify Firebase ID token and check custom claims for role

### Roles
- `customer` - End users
- `pharmacy_admin` - Pharmacy managers
- `delivery_admin` - Delivery provider managers
- `platform_admin` - Platform administrators
- `support_admin` - Support team

## Chat Moderation

3-layer moderation pipeline:

1. **Keyword Matching** (Layer 1): Detects prescription drug keywords
2. **NLP Classification** (Layer 2): Stub for OpenAI/custom model integration
3. **Context Analysis** (Layer 3): Stub for contextual analysis

Flagged messages trigger alerts visible to support admins.

## Rate Limiting

Redis-based rate limiting with different tiers:
- Public: 60 requests/minute
- Authenticated: 120 requests/minute
- Admin: 300 requests/minute
- Strict (sensitive ops): 10 requests/minute

## Database Schema

### Collections
- `users` - User profiles
- `pharmacies` - Pharmacy information
- `pharmacy_products` - Products in pharmacies
- `drug_catalog` - OTC drug whitelist
- `orders` - Customer orders
- `order_items` - Items in orders
- `delivery_providers` - Delivery service providers
- `delivery_riders` - Individual delivery riders
- `delivery_assignments` - Delivery assignments
- `delivery_verifications` - Security codes for deliveries
- `conversations` - Chat conversations
- `messages` - Chat messages
- `flagged_alerts` - Moderation alerts
- `reviews` - Customer reviews
- `notifications` - User notifications
- `audit_logs` - System audit logs

## Error Handling

The backend uses a consistent error response format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Logging

Winston logger configured with:
- **Console output** in development
- **File output** in production (error.log and combined.log)
- **Log levels**: error, warn, info, debug

Logs are stored in `./logs` directory.

## Security Best Practices

1. **Environment variables**: All sensitive data in `.env`
2. **Helmet**: Security headers via helmet middleware
3. **CORS**: Configured for allowed origins
4. **Rate limiting**: Redis-based protection against abuse
5. **Input validation**: Zod schemas for all inputs
6. **Firebase Auth**: Secure token verification
7. **HMAC verification**: Paystack webhook signature verification

## Development

### Scripts

```bash
npm run dev          # Start dev server with auto-reload
npm run build        # Compile TypeScript
npm start            # Start production server
npm run type-check   # Type check without compilation
npm run lint         # Run ESLint
```

### Debugging

Enable debug logging:
```bash
LOG_LEVEL=debug npm run dev
```

## Deployment

1. Set environment variables on deployment platform
2. Build: `npm run build`
3. Install production dependencies: `npm ci --only=production`
4. Start: `npm start`

Ensure Redis and Firebase credentials are properly configured in your deployment environment.

## Testing

Integration tests should cover:
- Authentication flow
- Order lifecycle
- Delivery assignment and verification
- Chat moderation
- Payment webhook handling
- Admin approvals

## Integration with Frontend

The backend provides:
- REST API for all operations
- WebSocket for real-time updates
- CORS support for cross-origin requests
- JWT/Firebase token validation

Frontend should:
- Handle Firebase Auth on client-side
- Call `/auth/setup-profile` after signup
- Include Authorization header with Firebase ID token
- Connect to WebSocket for real-time features

## Support & Documentation

For detailed module documentation, see individual module READMEs or inline JSDoc comments.
