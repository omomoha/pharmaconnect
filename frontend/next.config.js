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
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' *.firebaseio.com firebasestorage.googleapis.com *.cloudfunctions.net identitytoolkit.googleapis.com securetoken.googleapis.com firestore.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
