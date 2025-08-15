// src/app/layout.tsx

// Import console override first to ensure it initializes before any other code
import '@/utils/consoleOverride';

import type { Metadata } from "next";
import { inter } from './fonts';
import '../globals.css';
import ClientLayoutWrapper from '@/components/ClientLayoutWrapper';
import PerformanceMonitor from '@/components/PerformanceMonitor';

export const metadata: Metadata = {
  title: 'Daily Mantra & Weekly Mindfulness Theme | ReFocused',
  description: 'ReFocused: Daily mantras, mindful breathing exercises, and dynamically generated weekly themes to boost your resilience.',
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
    description: 'ReFocused: Daily mantras, mindful breathing exercises, and dynamically generated weekly themes to boost your resilience.',
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
    description: 'ReFocused: Daily mantras, mindful breathing exercises, and dynamically generated weekly themes to boost your resilience.',
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
        {/* Console Override Script - Must be first to catch early logs */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                'use strict';
                var isDevelopment = window.location.hostname === 'localhost' || 
                                   window.location.hostname === '127.0.0.1' || 
                                   window.location.hostname.includes('localhost') ||
                                   (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_APP_ENV === 'development');
                
                if (!isDevelopment) {
                  console.log = function() {};
                  console.info = function() {};
                  console.debug = function() {};
                  console.trace = function() {};
                  console.group = function() {};
                  console.groupEnd = function() {};
                  console.table = function() {};
                }
                
                window.__consoleOverrideStatus = {
                  isDevelopment: isDevelopment,
                  isInitialized: true,
                  logsHidden: !isDevelopment
                };
                
                if (isDevelopment) {
                  // Suppress initialization message in development
                  // console.log('🔧 Console override initialized in development mode');
                } else {
                  console.log('🚫 Console override initialized - logs hidden in production');
                }
              })();
            `
          }}
        />
        
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ReFocused" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <link rel="icon" href="/favicon.ico" />
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
      <body className="min-h-screen" suppressHydrationWarning={true}>
        <PerformanceMonitor />
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  );
}
