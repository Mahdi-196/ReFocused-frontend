import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useQuoteOfTheDaySimple,
  useWordOfTheDaySimple,
  useMindFuelSimple,
  useAiAssistanceDaily,
  useWritingPromptsDaily,
  useWeeklyTheme
} from './useDailyContentSimple';

/**
 * Hook to preload all AI-related data when user signs in
 * Uses the existing daily content hooks to ensure proper caching
 */
export const useDataPreloader = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Initialize all daily content hooks - they handle caching automatically
  const quoteHook = useQuoteOfTheDaySimple();
  const wordHook = useWordOfTheDaySimple(); 
  const mindFuelHook = useMindFuelSimple();
  const aiAssistanceHook = useAiAssistanceDaily();
  const writingPromptsHook = useWritingPromptsDaily();
  const weeklyThemeHook = useWeeklyTheme();

  // Force preload if data isn't cached and user is authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log('🚀 [PRELOADER] Initializing AI data preload...');
      
      // The hooks automatically handle:
      // - Checking cache first
      // - Fetching from API if cache miss
      // - Storing in daily cache
      // - Auto-refresh at midnight
      
      let cachedCount = 0;
      const totalCount = 6;
      
      if (quoteHook.isCached) cachedCount++;
      if (wordHook.isCached) cachedCount++;
      if (mindFuelHook.isCached) cachedCount++;
      if (aiAssistanceHook.isCached) cachedCount++;
      if (writingPromptsHook.isCached) cachedCount++;
      if (weeklyThemeHook.isCached) cachedCount++;
      
      console.log(`📊 [PRELOADER] Cache status: ${cachedCount}/${totalCount} items cached`);
      
      if (cachedCount === totalCount) {
        console.log('✅ [PRELOADER] All AI data already cached - ready for smooth navigation!');
      } else {
        console.log('📡 [PRELOADER] Some data loading from API - will be cached for future use');
      }
    }
  }, [
    isAuthenticated, 
    isLoading,
    quoteHook.isCached,
    wordHook.isCached,
    mindFuelHook.isCached,
    aiAssistanceHook.isCached,
    writingPromptsHook.isCached,
    weeklyThemeHook.isCached
  ]);

  return {
    isPreloadingComplete: isAuthenticated && !isLoading,
    cacheStats: {
      quote: quoteHook.isCached,
      word: wordHook.isCached,
      mindFuel: mindFuelHook.isCached,
      aiAssistance: aiAssistanceHook.isCached,
      writingPrompts: writingPromptsHook.isCached,
      weeklyTheme: weeklyThemeHook.isCached,
    }
  };
};