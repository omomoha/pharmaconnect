/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.firebaseapp.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  // Reduce build memory pressure — fixes SIGBUS on constrained environments
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  // Reduce webpack memory usage
  webpack: (config, { isServer }) => {
    // Disable source maps in production build to reduce memory
    if (!isServer) {
      config.devtool = false;
    }
    return config;
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            // Note: 'unsafe-inline' in script-src is required by Next.js for inline hydration scripts.
            // TODO: Migrate to nonce-based CSP when Next.js supports it natively (see RFC #15168).
            // 'unsafe-inline' in style-src is required by styled-jsx.
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com https://js.paystack.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; connect-src 'self' https://*.firebaseio.com https://firebasestorage.googleapis.com https://*.cloudfunctions.net https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://api.paystack.co wss://*.firebaseio.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; frame-src 'self' https://js.paystack.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; object-src 'none'",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
