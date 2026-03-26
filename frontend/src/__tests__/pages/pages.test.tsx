/**
 * Page rendering tests — verify all pages render without crashing
 * and contain expected content
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: { currentUser: null, onAuthStateChanged: jest.fn() },
  db: {},
  storage: {},
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    signInWithPhone: jest.fn(),
    verifyPhoneOtp: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Import pages after mocks
import HomePage from '@/app/page';
import AboutPage from '@/app/about/page';
import ContactPage from '@/app/contact/page';
import BrowsePage from '@/app/browse/page';
import LoginPage from '@/app/(auth)/login/page';
import RegisterPage from '@/app/(auth)/register/page';

describe('Page Rendering Tests', () => {
  describe('HomePage', () => {
    it('renders without crashing', () => {
      render(<HomePage />);
      expect(screen.getByText(/Find Your Pharmacy/i)).toBeInTheDocument();
    });

    it('has search input', () => {
      render(<HomePage />);
      expect(screen.getByPlaceholderText(/Search for medications/i)).toBeInTheDocument();
    });

    it('has CTA buttons', () => {
      render(<HomePage />);
      expect(screen.getByText(/Get Started as Customer/i)).toBeInTheDocument();
      expect(screen.getByText(/Join as Pharmacy/i)).toBeInTheDocument();
    });

    it('has navigation bar', () => {
      const { container } = render(<HomePage />);
      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('AboutPage', () => {
    it('renders without crashing', () => {
      const { container } = render(<AboutPage />);
      expect(container.querySelector('h1, h2')).toBeInTheDocument();
    });

    it('has navigation bar', () => {
      const { container } = render(<AboutPage />);
      expect(container.querySelector('nav')).toBeInTheDocument();
    });
  });

  describe('ContactPage', () => {
    it('renders without crashing', () => {
      const { container } = render(<ContactPage />);
      expect(container.querySelector('h1, h2')).toBeInTheDocument();
    });

    it('has contact form fields', () => {
      const { container } = render(<ContactPage />);
      const inputs = container.querySelectorAll('input, textarea');
      expect(inputs.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('BrowsePage', () => {
    it('renders without crashing', () => {
      const { container } = render(<BrowsePage />);
      expect(container.querySelector('h1, h2')).toBeInTheDocument();
    });

    it('has pharmacy cards', () => {
      render(<BrowsePage />);
      const viewDetailsButtons = screen.getAllByText(/View Details/i);
      expect(viewDetailsButtons.length).toBeGreaterThan(0);
    });
  });

  describe('LoginPage', () => {
    it('renders without crashing', () => {
      render(<LoginPage />);
      expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
    });

    it('has email and password inputs', () => {
      const { container } = render(<LoginPage />);
      const inputs = container.querySelectorAll('input');
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });

    it('has sign in button', () => {
      render(<LoginPage />);
      const buttons = screen.getAllByRole('button');
      const signInButton = buttons.find(b => b.textContent?.includes('Sign In'));
      expect(signInButton).toBeTruthy();
    });

    it('has link to register', () => {
      render(<LoginPage />);
      expect(screen.getByText(/Create New Account/i)).toBeInTheDocument();
    });
  });

  describe('RegisterPage', () => {
    it('renders without crashing', () => {
      const { container } = render(<RegisterPage />);
      const heading = container.querySelector('h1, h2');
      expect(heading).toBeInTheDocument();
    });
  });
});
