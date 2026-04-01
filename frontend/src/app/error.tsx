'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Global Error Boundary:', error);
  }, [error]);

  return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Error Heading */}
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
              Something went wrong
            </h1>

            {/* Error Message */}
            <div className="mb-6">
              <p className="text-center text-gray-600 text-sm">
                {error.message || 'An unexpected error occurred. Please try again.'}
              </p>
              {error.digest && (
                <p className="text-center text-gray-500 text-xs mt-2 font-mono bg-gray-50 p-2 rounded">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            {/* Try Again Button */}
            <button
              onClick={() => reset()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>

            {/* Return Home Link */}
            <div className="text-center mt-4">
              <a
                href="/"
                className="text-red-600 hover:text-red-700 text-sm font-medium underline"
              >
                Return to Home
              </a>
            </div>
          </div>
        </div>
  );
}
