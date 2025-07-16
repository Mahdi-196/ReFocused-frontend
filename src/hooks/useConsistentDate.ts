import { useState, useEffect } from 'react';
import { timeService } from '@/services/timeService';

/**
 * Custom hook for consistent date access across components
 * Forces component re-renders when time service state changes
 */
export const useConsistentDate = () => {
  const [currentDate, setCurrentDate] = useState<string>('Loading...');
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    const updateDate = () => {
      const state = timeService.getState();
      
      
      if (state.isReady && state.currentTime && state.currentTime.user_current_date) {
        setCurrentDate(state.currentTime.user_current_date);
        setIsReady(true);
      } else {
        setCurrentDate('Loading...');
        setIsReady(false);
      }
    };

    // Initial update
    updateDate();
    
    // Listen for time service updates
    timeService.addEventListener(updateDate);
    
    return () => timeService.removeEventListener(updateDate);
  }, []);

  return {
    currentDate,
    isReady,
    isMockDate: timeService.isMockDate(),
    timeService
  };
};