# PharmaConnect Pre-Launch Analysis Report

**Date:** April 18, 2026  
**Platform:** Online Pharmacy Marketplace (Web + Mobile)  
**Stack:** Next.js 14 | Node.js/Express | Flutter | Firebase | Paystack

---

## Executive Summary

PharmaConnect is approximately **85% launch-ready**. The backend API is solid with all 408 tests passing across 16 test suites. The web frontend is well-structured with minor responsive gaps on dashboard modals. The Flutter mobile app covers all 3 user roles across 29 screens but needs test coverage and text overflow handling. One critical security issue was found and remediated (exposed API key in git).

---

## 1. Backend API

### Test Results

- **Test Suites:** 16 passed / 16 total
- **Tests:** 408 passed / 408 total
- **Coverage:** Middleware, services, E2E flows, AI module, helpers

### API Surface

**69 endpoints across 9 modules:** Auth (6), Orders (8), Pharmacy (10), Payments (10), Delivery (9), Chat (7), Admin (13), AI (4), Subscriptions (5)

### Security Posture

**Strengths:** Zod input validation on all routes, Firebase token auth, RBAC + ownership checks, multi-tier rate limiting (Redis + in-memory fallback), Helmet.js security headers, global async error handler with error ID tracking, chat moderation (3-layer), IDOR protection.

**Issues Found:**

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | CRITICAL | MalPay API key exposed in `.env.marketplace-50f56` committed to git | FIXED - removed from tracking, .gitignore updated |
| 2 | HIGH | Dependency vulnerabilities: protobufjs (RCE), jsonwebtoken (signature bypass), @google-cloud/firestore (key logging) | Requires `npm audit fix --force` |
| 3 | MEDIUM | No audit logging for admin operations (approvals, rejections) | Recommended |
| 4 | MEDIUM | Strict rate limiter lacks exponential lockout for brute force | Recommended |
| 5 | LOW | No explicit CSRF token (Firebase token-based auth mitigates but not complete) | Post-launch |

---

## 2. Web Frontend (Next.js)

### Responsiveness Audit

**Overall:** 95% of responsive patterns follow mobile-first correctly. Container utilities are excellent. Issues are mostly in dashboard modal/detail views.

**Fixes Applied:**

| File | Issue | Fix |
|------|-------|-----|
| `layout.tsx` | Missing explicit viewport meta | Added `Viewport` export with proper mobile config |
| `delivery/messages/page.tsx` | `h-[600px]` hardcoded container | Changed to `h-[calc(100vh-220px)] min-h-[400px]` |
| `admin/approvals/page.tsx` | `grid-cols-3` stats bar not responsive | Changed to `grid-cols-1 sm:grid-cols-3` |
| `admin/approvals/page.tsx` | `h-[500px]` iframe/image previews | Changed to `h-[min(500px,70vh)]` responsive |
| `admin/orders/page.tsx` | `grid-cols-2` and `grid-cols-3` in modals | Added `grid-cols-1 sm:` breakpoints |
| `pharmacy/orders/page.tsx` | `grid-cols-2` in order detail modal | Added `grid-cols-1 sm:` breakpoint |
| `admin/flags/page.tsx` | `grid-cols-2` in flag detail | Added `grid-cols-1 sm:` breakpoint |
| `admin/users/page.tsx` | `grid-cols-2` in user detail | Added `grid-cols-1 sm:` breakpoint |
| `admin/moderation/page.tsx` | `grid-cols-2` in moderation detail | Added `grid-cols-1 sm:` breakpoint |
| `delivery/available/page.tsx` | `grid-cols-2` in order details | Added `grid-cols-1 sm:` breakpoint |
| `customer/pharmacies/page.tsx` | `grid-cols-2` in pharmacy card | Added `grid-cols-1 sm:` breakpoint |
| `browse/page.tsx` | `max-w-[200px]` filter input | Changed to `w-full sm:max-w-[200px]` |

