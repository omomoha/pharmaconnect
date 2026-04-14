'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';

interface Bank {
  name: string;
  code: string;
  slug: string;
}

interface PayoutAccount {
  recipientCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export default function EarningsPage() {
  useAuth();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [payoutAccount, setPayoutAccount] = useState<PayoutAccount | null>(null);

  // Form state for bank account setup
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dummy earnings data — will be replaced with real API data in Iteration 4
  const earningsData = {
    totalEarnings: 0,
    pendingPayout: 0,
    completedPayouts: 0,
    thisMonthOrders: 0,
    commissionRate: 5,
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  async function fetchBanks() {
    try {
      setLoadingBanks(true);
      const res = await apiClient.get('/payments/banks');
      if (res?.data?.banks) {
        setBanks(res.data.banks);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load banks';
      console.error('Failed to fetch banks:', message);
    } finally {
      setLoadingBanks(false);
    }
  }

  const handleResolveAccount = useCallback(async () => {
    if (accountNumber.length !== 10 || !selectedBank) return;

    try {
      setResolving(true);
      setResolvedName('');
      setError(null);

      const res = await apiClient.post('/payments/banks/resolve', {
        accountNumber,
        bankCode: selectedBank,
      });

      if (res?.data?.account?.accountName) {
        setResolvedName(res.data.account.accountName);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resolve account';
      setError(message);
    } finally {
      setResolving(false);
    }
  }, [accountNumber, selectedBank]);

  // Auto-resolve when account number is complete
  useEffect(() => {
    if (accountNumber.length === 10 && selectedBank) {
      handleResolveAccount();
    } else {
      setResolvedName('');
    }
  }, [accountNumber, selectedBank, handleResolveAccount]);

  async function handleSavePayoutAccount() {
    if (!resolvedName || !selectedBank || accountNumber.length !== 10) return;

    try {
      setSaving(true);
      setError(null);

      const bankObj = banks.find((b) => b.code === selectedBank);

      const res = await apiClient.post('/payments/transfers/recipient', {
        name: resolvedName,
        accountNumber,
        bankCode: selectedBank,
      });

      if (res?.data?.recipientCode) {
        setPayoutAccount({
          recipientCode: res.data.recipientCode,
          bankName: bankObj?.name || '',
          accountNumber,
          accountName: resolvedName,
        });
        setSuccessMessage('Payout account saved successfully!');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save payout account';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Earnings & Payouts</h1>
        <p className="text-gray-600 mt-1">
          Track your revenue and manage payout settings
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          {successMessage}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Earnings</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            &#8358;{earningsData.totalEarnings.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Pending Payout</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            &#8358;{earningsData.pendingPayout.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Completed Payouts</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            &#8358;{earningsData.completedPayouts.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Commission Rate</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {earningsData.commissionRate}%
          </p>
        </div>
      </div>

      {/* Payout Account Setup */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Payout Account</h2>
        <p className="text-sm text-gray-500 mb-6">
          Set up your bank account to receive payouts from completed orders
        </p>

        {payoutAccount ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-green-800">{payoutAccount.accountName}</p>
                <p className="text-sm text-green-600">
                  {payoutAccount.bankName} &middot; ****{payoutAccount.accountNumber.slice(-4)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setPayoutAccount(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Change account
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Bank Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                disabled={loadingBanks}
              >
                <option value="">{loadingBanks ? 'Loading banks...' : 'Select your bank'}</option>
                {banks.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setAccountNumber(val);
                }}
                placeholder="Enter 10-digit NUBAN account number"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                maxLength={10}
              />
            </div>

            {/* Resolved Name */}
            {resolving && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying account...
              </div>
            )}

            {resolvedName && !resolving && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Account Name:</span> {resolvedName}
                </p>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSavePayoutAccount}
              disabled={!resolvedName || saving}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                resolvedName && !saving
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saving ? 'Saving...' : 'Save Payout Account'}
            </button>
          </div>
        )}
      </div>

      {/* Recent Transactions (placeholder) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Recent Transactions</h2>
        <p className="text-sm text-gray-500 mb-6">
          Your recent order earnings and payouts
        </p>

        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No transactions yet</p>
          <p className="text-gray-400 text-xs mt-1">
            Earnings from completed orders will appear here
          </p>
        </div>
      </div>
    </div>
  );
}
