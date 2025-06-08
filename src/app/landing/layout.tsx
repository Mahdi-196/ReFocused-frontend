import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReFocused - Transform Your Productivity",
  description: "Experience the future of personal development with ReFocused's revolutionary platform designed to help you build better habits, maintain focus, and unlock your full potential.",
  keywords: [
    'productivity',
    'mindfulness',
    'focus',
    'habit building',
    'personal development',
    'goal tracking',
    'meditation',
    'breathing exercises',
    'pomodoro',
    'journaling'
  ],
  authors: [{ name: 'ReFocused Team' }],
  creator: 'ReFocused',
  publisher: 'ReFocused',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "ReFocused - Transform Your Productivity",
    description: "Experience the future of personal development with ReFocused's revolutionary platform designed to help you build better habits, maintain focus, and unlock your full potential.",
    url: 'https://refocused.app',
    siteName: 'ReFocused',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "ReFocused - Transform Your Productivity",
    description: "Experience the future of personal development with ReFocused's revolutionary platform designed to help you build better habits, maintain focus, and unlock your full potential.",
    creator: '@refocused_app',
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
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={inter.className}>
      {children}
    </div>
  );
} 