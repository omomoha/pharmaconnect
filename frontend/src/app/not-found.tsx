import Link from 'next/link';

export default function NotFound() {
  return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
          <div className="text-center max-w-md w-full">
            {/* 404 Number */}
            <div className="mb-8">
              <h1 className="text-8xl font-bold text-green-600 mb-4">404</h1>
              <div className="w-1 h-1 bg-green-600 rounded-full mx-auto mb-8" />
            </div>

            {/* Page Not Found Heading */}
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Page Not Found
            </h2>

            {/* Description */}
            <p className="text-gray-600 text-lg mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>

            {/* Suggestions */}
            <div className="space-y-3 mb-8">
              <p className="text-gray-500 text-sm">
                Here are some helpful links instead:
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>
                  <Link
                    href="/"
                    className="text-green-600 hover:text-green-700 font-medium underline"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/browse"
                    className="text-green-600 hover:text-green-700 font-medium underline"
                  >
                    Browse Pharmacies
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-green-600 hover:text-green-700 font-medium underline"
                  >
                    Contact Support
                  </Link>
                </li>
              </ul>
            </div>

            {/* Go Home Button */}
            <Link
              href="/"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Go Home
            </Link>

            {/* Decorative Icon */}
            <div className="mt-12 flex justify-center opacity-20">
              <svg
                className="w-32 h-32 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={0.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
  );
}
