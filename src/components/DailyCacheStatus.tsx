'use client';

import { useState } from 'react';
import { useDataPreloader } from '@/hooks/useDataPreloader';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, Circle, RefreshCw, Database } from 'lucide-react';

/**
 * Development component to show daily cache status
 * Displays which AI endpoints are cached and ready
 */
export default function DailyCacheStatus() {
  const { isAuthenticated } = useAuth();
  const { isPreloadingComplete, cacheStats } = useDataPreloader();
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show in development mode
  if (process.env.NEXT_PUBLIC_APP_ENV !== 'development' || !isAuthenticated) {
    return null;
  }

  const cacheEntries = [
    { key: 'quote', label: 'Quote of the Day', cached: cacheStats.quote },
    { key: 'word', label: 'Word of the Day', cached: cacheStats.word },
    { key: 'mindFuel', label: 'Mind Fuel', cached: cacheStats.mindFuel },
    { key: 'aiAssistance', label: 'AI Assistance', cached: cacheStats.aiAssistance },
    { key: 'writingPrompts', label: 'Writing Prompts', cached: cacheStats.writingPrompts },
    { key: 'weeklyTheme', label: 'Weekly Theme', cached: cacheStats.weeklyTheme },
  ];

  const cachedCount = cacheEntries.filter(entry => entry.cached).length;
  const totalCount = cacheEntries.length;
  const allCached = cachedCount === totalCount;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-600/50 rounded-lg shadow-lg overflow-hidden">
        {/* Compact Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-gray-700/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">Cache Status</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className={`w-2 h-2 rounded-full ${allCached ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            <span className="text-xs text-gray-300">{cachedCount}/{totalCount}</span>
            <RefreshCw className={`w-3 h-3 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-600/30 px-4 py-3 space-y-2">
            {cacheEntries.map((entry) => (
              <div key={entry.key} className="flex items-center gap-3">
                {entry.cached ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-500" />
                )}
                <span className={`text-xs ${entry.cached ? 'text-green-300' : 'text-gray-400'}`}>
                  {entry.label}
                </span>
              </div>
            ))}
            
            <div className="pt-2 mt-3 border-t border-gray-600/30">
              <p className="text-xs text-gray-400">
                {allCached 
                  ? '✅ All AI data cached - pages will load instantly!' 
                  : '⏳ Loading AI data in background...'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}