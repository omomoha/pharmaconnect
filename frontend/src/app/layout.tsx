import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import './globals.css';

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
