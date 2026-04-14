import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { auth, db } from '@/lib/firebase';

// Mock Firebase modules
jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  signInWithPhoneNumber: jest.fn(),
  RecaptchaVerifier: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import * as FirebaseAuth from 'firebase/auth';
import * as Firestore from 'firebase/firestore';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial loading state', () => {
    it('should have loading=true initially', () => {
      (FirebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation(() => {
        return () => {}; // Return unsubscribe function
      });

      const TestComponent = () => {
        const { loading, user } = useAuth();
        return (
          <div>
            <div data-testid="loading">{loading ? 'loading' : 'done'}</div>
            <div data-testid="user">{user ? 'logged in' : 'logged out'}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    });

    it('should set loading=false after auth state resolves', async () => {
      const mockUnsubscribe = jest.fn();
      (FirebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation(
        (_auth: any, callback: any) => {
          callback(null);
          return mockUnsubscribe;
        }
      );

      const TestComponent = () => {
        const { loading, user } = useAuth();
        return (
          <div>
            <div data-testid="loading">{loading ? 'loading' : 'done'}</div>
            <div data-testid="user">{user ? 'logged in' : 'logged out'}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('done');
      });
    });

    it('should initialize with user=null and profile=null', async () => {
      (FirebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation(
        (_auth: any, callback: any) => {
          callback(null);
          return jest.fn();
        }
      );

      const TestComponent = () => {
        const { user, profile } = useAuth();
        return (
          <div>
            <div data-testid="user-status">
              {user ? 'user exists' : 'user is null'}
            </div>
            <div data-testid="profile-status">
              {profile ? 'profile exists' : 'profile is null'}
            </div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('user is null');
        expect(screen.getByTestId('profile-status')).toHaveTextContent(
          'profile is null'
        );
      });
    });
  });

  describe('user sign in', () => {
    it('should sign in user with email and password', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
      };

      const mockProfile = {
        uid: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'customer' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      let authCallback: any;
      (FirebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation(
        (_auth: any, callback: any) => {
          authCallback = callback;
          callback(null);
          return jest.fn();
        }
      );

      (FirebaseAuth.signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser,
      });

      (Firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockProfile,
      });

      const TestComponent = () => {
        const { user, signIn } = useAuth();
        return (
          <div>
            <button
              data-testid="signin-btn"
              onClick={() => signIn('test@example.com', 'password123')}
            >
              Sign In
            </button>
            <div data-testid="user-email">{user?.email || 'no user'}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const signInBtn = screen.getByTestId('signin-btn');
      fireEvent.click(signInBtn);

      await waitFor(() => {
        expect(FirebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
          auth,
          'test@example.com',
          'password123'
        );
      });

      expect(toast.success).toHaveBeenCalledWith('Signed in successfully!');
    });

    it('should fetch user profile after sign in', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
      };

      const mockProfile = {
        uid: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'customer' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (FirebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation(
        (_auth: any, callback: any) => {
          callback(null);
          return jest.fn();
        }
      );

      (FirebaseAuth.signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser,
      });

      (Firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockProfile,
      });

      const TestComponent = () => {
        const { profile, signIn } = useAuth();
        return (
          <div>
            <button onClick={() => signIn('test@example.com', 'password123')}>
              Sign In
            </button>
            <div data-testid="profile-name">{profile?.name || 'no name'}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByText('Sign In'));

      await waitFor(() => {
        expect(Firestore.getDoc).toHaveBeenCalled();
      });
    });

    it('should handle sign in error', async () => {
      (FirebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation(
        (_auth: any, callback: any) => {
          callback(null);
          return jest.fn();
        }
      );

      const signInError = new Error('Invalid credentials');
      (FirebaseAuth.signInWithEmailAndPassword as jest.Mock).mockRejectedValue(
        signInError
      );

      const TestComponent = () => {
        const { error, signIn } = useAuth();
        return (
          <div>
            <button
              onClick={() => {
                signIn('test@example.com', 'wrong').catch(() => {});
              }}
            >
              Sign In
            </button>
            <div data-testid="error">{error || 'no error'}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByText('Sign In'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe('user sign out', () => {
    it('should sign out user', async () => {
      (FirebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation(
        (_auth: any, callback: any) => {
          callback(null);
          return jest.fn();
        }
      );

      (FirebaseAuth.signOut as jest.Mock).mockResolvedValue(undefined);

      const TestComponent = () => {
        const { user, signOut } = useAuth();
        return (
          <div>
            <button onClick={signOut}>Sign Out</button>
            <div data-testid="user-status">
              {user ? 'logged in' : 'logged out'}
            </div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByText('Sign Out'));

      await waitFor(() => {
        expect(FirebaseAuth.signOut).toHaveBeenCalledWith(auth);
      });

      expect(toast.success).toHaveBeenCalledWith('Signed out successfully!');
    });

    it('should clear profile on sign out', async () => {
      (FirebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation(
        (_auth: any, callback: any) => {
          callback(null);
          return jest.fn();
        }
      );

      (FirebaseAuth.signOut as jest.Mock).mockResolvedValue(undefined);

      const TestComponent = () => {
        const { profile, signOut } = useAuth();
        return (
          <div>
            <button onClick={signOut}>Sign Out</button>
            <div data-testid="profile-status">
              {profile ? 'profile exists' : 'profile cleared'}
            </div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByText('Sign Out'));

      await waitFor(() => {
        expect(screen.getByTestId('profile-status')).toHaveTextContent(
          'profile cleared'
        );
      });
    });

    it('should handle sign out error', async () => {
      (FirebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation(
        (_auth: any, callback: any) => {
          callback(null);
          return jest.fn();
        }
      );

      const signOutError = new Error('Sign out failed');
      (FirebaseAuth.signOut as jest.Mock).mockRejectedValue(signOutError);

      const TestComponent = () => {
        const { error, signOut } = useAuth();
        return (
          <div>
            <button
              onClick={() => {
                signOut().catch(() => {});
              }}
            >
              Sign Out
            </button>
            <div data-testid="error">{error || 'no error'}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByText('Sign Out'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe('profile fetch', () => {
    it('should fetch profile when user authenticates', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
      };

      const mockProfile = {
        uid: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'pharmacy' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (FirebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation(
        (_auth: any, callback: any) => {
          callback(mockUser);
          return jest.fn();
        }
      );

      (Firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockProfile,
      });

      const TestComponent = () => {
        const { profile } = useAuth();
        return <div data-testid="profile-name">{profile?.name || 'loading'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(Firestore.getDoc).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByTestId('profile-name')).toHaveTextContent('Test User');
      });
    });

    it('should handle missing profile gracefully', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
      };

      (FirebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation(
        (_auth: any, callback: any) => {
          callback(mockUser);
          return jest.fn();
        }
      );

      (Firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      const TestComponent = () => {
        const { profile } = useAuth();
        return (
          <div data-testid="profile-status">
            {profile ? 'has profile' : 'no profile'}
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('profile-status')).toHaveTextContent(
          'no profile'
        );
      });
    });
  });

  describe('role-based access', () => {
    it('should return customer role in profile', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'customer@example.com',
      };

      const mockProfile = {
        uid: 'user123',
        email: 'customer@example.com',
        name: 'Customer User',
        role: 'customer' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (FirebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation(
        (_auth: any, callback: any) => {
          callback(mockUser);
          return jest.fn();
        }
      );

      (Firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockProfile,
      });

      const TestComponent = () => {
        const { profile } = useAuth();
        return <div data-testid="user-role">{profile?.role || 'no role'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent('customer');
      });
    });

    it('should return pharmacy role in profile', async () => {
      const mockUser = {
        uid: 'pharmacy123',
        email: 'pharmacy@example.com',
      };

      const mockProfile = {
        uid: 'pharmacy123',
        email: 'pharmacy@example.com',
        name: 'Pharmacy Store',
        role: 'pharmacy' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (FirebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation(
        (_auth: any, callback: any) => {
          callback(mockUser);
          return jest.fn();
        }
      );

      (Firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockProfile,
      });

      const TestComponent = () => {
        const { profile } = useAuth();
        return <div data-testid="user-role">{profile?.role || 'no role'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent('pharmacy');
      });
    });

    it('should return delivery_provider role in profile', async () => {
      const mockUser = {
        uid: 'provider123',
        email: 'provider@example.com',
      };

      const mockProfile = {
        uid: 'provider123',
        email: 'provider@example.com',
        name: 'Delivery Provider',
        role: 'delivery_provider' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (FirebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation(
        (_auth: any, callback: any) => {
          callback(mockUser);
          return jest.fn();
        }
      );

      (Firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockProfile,
      });

      const TestComponent = () => {
        const { profile } = useAuth();
        return <div data-testid="user-role">{profile?.role || 'no role'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent(
          'delivery_provider'
        );
      });
    });
  });

  describe('sign up', () => {
    it('should create user account', async () => {
      const mockUser = {
        uid: 'newuser123',
        email: 'newuser@example.com',
      };

      (FirebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation(
        (_auth: any, callback: any) => {
          callback(null);
          return jest.fn();
        }
      );

      (FirebaseAuth.createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser,
      });

      (Firestore.setDoc as jest.Mock).mockResolvedValue(undefined);
      (apiClient.post as jest.Mock).mockResolvedValue({});

      const TestComponent = () => {
        const { signUp } = useAuth();
        return (
          <button
            onClick={() =>
              signUp('newuser@example.com', 'password123', 'New User', 'customer')
            }
          >
            Sign Up
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByText('Sign Up'));

      await waitFor(() => {
        expect(FirebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
          auth,
          'newuser@example.com',
          'password123'
        );
      });

      expect(toast.success).toHaveBeenCalledWith('Account created successfully!');
    });

    it('should create Firestore profile on sign up', async () => {
      const mockUser = {
        uid: 'newuser123',
        email: 'newuser@example.com',
      };

      (FirebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation(
        (_auth: any, callback: any) => {
          callback(null);
          return jest.fn();
        }
      );

      (FirebaseAuth.createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser,
      });

      (Firestore.setDoc as jest.Mock).mockResolvedValue(undefined);
      (apiClient.post as jest.Mock).mockResolvedValue({});

      const TestComponent = () => {
        const { signUp } = useAuth();
        return (
          <button
            onClick={() =>
              signUp('newuser@example.com', 'password123', 'New User', 'pharmacy')
            }
          >
            Sign Up
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByText('Sign Up'));

      await waitFor(() => {
        expect(Firestore.setDoc).toHaveBeenCalled();
      });
    });

    it('should call backend setup-profile on sign up', async () => {
      const mockUser = {
        uid: 'newuser123',
        email: 'newuser@example.com',
      };

      (FirebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation(
        (_auth: any, callback: any) => {
          callback(null);
          return jest.fn();
        }
      );

      (FirebaseAuth.createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser,
      });

      (Firestore.setDoc as jest.Mock).mockResolvedValue(undefined);
      (apiClient.post as jest.Mock).mockResolvedValue({});

      const TestComponent = () => {
        const { signUp } = useAuth();
        return (
          <button
            onClick={() =>
              signUp('newuser@example.com', 'password123', 'New User', 'delivery_provider')
            }
          >
            Sign Up
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByText('Sign Up'));

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/auth/setup-profile', {
          uid: 'newuser123',
          email: 'newuser@example.com',
          name: 'New User',
          role: 'delivery_provider',
        });
      });
    });
  });

  describe('error handling', () => {
    it('should set error state on auth failure', async () => {
      (FirebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation(
        (_auth: any, callback: any) => {
          callback(null);
          return jest.fn();
        }
      );

      const authError = new Error('Auth failed');
      (FirebaseAuth.signInWithEmailAndPassword as jest.Mock).mockRejectedValue(
        authError
      );

      const TestComponent = () => {
        const { error, signIn } = useAuth();
        return (
          <div>
            <button
              onClick={() => {
                signIn('test@example.com', 'password').catch(() => {});
              }}
            >
              Sign In
            </button>
            <div data-testid="error-msg">{error || 'no error'}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByText('Sign In'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should clear error on successful operation', async () => {
      (FirebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation(
        (_auth: any, callback: any) => {
          callback(null);
          return jest.fn();
        }
      );

      (FirebaseAuth.signOut as jest.Mock).mockResolvedValue(undefined);

      const TestComponent = () => {
        const { error, signOut } = useAuth();
        return (
          <div>
            <button onClick={signOut}>Sign Out</button>
            <div data-testid="error-status">
              {error ? 'has error' : 'no error'}
            </div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByText('Sign Out'));

      await waitFor(() => {
        expect(screen.getByTestId('error-status')).toHaveTextContent('no error');
      });
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const TestComponent = () => {
        useAuth();
        return <div>Should not render</div>;
      };

      // Suppress console.error for this test
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => render(<TestComponent />)).toThrow(
        'useAuth must be used within an AuthProvider'
      );

      consoleSpy.mockRestore();
    });
  });
});
