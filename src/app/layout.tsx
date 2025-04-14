// src/app/layout.tsx
import type { Metadata } from "next";
import Header from '@/components/Header';
import { inter } from './fonts';
import '../globals.css';

export const metadata: Metadata = {
  title: 'ReFocused',
  description: 'Focus and productivity app',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-[#ECEFF1]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
