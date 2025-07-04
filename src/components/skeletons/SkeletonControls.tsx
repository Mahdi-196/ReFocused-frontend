import React from 'react';

interface SkeletonControlsProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const SkeletonControls: React.FC<SkeletonControlsProps> = ({ enabled, onToggle }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-lg p-3 shadow-lg">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-300">Skeleton Demo:</span>
        <button
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-blue-600' : 'bg-gray-600'
          }`}
        >
          <span className="sr-only">Toggle skeleton demo</span>
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}; 