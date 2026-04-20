'use client';

import { useState } from 'react';
import Link from 'next/link';

interface VerificationBannerProps {
  role: 'pharmacy' | 'delivery_provider';
  approvalStatus?: string | null;
}

export default function VerificationBanner({
  role,
  approvalStatus,
}: VerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Show nothing if approved or already dismissed
  if (approvalStatus === 'approved' || dismissed) {
    return null;
  }

  // Determine verification page URL
  const verificationUrl =
    role === 'pharmacy'
      ? '/dashboard/pharmacy/verification'
      : '/dashboard/delivery/verification';

  // Banner configurations based on approval status
  const getBannerConfig = () => {
    switch (approvalStatus) {
      case null:
      case undefined:
        return {
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          iconColor: 'text-amber-600',
          textColor: 'text-amber-900',
          title: 'Complete your verification',
          message: 'Complete your verification to start accepting orders',
          showCTA: true,
          ctaText: 'Verify Account',
        };

      case 'pending':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          textColor: 'text-yellow-900',
          title: 'Account under review',
          message:
            'Your account is under review. Most features are locked until verification is complete.',
          showCTA: false,
          ctaText: '',
        };

      case 'rejected':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          textColor: 'text-red-900',
          title: 'Verification rejected',
          message: 'Your verification was rejected. Please resubmit your documents.',
          showCTA: true,
          ctaText: 'Resubmit Documents',
        };

      default:
        return null;
    }
  };

  const config = getBannerConfig();
  if (!config) return null;

  // SVG Icon components
  const ShieldIcon = () => (
    <svg
      className="w-6 h-6"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
    </svg>
  );

  const ClockIcon = () => (
    <svg
      className="w-6 h-6"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
    </svg>
  );

  const AlertTriangleIcon = () => (
    <svg
      className="w-6 h-6"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
    </svg>
  );

  const XIcon = () => (
    <svg
      className="w-5 h-5"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
    </svg>
  );

  const ArrowRightIcon = () => (
    <svg
      className="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 13h14v-2H5v2z" />
      <path d="M12 5l-1.41 1.41L15.17 11H5v2h10.17l-4.58 4.59L12 19l7-7-7-7z" />
    </svg>
  );

  // Select icon based on status
  let IconComponent;
  switch (approvalStatus) {
    case null:
    case undefined:
      IconComponent = ShieldIcon;
      break;
    case 'pending':
      IconComponent = ClockIcon;
      break;
    case 'rejected':
      IconComponent = AlertTriangleIcon;
      break;
    default:
      IconComponent = ShieldIcon;
  }

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 flex items-center gap-4 mb-6`}
      role="alert"
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${config.iconColor}`}>
        <IconComponent />
      </div>

      {/* Content */}
      <div className="flex-grow">
        <h3 className={`font-semibold text-sm ${config.textColor} mb-1`}>
          {config.title}
        </h3>
        <p className={`text-sm ${config.textColor} opacity-90`}>
          {config.message}
        </p>
      </div>

      {/* Action Button (if applicable) */}
      {config.showCTA && (
        <Link
          href={verificationUrl}
          className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
            approvalStatus === null || approvalStatus === undefined
              ? 'bg-amber-600 text-white hover:bg-amber-700'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {config.ctaText}
          <ArrowRightIcon />
        </Link>
      )}

      {/* Dismiss Button */}
      <button
        onClick={() => setDismissed(true)}
        className={`flex-shrink-0 p-1 rounded-md transition-colors ${config.iconColor} hover:bg-black hover:bg-opacity-10`}
        aria-label="Dismiss banner"
        type="button"
      >
        <XIcon />
      </button>
    </div>
  );
}