**Verified OK:** All 9 table pages have `overflow-x-auto`, global CSS `.container-custom` has proper responsive padding, auth layout properly structured, no flex-wrap issues.

---

## 3. Mobile App (Flutter)

### Code Structure

- **79 Dart files** across config, models, providers, services, screens, widgets
- **29 screens** covering Customer (9), Pharmacy (5), Delivery (6), Auth (5), Admin/Shared (4)
- **23 production dependencies** - all compatible, no conflicts

### Test Coverage

- **Current:** 1 placeholder test file (default Flutter template - not applicable to actual app)
- **Recommendation:** Create unit tests for providers, services, and key widget tests

### UI Alignment Issues Found

| # | Severity | Issue | Screens Affected |
|---|----------|-------|-----------------|
| 1 | CRITICAL | ~400+ Text widgets without `maxLines`/`overflow` handling | All screens |
| 2 | CRITICAL | Only 5/29 screens use SafeArea | Auth, customer, pharmacy screens |
| 3 | HIGH | Row widgets without Flexible/Expanded children | Navigation, dashboard screens |
| 4 | HIGH | Only 7 instances of MediaQuery for responsive layouts across 29 screens | Virtually all |
| 5 | MEDIUM | 28 image references, only 9 have explicit `fit:` property | Products, pharmacy screens |
| 6 | MEDIUM | 10+ dialogs without height constraints | Cart, orders, pharmacy |
| 7 | MEDIUM | ~30% of padding values hardcoded instead of using UIConstants | Dashboard screens |
| 8 | LOW | 15 TODO comments for planned features | Order detail, conversations, services |

### What's Working Well

- Solid Provider-based state management
- Well-structured theme with comprehensive color palette and typography
- API service with retry logic and exponential backoff
- 3-role architecture fully implemented
- Real-time features (Socket.IO, notifications) integrated

---

## 4. Security Summary

### Fixed in This Analysis

1. **Exposed API key** - `.env.marketplace-50f56` and `.env.test` removed from git tracking; `.gitignore` updated to block all `.env.*` files except `.env.example`

### Remaining Action Items

| Priority | Action | Effort |
|----------|--------|--------|
| CRITICAL | Rotate the MalPay API key in production (it was exposed in git history) | 15 min |
| CRITICAL | Run `npm audit fix --force` to patch protobufjs, jsonwebtoken vulnerabilities | 1 hr (test after) |
| HIGH | Scrub API key from git history with `git filter-branch` or BFG | 30 min |
| HIGH | Replace `<img>` tags in frontend with `next/image` for optimization | 2 hrs |
| MEDIUM | Add audit logging for admin operations | 4 hrs |
| MEDIUM | Implement exponential lockout on auth rate limiter | 2 hrs |
| MEDIUM | Add cursor-based pagination for large datasets | 3 hrs |
| MEDIUM | Wire unhandled rejection handler to Sentry in production | 30 min |

---

## 5. Pre-Launch Checklist

### Must Do Before Launch

- [x] All 408 backend tests passing
- [x] CI pipeline green (Build #32)
- [x] Web responsive fixes applied (12 files)
- [x] Exposed env files removed from git
- [ ] Rotate MalPay API key
- [ ] Run `npm audit fix --force` and verify
- [ ] Scrub secrets from git history
- [ ] Add Flutter unit tests for critical paths

### Should Do Before Launch

- [ ] Add SafeArea to all Flutter screens
- [ ] Add text overflow handling to Flutter Text widgets
- [ ] Replace `<img>` with `next/image` in frontend
- [ ] Add audit logging for admin actions
- [ ] Test on 3-4 physical devices (phones 5.5"-6.7", one tablet)

### Post-Launch

- [ ] Implement exponential lockout for auth failures
- [ ] Add cursor-based pagination
- [ ] Implement responsive breakpoint system for Flutter
- [ ] Create comprehensive Flutter test suite
- [ ] Set up Sentry for unhandled rejections
- [ ] Add CSRF tokens for state-changing operations

---

*Report generated by automated analysis of PharmaConnect codebase*
