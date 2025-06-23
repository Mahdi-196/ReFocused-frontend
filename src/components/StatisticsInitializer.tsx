"use client";

import { useEffect } from 'react';
// import { checkAndResetAtMidnight } from '@/services/statisticsService';

/**
 * Component that initializes the statistics midnight reset functionality
 * Runs automatically in the background to check for date changes
 * TEMPORARILY DISABLED to prevent time service errors during initialization
 */
export default function StatisticsInitializer() {
  useEffect(() => {
    // TEMPORARILY DISABLED - uncomment when time service is more stable
    // Initial check when component mounts
    // checkAndResetAtMidnight();

    // Set up interval to check every minute (60,000ms)
    // const midnightChecker = setInterval(() => {
    //   checkAndResetAtMidnight();
    // }, 60000);

    // Also check when the window becomes visible (user returns to tab)
    // const handleVisibilityChange = () => {
    //   if (!document.hidden) {
    //     checkAndResetAtMidnight();
    //   }
    // };

    // Check when the window becomes focused
    // const handleFocus = () => {
    //   checkAndResetAtMidnight();
    // };

    // document.addEventListener('visibilitychange', handleVisibilityChange);
    // window.addEventListener('focus', handleFocus);

    return () => {
      // clearInterval(midnightChecker);
      // document.removeEventListener('visibilitychange', handleVisibilityChange);
      // window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
} 