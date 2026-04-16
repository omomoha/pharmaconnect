/**
 * Jest Setup File
 * Sets up environment variables and global mocks for test runs
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.PAYSTACK_SECRET_KEY = 'sk_test_mock';
process.env.PAYSTACK_PUBLIC_KEY = 'pk_test_mock';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.SENTRY_DSN = '';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

// Suppress console output in tests (uncomment to silence logs)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };
