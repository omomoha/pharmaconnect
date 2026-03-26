import React, { ReactNode } from 'react';
import { Card, CardContent } from './Card';

type Trend = 'up' | 'down' | 'neutral';

interface StatsCardProps {
  label: string;
  value: string;
  change?: string;
  icon?: ReactNode | string;
  trend?: Trend;
}

export default function StatsCard({
  label,
  value,
  change,
  icon = '📊',
  trend = 'neutral',
}: StatsCardProps) {
  const trendColor =
    trend === 'up'
      ? 'text-green-600'
      : trend === 'down'
        ? 'text-red-600'
        : 'text-gray-600';

  const isEmoji = typeof icon === 'string';

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`flex-shrink-0 ${isEmoji ? 'text-4xl' : 'text-gray-600'}`}>
            {icon}
          </div>
        </div>

        {change && (
          <p className={`text-sm font-medium ${trendColor}`}>{change}</p>
        )}
      </CardContent>
    </Card>
  );
}
