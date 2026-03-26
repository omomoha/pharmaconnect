import React from 'react';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
type Size = 'sm' | 'md';

interface StatusBadgeProps {
  status: string;
  variant?: Variant;
  size?: Size;
}

const statusKeywords: Record<Variant, string[]> = {
  success: ['Delivered', 'Completed', 'Approved', 'Healthy', 'Active'],
  warning: ['Pending', 'Processing', 'Reviewing', 'Low'],
  danger: ['High', 'Rejected', 'Failed', 'Cancelled'],
  info: ['In Transit', 'Picked Up', 'In Progress'],
  neutral: ['Normal'],
};

const variantClasses: Record<Variant, string> = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  neutral: 'bg-gray-100 text-gray-700',
};

function detectVariant(status: string): Variant {
  for (const [variant, keywords] of Object.entries(statusKeywords)) {
    if (keywords.some((keyword) => status.includes(keyword))) {
      return variant as Variant;
    }
  }
  return 'neutral';
}

export default function StatusBadge({
  status,
  variant,
  size = 'sm',
}: StatusBadgeProps) {
  const resolvedVariant = variant || detectVariant(status);
  const variantClass = variantClasses[resolvedVariant];

  const sizeClasses = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm';

  return (
    <span
      className={`inline-block rounded-full font-medium ${variantClass} ${sizeClasses}`}
    >
      {status}
    </span>
  );
}
