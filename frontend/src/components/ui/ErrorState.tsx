import React from 'react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Reusable error display component for dashboard pages.
 * Replaces duplicated error message patterns across pages.
 */
export default function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`} role="alert">
      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-3">
        <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <p className="text-sm text-gray-600 text-center max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/**
 * Inline error for form fields or small sections.
 */
export function InlineError({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-100 rounded-xl p-3" role="alert">
      <p className="text-xs text-red-600">{message}</p>
    </div>
  );
}

/**
 * Empty state when no data is available.
 */
export function EmptyState({
  icon = '📭',
  title = 'No data',
  description,
  action,
}: {
  icon?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
        <span className="text-2xl" aria-hidden="true">{icon}</span>
      </div>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      {description && <p className="text-xs text-gray-400 mt-1 text-center max-w-sm">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
