'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';

interface EarningRecord {
  id: string;
  date: string;
  pharmacyName: string;
  customerArea: string;
  amount: number;
  tip: number;
}

interface TimePeriodStats {
  totalEarnings: number;
  completedDeliveries: number;
  averagePerDelivery: number;
  tipsReceived: number;
}

const EARNINGS_DATA: Record<string, EarningRecord[]> = {
  today: [
    {
      id: '1',
      date: 'Today, 2:45 PM',
      pharmacyName: 'HealthFirst Pharmacy',
      customerArea: 'Ikoyi',
      amount: 3500,
      tip: 500,
    },
    {
      id: '2',
      date: 'Today, 1:20 PM',
      pharmacyName: 'MediCare Stores',
      customerArea: 'Lekki',
      amount: 2500,
      tip: 300,
    },
    {
      id: '3',
      date: 'Today, 11:30 AM',
      pharmacyName: 'PharmaPlus',
      customerArea: 'Ikeja',
      amount: 4500,
      tip: 0,
    },
  ],
  week: [
    {
      id: '1',
      date: 'Mar 26, 2:45 PM',
      pharmacyName: 'HealthFirst Pharmacy',
      customerArea: 'Ikoyi',
      amount: 3500,
      tip: 500,
    },
    {
      id: '2',
      date: 'Mar 26, 1:20 PM',
      pharmacyName: 'MediCare Stores',
      customerArea: 'Lekki',
      amount: 2500,
      tip: 300,
    },
    {
      id: '3',
      date: 'Mar 26, 11:30 AM',
      pharmacyName: 'PharmaPlus',
      customerArea: 'Ikeja',
      amount: 4500,
      tip: 0,
    },
    {
      id: '4',
      date: 'Mar 25, 3:15 PM',
      pharmacyName: 'Guardian Pharmacy',
      customerArea: 'Yaba',
      amount: 5000,
      tip: 800,
    },
    {
      id: '5',
      date: 'Mar 25, 12:00 PM',
      pharmacyName: 'Life Pharmacy',
      customerArea: 'Shomolu',
      amount: 2800,
      tip: 200,
    },
    {
      id: '6',
      date: 'Mar 24, 4:30 PM',
      pharmacyName: 'Quick Med Pharmacy',
      customerArea: 'Lekki',
      amount: 3200,
      tip: 400,
    },
  ],
  month: [
    {
      id: '1',
      date: 'Mar 26',
      pharmacyName: 'HealthFirst Pharmacy',
      customerArea: 'Ikoyi',
      amount: 3500,
      tip: 500,
    },
    {
      id: '2',
      date: 'Mar 26',
      pharmacyName: 'MediCare Stores',
      customerArea: 'Lekki',
      amount: 2500,
      tip: 300,
    },
    {
      id: '3',
      date: 'Mar 25',
      pharmacyName: 'PharmaPlus',
      customerArea: 'Ikeja',
      amount: 4500,
      tip: 0,
    },
    {
      id: '4',
      date: 'Mar 24',
      pharmacyName: 'Guardian Pharmacy',
      customerArea: 'Yaba',
      amount: 5000,
      tip: 800,
    },
    {
      id: '5',
      date: 'Mar 20',
      pharmacyName: 'Life Pharmacy',
      customerArea: 'Shomolu',
      amount: 2800,
      tip: 200,
    },
  ],
  allTime: [
    {
      id: '1',
      date: 'Mar 26',
      pharmacyName: 'HealthFirst Pharmacy',
      customerArea: 'Ikoyi',
      amount: 3500,
      tip: 500,
    },
    {
      id: '2',
      date: 'Mar 26',
      pharmacyName: 'MediCare Stores',
      customerArea: 'Lekki',
      amount: 2500,
      tip: 300,
    },
    {
      id: '3',
      date: 'Mar 25',
      pharmacyName: 'PharmaPlus',
      customerArea: 'Ikeja',
      amount: 4500,
      tip: 0,
    },
    {
      id: '4',
      date: 'Mar 24',
      pharmacyName: 'Guardian Pharmacy',
      customerArea: 'Yaba',
      amount: 5000,
      tip: 800,
    },
    {
      id: '5',
      date: 'Mar 20',
      pharmacyName: 'Life Pharmacy',
      customerArea: 'Shomolu',
      amount: 2800,
      tip: 200,
    },
    {
      id: '6',
      date: 'Mar 19',
      pharmacyName: 'Quick Med Pharmacy',
      customerArea: 'Lekki',
      amount: 3200,
      tip: 400,
    },
  ],
};

const PERIOD_STATS: Record<string, TimePeriodStats> = {
  today: {
    totalEarnings: 10500,
    completedDeliveries: 3,
    averagePerDelivery: 3500,
    tipsReceived: 800,
  },
  week: {
    totalEarnings: 21500,
    completedDeliveries: 6,
    averagePerDelivery: 3583,
    tipsReceived: 2300,
  },
  month: {
    totalEarnings: 18300,
    completedDeliveries: 5,
    averagePerDelivery: 3660,
    tipsReceived: 1600,
  },
  allTime: {
    totalEarnings: 38300,
    completedDeliveries: 11,
    averagePerDelivery: 3481,
    tipsReceived: 3700,
  },
};

