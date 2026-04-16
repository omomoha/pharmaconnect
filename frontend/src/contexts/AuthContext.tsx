'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  ConfirmationResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { apiClient } from '@/lib/api';
import { setUser as setErrorUser } from '@/lib/error-tracking';
import toast from 'react-hot-toast';

export interface UserProfile {
  uid: string;
  email?: string;
  phone?: string;
  name: string;
  role: 'customer' | 'pharmacy' | 'delivery_provider' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signUp: (
    email: string,
    password: string,
    name: string,
    phone: string,
    role: 'customer' | 'pharmacy' | 'delivery_provider',
    registerOnMalPay?: boolean
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithPhone: (phoneNumber: string, recaptchaContainerId: string) => Promise<any>;
  verifyOtp: (otp: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  let confirmationResult: ConfirmationResult | null = null;

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);

        if (firebaseUser) {
          // Fetch user profile from Firestore
          const profileDoc = await getDoc(doc(db, 'profiles', firebaseUser.uid));

          if (profileDoc.exists()) {
            const profileData = profileDoc.data() as UserProfile;
            setProfile(profileData);
          } else {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    role: 'customer' | 'pharmacy' | 'delivery_provider',
    registerOnMalPay?: boolean
  ) => {
    try {
      setError(null);
      setLoading(true);

      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create Firestore profile
      const profileData: UserProfile = {
        uid: firebaseUser.uid,
        email,
        name,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'profiles', firebaseUser.uid), profileData);

      // Split full name into firstName and lastName
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Call backend to setup profile
      try {
        await apiClient.post('/auth/setup-profile', {
          firstName,
          lastName,
          phoneNumber: phone,
          role,
        });
      } catch (backendError) {
        console.error('Backend profile setup failed:', backendError);
        toast.error('Profile setup failed on backend. Please contact support.');
      }

      // Register on MalPay if opted in (fire-and-forget)
      if (registerOnMalPay) {
        try {
          const malpayResult = await apiClient.post('/auth/register-malpay');
          if (malpayResult?.data?.isExisting) {
            toast.success('You already have a MalPay account!');
          } else if (malpayResult?.data?.malpayRegistered !== false) {
            toast.success('MalPay account created! Check your email to set your password.');
          }
        } catch (malpayError) {
          console.error('MalPay registration failed:', malpayError);
          // Silent failure — don't block PharmaConnect registration
        }
      }

      setProfile(profileData);
      toast.success('Account created successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Fetch user profile
      const profileDoc = await getDoc(doc(db, 'profiles', firebaseUser.uid));

      if (profileDoc.exists()) {
        const profileData = profileDoc.data() as UserProfile;
        setProfile(profileData);
      }

      // Set user context for error tracking
      setErrorUser(firebaseUser.uid, email);

      toast.success('Signed in successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);

      // Clear user context from error tracking
      setErrorUser(null);

      toast.success('Signed out successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  const signInWithPhone = async (phoneNumber: string, recaptchaContainerId: string) => {
    try {
      setError(null);

      // Initialize reCAPTCHA verifier if needed
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          },
        });
      }

      const appVerifier = window.recaptchaVerifier;

      // Sign in with phone number
      confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);

      return confirmationResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  const verifyOtp = async (otp: string) => {
    try {
      setError(null);
      setLoading(true);

      if (!confirmationResult) {
        throw new Error('OTP request not found. Please request OTP again.');
      }

      const userCredential = await confirmationResult.confirm(otp);
      const firebaseUser = userCredential.user;

      // Fetch or create user profile
      const profileDoc = await getDoc(doc(db, 'profiles', firebaseUser.uid));

      if (profileDoc.exists()) {
        const profileData = profileDoc.data() as UserProfile;
        setProfile(profileData);
      } else {
        // If profile doesn't exist, create a basic one
        const profileData: UserProfile = {
          uid: firebaseUser.uid,
          phone: firebaseUser.phoneNumber || undefined,
          name: firebaseUser.displayName || 'User',
          role: 'customer',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await setDoc(doc(db, 'profiles', firebaseUser.uid), profileData);
        setProfile(profileData);
      }

      toast.success('Signed in successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify OTP';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    signInWithPhone,
    verifyOtp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Extend window type for reCAPTCHA
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}
