import React, { useState } from 'react';
import { CacheStats } from '../types';

interface CacheControlsProps {
  getCacheStats: () => CacheStats;
  refreshCache: () => void;
}

export default function CacheControls({ getCacheStats, refreshCache }: CacheControlsProps) {
  const [showCacheStats, setShowCacheStats] = useState(false);

  const cacheStats = getCacheStats();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowCacheStats(!showCacheStats)}
        className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700/50"
        title="Cache Status"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>
      
      <button
        onClick={refreshCache}
        className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700/50"
        title="Clear Cache & Refresh"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      {/* Cache Stats Panel */}
      {showCacheStats && (
        <div className="absolute top-16 right-0 z-10 p-4 bg-gray-800/50 rounded-lg border border-gray-600 min-w-[300px]">
          <h3 className="text-sm font-medium text-white mb-2">Cache Status</h3>
          <div className="text-xs text-gray-300 space-y-1">
            <div>Cached entries: {cacheStats.size}/{cacheStats.maxSize}</div>
            <div>Hit rate: {Math.round(cacheStats.hitRate * 100)}%</div>
            <div>Expired: {cacheStats.expired}</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {cacheStats.entries.map((entry, index) => (
                <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                  {entry.key.length > 20 ? `${entry.key.substring(0, 20)}...` : entry.key}
                </span>
              ))}
            </div>
            {cacheStats.entries.length === 0 && (
              <div className="text-gray-400 italic">No cached data</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 