const WEEKLY_EARNINGS = [
  { day: 'Mon', amount: 2800 },
  { day: 'Tue', amount: 3500 },
  { day: 'Wed', amount: 2200 },
  { day: 'Thu', amount: 4100 },
  { day: 'Fri', amount: 5300 },
  { day: 'Sat', amount: 4600 },
  { day: 'Sun', amount: 3000 },
];

export default function EarningsPage() {
  const [activeTab, setActiveTab] = useState('today');
  const [payoutModal, setPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');

  const currentStats = PERIOD_STATS[activeTab as keyof typeof PERIOD_STATS];
  const currentEarnings = EARNINGS_DATA[activeTab as keyof typeof EARNINGS_DATA];

  const maxWeeklyEarning = Math.max(...WEEKLY_EARNINGS.map((e) => e.amount));

  const tabs = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'allTime', label: 'All Time' },
  ];

  const handleRequestPayout = () => {
    if (payoutAmount && parseInt(payoutAmount) > 0) {
      alert(
        `Payout request submitted for ₦${parseInt(payoutAmount).toLocaleString()}. It will be processed in 2-3 business days.`
      );
      setPayoutModal(false);
      setPayoutAmount('');
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Earnings"
        description="Track your delivery earnings and payouts"
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Earnings"
          value={`₦${currentStats.totalEarnings.toLocaleString()}`}
          icon="💰"
          trend="up"
          change={`+${Math.floor(Math.random() * 20)}% this period`}
        />
        <StatsCard
          label="Deliveries Completed"
          value={currentStats.completedDeliveries.toString()}
          icon="📦"
        />
        <StatsCard
          label="Average per Delivery"
          value={`₦${currentStats.averagePerDelivery.toLocaleString()}`}
          icon="📊"
        />
        <StatsCard
          label="Tips Received"
          value={`₦${currentStats.tipsReceived.toLocaleString()}`}
          icon="🎁"
          trend="up"
        />
      </div>

      {/* Weekly Chart */}
      {activeTab === 'week' && (
        <Card>
          <CardHeader>
            <h3 className="font-bold text-gray-900">Weekly Earnings Chart</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between h-48 gap-2 px-2">
              {WEEKLY_EARNINGS.map((item) => (
                <div
                  key={item.day}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full bg-gradient-to-t from-primary-500 to-primary-600 rounded-t transition-all hover:from-primary-600 hover:to-primary-700"
                    style={{
                      height: `${(item.amount / maxWeeklyEarning) * 100}%`,
                    }}
                    title={`₦${item.amount.toLocaleString()}`}
                  />
                  <span className="text-xs font-semibold text-gray-700">{item.day}</span>
                  <span className="text-xs text-gray-500">₦{Math.floor(item.amount / 1000)}k</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Earnings Breakdown */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-gray-900">
            {activeTab === 'today'
              ? "Today's Deliveries"
              : activeTab === 'week'
                ? 'Weekly Deliveries'
                : activeTab === 'month'
                  ? 'Monthly Deliveries'
                  : 'All Deliveries'}
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentEarnings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No deliveries in this period</p>
            ) : (
              currentEarnings.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">{record.date}</p>
                    <p className="font-semibold text-gray-900">
                      {record.pharmacyName} → {record.customerArea}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      ₦{record.amount.toLocaleString()}
                    </p>
                    {record.tip > 0 && (
                      <p className="text-sm text-green-600">
                        + ₦{record.tip.toLocaleString()} tip
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payout Section */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-gray-900">Payout Management</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Bank Account</p>
              <p className="font-semibold text-gray-900">••••••••••• 5678</p>
              <p className="text-xs text-gray-500 mt-1">GTBank - Chioma Adeyemi</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 font-semibold mb-2">Next Payout</p>
              <p className="text-lg font-bold text-primary-600">March 28, 2026</p>
              <p className="text-xs text-gray-600 mt-1">Auto-transfer on payout day</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-yellow-800 mb-2">Available to Withdraw</p>
            <p className="text-2xl font-bold text-primary-600 mb-4">
              ₦{currentStats.totalEarnings.toLocaleString()}
            </p>
            <Button
              variant="primary"
              onClick={() => setPayoutModal(true)}
              className="w-full"
            >
              Request Payout
            </Button>
          </div>

          <div className="text-xs text-gray-600 space-y-1">
            <p>• Minimum payout: ₦5,000</p>
            <p>• Processing time: 2-3 business days</p>
            <p>• Payouts are processed every Wednesday and Saturday</p>
          </div>
        </CardContent>
      </Card>

      {/* Payout Modal */}
      <Modal
        isOpen={payoutModal}
        onClose={() => setPayoutModal(false)}
        title="Request Payout"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            How much would you like to withdraw? Available balance:{' '}
            <span className="font-bold text-primary-600">
              ₦{currentStats.totalEarnings.toLocaleString()}
            </span>
          </p>

          <Input
            label="Payout Amount (₦)"
            placeholder="5000"
            type="number"
            value={payoutAmount}
            onChange={(e) => setPayoutAmount(e.target.value)}
            min="5000"
            max={currentStats.totalEarnings}
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700 font-semibold mb-1">IMPORTANT</p>
            <p className="text-xs text-blue-700">
              Verify your bank account details before submitting. Payouts are processed every
              Wednesday and Saturday.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="primary" className="flex-1" onClick={handleRequestPayout}>
              Request Payout
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setPayoutModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
