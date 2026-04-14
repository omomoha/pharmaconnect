interface LoadingStateProps {
  message?: string;
  className?: string;
}

/**
 * Reusable loading spinner component for dashboard pages.
 * Replaces duplicated shimmer/spinner patterns across pages.
 */
export default function LoadingState({ message = 'Loading...', className = '' }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`} role="status" aria-label={message}>
      <div className="relative w-10 h-10 mb-3">
        <div className="w-10 h-10 border-4 border-primary-100 rounded-full" />
        <div className="absolute inset-0 w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

/**
 * Skeleton loading state for cards and content blocks.
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-5 animate-pulse ${className}`} aria-hidden="true">
      <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
      <div className="h-3 bg-gray-50 rounded w-full mb-2" />
      <div className="h-3 bg-gray-50 rounded w-4/5" />
    </div>
  );
}

/**
 * Skeleton row for tables.
 */
export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="animate-pulse" aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-gray-100 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}
