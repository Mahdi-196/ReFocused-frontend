'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './footer';
import AnimatedLayout from './AnimatedLayout';

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/landing';

  return (
    <div className={isLandingPage ? '' : 'pt-20'}>
      {!isLandingPage && <Header />}
      <AnimatedLayout>
        <main className={`${!isLandingPage ? 'container mx-auto px-4 py-8' : ''}`}>
          {children}
        </main>
      </AnimatedLayout>
      {!isLandingPage && <Footer />}
    </div>
  );
} 