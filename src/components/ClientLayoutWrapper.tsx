'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import audioService from '@/services/audioService';
import { Play } from 'lucide-react';
import Header from './Header';
import Footer from './footer';
import AnimatedLayout from './AnimatedLayout';
import StatisticsInitializer from './StatisticsInitializer';
// import RateLimitNotification from './RateLimitNotification';
import CacheManager from './CacheManager';
import { AuthProvider } from '@/contexts/AuthContext';
import { TimeProvider } from '@/contexts/TimeContext';
import { AudioProvider } from '@/contexts/AudioContext';
import { NetworkProvider } from './NetworkProvider';
import { initializeAuth } from '@/api/client';
import DataPreloader from './DataPreloader';
import DailyCacheStatus from './DailyCacheStatus';
import TutorialManager from './TutorialManager';
import { ToastProvider } from '@/contexts/ToastContext';

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
  const publicRoutes = ['/', '/privacy', '/terms', '/cookies', '/data-protection', '/legal', '/console-test'];
  const isPublicRoute = publicRoutes.includes(pathname || '/');
  
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

  // Live tab-title updater for Pomodoro timer
  const titleIntervalRef = useRef<number | null>(null);
  const baseTitleRef = useRef<string>('');
  const wasRunningRef = useRef<boolean>(false);
  const ambientAutoplayPendingRef = useRef<string | null>(null);
  const [ambientResumePending, setAmbientResumePending] = useState<string | null>(null);

  useEffect(() => {
    // Always use a fixed base title per request
    baseTitleRef.current = 'ReFocused';

    const formatTime = (secondsTotal: number) => {
      const seconds = Math.max(0, Math.floor(secondsTotal));
      const minutesPart = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secondsPart = (seconds % 60).toString().padStart(2, '0');
      return `${minutesPart}:${secondsPart}`;
    };

    const updateTitle = () => {
      try {
        const isRunning = localStorage.getItem('pomodoroIsRunning') === 'true';
        const targetStr = localStorage.getItem('pomodoroTargetTime');

        let formatted: string | null = null;
        if (isRunning && targetStr) {
          const targetTime = parseInt(targetStr, 10);
          const remainingMs = Math.max(targetTime - Date.now(), 0);
          const remainingSec = Math.floor(remainingMs / 1000);
          formatted = formatTime(remainingSec);
        }

        if (isRunning && formatted) {
          wasRunningRef.current = true;
          const newTitle = `ReFocused || ${formatted}`;
          if (document.title !== newTitle) {
            document.title = newTitle;
          }
        } else {
          // Not running -> restore and keep base up-to-date
          if (wasRunningRef.current) {
            document.title = 'ReFocused';
            wasRunningRef.current = false;
          } else {
            // Keep enforcing the base when idle
            if (document.title !== 'ReFocused') {
              document.title = 'ReFocused';
            }
          }
        }
      } catch {
        // No-op
      }
    };

    // Kick-off and poll for accuracy even when tab is hidden (targetTime-based)
    updateTitle();
    titleIntervalRef.current = window.setInterval(updateTitle, 500);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') updateTitle();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Observe <title> mutations to immediately re-assert our computed title, avoiding flicker on page changes
    const titleNode = document.querySelector('head > title') || document.createElement('title');
    if (!titleNode.parentNode) document.head.appendChild(titleNode);
    const observer = new MutationObserver(() => {
      updateTitle();
    });
    observer.observe(titleNode, { childList: true, characterData: true, subtree: true });

    return () => {
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
        titleIntervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
      observer.disconnect();
      document.title = 'ReFocused';
      wasRunningRef.current = false;
    };
  }, []);

  // Keep base title refreshed on navigation when not running
  useEffect(() => {
    // Immediately apply correct title on route change to avoid flicker
    try {
      const isRunning = localStorage.getItem('pomodoroIsRunning') === 'true';
      const targetStr = localStorage.getItem('pomodoroTargetTime');
      if (isRunning && targetStr) {
        const targetTime = parseInt(targetStr, 10);
        const remainingMs = Math.max(targetTime - Date.now(), 0);
        const remainingSec = Math.floor(remainingMs / 1000);
        const minutesPart = Math.floor(remainingSec / 60).toString().padStart(2, '0');
        const secondsPart = (remainingSec % 60).toString().padStart(2, '0');
        const immediateTitle = `ReFocused || ${minutesPart}:${secondsPart}`;
        if (document.title !== immediateTitle) {
          document.title = immediateTitle;
        }
        wasRunningRef.current = true;
        return;
      }

      // Not running -> ensure base title without causing extra refresh
      if (!wasRunningRef.current && document.title !== 'ReFocused') {
        document.title = 'ReFocused';
        baseTitleRef.current = 'ReFocused';
      }
    } catch {
      // no-op
    }
  }, [pathname]);

  // Global ambient audio resume on full refresh (works on any page)
  useEffect(() => {
    try {
      const storedIsPlaying = localStorage.getItem('ambientSoundsIsPlaying') === 'true';
      const storedTargetTime = localStorage.getItem('ambientSoundsTargetTime');
      const lastSoundId = localStorage.getItem('lastUsedAmbientSound');
      if (storedIsPlaying && storedTargetTime && lastSoundId) {
        const targetTime = parseInt(storedTargetTime, 10);
        if (Number.isFinite(targetTime) && targetTime > Date.now()) {
          audioService.playAmbientSound(lastSoundId).then((success) => {
            if (!success) {
              // Autoplay likely blocked; mark pending and reflect paused state in storage
              ambientAutoplayPendingRef.current = lastSoundId;
              setAmbientResumePending(lastSoundId);
              localStorage.setItem('ambientSoundsIsPlaying', 'false');
            }
          });
        } else {
          // Session expired while away
          localStorage.setItem('ambientSoundsIsPlaying', 'false');
          localStorage.removeItem('ambientSoundsTargetTime');
        }
      }
    } catch {
      // no-op
    }
  }, []);

  // If autoplay was blocked on load, resume on first user interaction globally
  useEffect(() => {
    if (!ambientResumePending) return;
    const handler = () => {
      const lastId = ambientResumePending;
      audioService.playAmbientSound(lastId).then((success) => {
        if (success) {
          ambientAutoplayPendingRef.current = null;
          setAmbientResumePending(null);
          localStorage.setItem('ambientSoundsIsPlaying', 'true');
        }
      });
    };
    window.addEventListener('pointerdown', handler, { once: true } as any);
    window.addEventListener('keydown', handler, { once: true } as any);
    return () => {
      window.removeEventListener('pointerdown', handler as any);
      window.removeEventListener('keydown', handler as any);
    };
  }, [ambientResumePending]);

  const handleAmbientResumeClick = () => {
    if (!ambientResumePending) return;
    audioService.playAmbientSound(ambientResumePending).then((success) => {
      if (success) {
        ambientAutoplayPendingRef.current = null;
        setAmbientResumePending(null);
        localStorage.setItem('ambientSoundsIsPlaying', 'true');
      }
    });
  };

  // Handle authentication-based redirects
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isPublicRoute) {
        // Redirect unauthenticated users to landing page
        router.push('/');
      } else if (isAuthenticated && isLandingPage) {
        // Redirect authenticated users to home page
        router.push('/home');
      }
    }
  }, [isAuthenticated, isLoading, isLandingPage, isPublicRoute, router]);

  useEffect(() => {
    initializeAuth();
  }, []);

  // Global day-change cleanup for AI conversation/count storage (works even if AI page isn't open)
  useEffect(() => {
    const getScope = () => {
      try {
        const raw = localStorage.getItem('REF_USER');
        if (!raw) return 'guest';
        const user = JSON.parse(raw);
        return String(user?.id || user?.email || 'guest');
      } catch {
        return 'guest';
      }
    };

    const cleanupAIDailyStorage = (mode: 'all' | 'staleOnly' = 'staleOnly') => {
      const todayLabel = new Date().toDateString();
      const scope = getScope();
      // Collect keys first to avoid skipping during iteration
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(`ai-conversation:${scope}:`) || key.startsWith(`ai-conversation-history:${scope}`))) {
          if (mode === 'all') {
            keysToRemove.push(key);
          } else {
            const parts = key.split(':');
            const datePart = parts[parts.length - 1];
            if (datePart !== todayLabel) {
              keysToRemove.push(key);
            }
          }
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      // Reset daily count
      const countKey = `ai-daily-count:${scope}`;
      try {
        if (mode === 'all') {
          localStorage.setItem(countKey, JSON.stringify({ date: todayLabel, count: 0 }));
        } else {
          const raw = localStorage.getItem(countKey);
          const obj = raw ? JSON.parse(raw) as { date?: string; count?: number } : null;
          if (!obj || obj.date !== todayLabel) {
            localStorage.setItem(countKey, JSON.stringify({ date: todayLabel, count: 0 }));
          }
        }
      } catch {
        localStorage.setItem(countKey, JSON.stringify({ date: todayLabel, count: 0 }));
      }
    };

    // Initial cleanup on mount (stale entries)
    cleanupAIDailyStorage('staleOnly');
    // React to day/user changes
    const onDayChanged = () => cleanupAIDailyStorage('all');
    const onUserChanged = () => cleanupAIDailyStorage('staleOnly');
    const onUserLoggedOut = () => cleanupAIDailyStorage('all');
    window.addEventListener('dayChanged', onDayChanged as EventListener);
    window.addEventListener('userChanged', onUserChanged as EventListener);
    window.addEventListener('userLoggedOut', onUserLoggedOut as EventListener);
    return () => {
      window.removeEventListener('dayChanged', onDayChanged as EventListener);
      window.removeEventListener('userChanged', onUserChanged as EventListener);
      window.removeEventListener('userLoggedOut', onUserLoggedOut as EventListener);
    };
  }, []);

  // Show loading skeleton for protected routes while checking auth
  if (!isPublicRoute && isLoading) {
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
  if (!isPublicRoute && !isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <NetworkProvider>
      <AuthProvider>
        <TimeProvider>
          <AudioProvider>
            <ToastProvider>
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
            
            {/* Token expiry notification intentionally disabled for fully silent refresh */}
            {/* Rate limit notification disabled per request */}
            
            
            {/* Daily Cache Status - positioned at bottom-left for development */}
            {process.env.NEXT_PUBLIC_APP_ENV === 'development' && <DailyCacheStatus />}

            {/* Ambient autoplay resume prompt (global, minimal UI) */}
            {ambientResumePending && (
              <div className="fixed bottom-6 right-6 z-[60]">
                <button
                  onClick={handleAmbientResumeClick}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white shadow-lg hover:bg-blue-500 transition-colors"
                  title="Resume ambient sounds"
                >
                  <Play className="w-4 h-4" /> Resume Ambient Sounds
                </button>
              </div>
            )}

            {/* First-time tutorial overlay manager */}
            {isAuthenticated && <TutorialManager />}
            </ToastProvider>
          </AudioProvider>
        </TimeProvider>
      </AuthProvider>
    </NetworkProvider>
  );
} 