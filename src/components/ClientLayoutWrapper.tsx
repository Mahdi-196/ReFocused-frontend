'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from './Header';
import Footer from './footer';
import AnimatedLayout from './AnimatedLayout';
import StatisticsInitializer from './StatisticsInitializer';
import DevTools from './devTools';
import { TokenExpiryNotification } from './TokenExpiryNotification';
import RateLimitNotification from './RateLimitNotification';
import CacheManager from './CacheManager';
import { AuthProvider } from '@/contexts/AuthContext';
import { TimeProvider } from '@/contexts/TimeContext';
import { AudioProvider } from '@/contexts/AudioContext';
import { NetworkProvider } from './NetworkProvider';
import { initializeAuth } from '@/api/client';
import DataPreloader from './DataPreloader';
import DailyCacheStatus from './DailyCacheStatus';

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAiPage = pathname?.startsWith('/ai');
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

    // Listen for storage changes (logout in same or other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'REF_TOKEN') {
        checkAuth();
      }
    };

    // Listen for focus events (user might have logged out in another tab)
    const handleFocus = () => {
      checkAuth();
    };

    // Listen for custom logout events (for same-tab logout)
    const handleLogout = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('userLoggedOut', handleLogout);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('userLoggedOut', handleLogout);
    };
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

  // Show loading skeleton for protected routes while checking auth
  if (!isLandingPage && isLoading) {
    return (
      <div className="min-h-screen bg-[#10182B]">
        {/* Header skeleton */}
        <div className="fixed top-0 left-0 right-0 bg-[#10182B]/80 backdrop-blur-md shadow py-4 border-b border-gray-400/20 z-50">
          <div className="w-full flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-slate-700/50 rounded animate-pulse"></div>
              <div className="w-24 h-6 bg-slate-700/50 rounded animate-pulse"></div>
            </div>
            <div className="hidden md:flex space-x-6">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-16 h-6 bg-slate-700/50 rounded animate-pulse"></div>
              ))}
            </div>
            <div className="w-8 h-8 bg-slate-700/50 rounded-full animate-pulse"></div>
          </div>
        </div>
        {/* Content skeleton */}
        <div className="pt-20 container mx-auto px-4 py-8">
          <div className="space-y-4">
            <div className="w-48 h-8 bg-slate-700/50 rounded animate-pulse"></div>
            <div className="grid gap-4 md:grid-cols-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-32 bg-slate-700/50 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render protected content if not authenticated
  if (!isLandingPage && !isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <NetworkProvider>
      <AuthProvider>
        <TimeProvider>
          <AudioProvider>
            <StatisticsInitializer />
            <CacheManager />
            <DataPreloader />
            {/* AI page now provides its own background; no global backdrop here */}
            <div className={isLandingPage ? '' : 'pt-20'}>
              {!isLandingPage && <Header />}
              <AnimatedLayout>
                <main className={`${isAiPage ? 'min-h-screen w-full p-0 m-0' : ''}`}>
                  {isLandingPage
                    ? children
                    : isAiPage
                      ? children
                      : <div className="container mx-auto px-4 py-8">{children}</div>}
                </main>
              </AnimatedLayout>
              {shouldShowFooter && <Footer />}
            </div>
            
            {/* Token expiry notification - positioned at top-right globally */}
            {!isLandingPage && isAuthenticated && <TokenExpiryNotification />}
            {/* Rate limit notification - global */}
            <RateLimitNotification />
            
            {/* DevTools - positioned at bottom-right globally */}
            {process.env.NEXT_PUBLIC_APP_ENV === 'development' && <DevTools />}
            
            {/* Daily Cache Status - positioned at bottom-left for development */}
            {process.env.NEXT_PUBLIC_APP_ENV === 'development' && <DailyCacheStatus />}
          </AudioProvider>
        </TimeProvider>
      </AuthProvider>
    </NetworkProvider>
  );
} 