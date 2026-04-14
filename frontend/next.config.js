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
};

module.exports = nextConfig;
