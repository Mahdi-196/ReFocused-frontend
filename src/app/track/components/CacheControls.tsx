import React from 'react';

interface CacheControlsProps {
  refreshCache: () => void;
}

export default function CacheControls({ refreshCache }: CacheControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={refreshCache}
        className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700/50"
        title="Clear Cache & Refresh"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
} 