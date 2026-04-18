import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'PharmaConnect - Online Pharmacy Marketplace',
  description:
    'Find and order medications from trusted pharmacies near you with fast delivery.',
  keywords: [
    'pharmacy',
    'medications',
    'online pharmacy',
    'drug delivery',
    'healthcare',
  ],
  authors: [{ name: 'PharmaConnect Team' }],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pharmaconnect.com',
    title: 'PharmaConnect - Online Pharmacy Marketplace',
    description: 'Find and order medications from trusted pharmacies near you',
    images: [
      {
        url: 'https://pharmaconnect.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PharmaConnect',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900">
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
