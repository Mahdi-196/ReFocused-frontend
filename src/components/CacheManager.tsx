"use client";

import { useEffect } from 'react';
import { useDailyCache } from '../hooks/useDailyCache';

/**
 * CacheManager component that handles automatic cache initialization and cleanup
 * This component should be included once in your app root to ensure proper cache management
 */
const CacheManager = () => {
  const { isInitialized, cacheStats } = useDailyCache();

  useEffect(() => {
    if (isInitialized && cacheStats) {
      // Log cache stats in development
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Daily Cache Stats:', {
          totalCacheKeys: cacheStats.totalCacheKeys,
          todayCacheKeys: cacheStats.todayCacheKeys,
          oldCacheKeys: cacheStats.oldCacheKeys,
          totalSizeKB: Math.round(cacheStats.totalSize / 1024)
        });

        // Warn if there are old cache keys that should have been cleaned up
        if (cacheStats.oldCacheKeys > 0) {
          console.warn(`⚠️ Found ${cacheStats.oldCacheKeys} old cache entries. They will be cleaned up automatically.`);
        }
      }
    }
  }, [isInitialized, cacheStats]);

  // This component doesn't render anything - it just manages cache lifecycle
  return null;
};

export default CacheManager;