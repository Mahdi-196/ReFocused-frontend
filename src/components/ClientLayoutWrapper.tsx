'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from './Header';
import Footer from './footer';
import AnimatedLayout from './AnimatedLayout';
import StatisticsInitializer from './StatisticsInitializer';
import DevTools from './devTools';
import { AuthProvider } from '@/contexts/AuthContext';
import { initializeAuth } from '@/api/client';

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isLandingPage = pathname === '/';
  const isProfilePage = pathname === '/profile';
  const shouldShowFooter = isLandingPage || isProfilePage;
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('REF_TOKEN');
      setIsAuthenticated(!!token);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Handle authentication-based redirects
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isLandingPage) {
        // Redirect unauthenticated users to landing page
        router.push('/');
      } else if (isAuthenticated && isLandingPage) {
        // Redirect authenticated users to home page
        router.push('/home');
      }
    }
  }, [isAuthenticated, isLoading, isLandingPage, router]);

  useEffect(() => {
    initializeAuth();
  }, []);

  // Show loading spinner for protected routes while checking auth
  if (!isLandingPage && isLoading) {
    return (
      <div className="min-h-screen bg-[#10182B] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#42b9e5] mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render protected content if not authenticated
  if (!isLandingPage && !isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <AuthProvider>
      <StatisticsInitializer />
      <div className={isLandingPage ? '' : 'pt-20'}>
        {!isLandingPage && <Header />}
        <AnimatedLayout>
          <main className={`${!isLandingPage ? 'container mx-auto px-4 py-8' : ''}`}>
            {children}
          </main>
        </AnimatedLayout>
        {shouldShowFooter && <Footer />}
      </div>
      
      {/* DevTools - positioned at bottom-right globally */}
      {process.env.NODE_ENV === 'development' && <DevTools isVisible={true} />}
    </AuthProvider>
  );
} 