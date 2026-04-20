'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to fetch the approval status of a pharmacy or delivery provider.
 * Queries Firestore pharmacies/delivery_providers collection by ownerId.
 * Returns { approvalStatus, loading, error }.
 */
export function useApprovalStatus() {
  const { user, profile } = useAuth();
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    const role = profile.role;
    if (role !== 'pharmacy' && role !== 'delivery_provider') {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        setLoading(true);
        const collectionName = role === 'pharmacy' ? 'pharmacies' : 'delivery_providers';
        const q = query(
          collection(db, collectionName),
          where('ownerId', '==', user.uid)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          setApprovalStatus(docData.approvalStatus || null);
        } else {
          // No registration found — not yet registered
          setApprovalStatus(null);
        }
      } catch (err) {
        console.error('Error fetching approval status:', err);
        setError('Failed to check verification status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [user, profile]);

  return { approvalStatus, loading, error };
}
