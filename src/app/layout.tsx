// src/app/layout.tsx
import type { Metadata } from "next";
import Header from '@/components/Header';
import Footer from '@/components/footer';
import AnimatedLayout from '@/components/AnimatedLayout';
import { inter } from './fonts';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Daily Mantra & Weekly Mindfulness Theme | ReFocused',
  description: 'ReFocused: Daily mantras, mindful breathing exercises and weekly themes like Stoicism to boost your resilience.',
  keywords: [
    'productivity',
    'mindfulness',
    'meditation',
    'daily quotes',
    'goal tracking',
    'focus',
    'breathing exercises',
    'wellbeing',
    'mental health',
    'stoicism'
  ],
  authors: [{ name: 'ReFocused Team' }],
  creator: 'ReFocused',
  publisher: 'ReFocused',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://refocused.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Daily Mantra & Weekly Mindfulness Theme | ReFocused',
    description: 'ReFocused: Daily mantras, mindful breathing exercises and weekly themes like Stoicism to boost your resilience.',
    url: 'https://refocused.app',
    siteName: 'ReFocused',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ReFocused - Daily Productivity and Mindfulness Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily Mantra & Weekly Mindfulness Theme | ReFocused',
    description: 'ReFocused: Daily mantras, mindful breathing exercises and weekly themes like Stoicism to boost your resilience.',
    creator: '@refocused_app',
    images: ['/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ReFocused" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "ReFocused",
              "description": "Daily mantra input, breathing exercises, and weekly themes to build resilience and productivity.",
              "url": "https://refocused.app",
              "applicationCategory": "HealthApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "127"
              },
              "features": [
                "Daily motivational quotes",
                "Goal tracking",
                "Mindfulness exercises",
                "Breathing techniques",
                "Weekly productivity themes"
              ]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "ReFocused",
              "url": "https://refocused.app",
              "logo": "https://refocused.app/logo.png",
              "sameAs": [
                "https://twitter.com/refocused_app"
              ]
            })
          }}
        />
      </head>
      <body className="min-h-screen pt-20" suppressHydrationWarning={true}>
        <Header />
        <AnimatedLayout>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </AnimatedLayout>
        <Footer />
      </body>
    </html>
  );
}
