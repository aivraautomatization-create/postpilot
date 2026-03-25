import type {Metadata} from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: {
    default: 'Puls — AI-Powered Social Media Management',
    template: '%s | Puls',
  },
  description: 'Generate weeks of engaging social media content in minutes. AI-powered post creation, scheduling, and multi-platform publishing for businesses.',
  metadataBase: new URL('https://puls.work'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Puls',
    title: 'Puls — AI-Powered Social Media Management',
    description: 'Generate weeks of engaging social media content in minutes. AI-powered post creation, scheduling, and multi-platform publishing for businesses.',
    images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: 'Puls - AI-Powered Social Media Management' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Puls — AI-Powered Social Media Management',
    description: 'Generate weeks of engaging social media content in minutes.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml', sizes: '32x32' },
    ],
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${outfit.variable} font-sans font-light`}>
      <body className="bg-black text-white antialiased" suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium">
          Skip to main content
        </a>
        <AuthProvider>
          <main id="main-content">
            {children}
          </main>
          <Toaster position="bottom-right" theme="dark" />
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
