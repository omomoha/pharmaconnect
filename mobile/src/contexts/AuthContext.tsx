import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { apiClient } from '../lib/api';

interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'customer' | 'pharmacy_admin' | 'delivery_admin' | 'platform_admin';
  phone?: string;
  photoUrl?: string;
}

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<FirebaseAuthTypes.UserCredential>;
  signOut: () => Promise<void>;
  setupProfile: (data: {
    role: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch user profile from backend
        try {
          const response = await apiClient.get('/auth/me');
          if (response.success && response.data) {
            setProfile(response.data);
          }
        } catch (error) {
          console.warn('Failed to fetch profile:', error);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await auth().signInWithEmailAndPassword(email, password);
  };

  const signUp = async (email: string, password: string) => {
    return auth().createUserWithEmailAndPassword(email, password);
  };

  const signOut = async () => {
    await auth().signOut();
    setProfile(null);
  };

  const setupProfile = async (data: {
    role: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) => {
    const response = await apiClient.post('/auth/setup-profile', data);
    if (response.success && response.data) {
      setProfile(response.data);
    } else {
      throw new Error(response.error?.message || 'Profile setup failed');
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signOut, setupProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
