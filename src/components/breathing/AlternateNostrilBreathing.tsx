'use client';

import React from 'react';
import { Play, Pause } from 'lucide-react';

interface AlternateNostrilBreathingProps {
  isPlaying: boolean;
  timeLeft: number;
  durationSec: number;
  onTogglePlay: () => void;
}

export default function AlternateNostrilBreathing({ isPlaying, timeLeft, durationSec, onTogglePlay }: AlternateNostrilBreathingProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Nadi Shodhana breathing cycle: 16 seconds total
  const getBreathingPhase = () => {
    if (!isPlaying) return 'Prepare hand position';
    
    const elapsed = durationSec - timeLeft;
    const cycleTime = elapsed % 16; // 16 second cycle
    
    if (cycleTime < 4) return 'Inhale right nostril';
    if (cycleTime < 6) return 'Hold both closed';
    if (cycleTime < 10) return 'Exhale left nostril';
    if (cycleTime < 12) return 'Hold both closed';
    if (cycleTime < 14) return 'Inhale left nostril';
    return 'Switch to right';
  };

  // Get active nostril for visual indicator
  const getActiveNostril = () => {
    if (!isPlaying) return 'both';
    
    const elapsed = durationSec - timeLeft;
    const cycleTime = elapsed % 16;
    
    if (cycleTime < 4) return 'right';
    if (cycleTime < 6) return 'none';
    if (cycleTime < 10) return 'left';
    if (cycleTime < 12) return 'none';
    if (cycleTime < 14) return 'left';
    return 'right';
  };

  const activeNostril = getActiveNostril();

  return (
    <div className="flex flex-col items-center justify-between mx-auto mb-4 min-h-[264px]">
      {/* Nostril Visualization */}
      <div className="relative w-full max-w-2xl h-32 mb-4 flex-shrink-0">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          {/* Face outline */}
          <ellipse
            cx="100"
            cy="120"
            rx="80"
            ry="75"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="4"
            opacity="0.5"
          />
          
          {/* Left nostril */}
          <ellipse
            cx="75"
            cy="100"
            rx="18"
            ry="24"
            fill={activeNostril === 'left' ? '#f59e0b' : '#f3f4f6'}
            stroke={activeNostril === 'left' ? '#d97706' : '#d1d5db'}
            strokeWidth="4"
            className={activeNostril === 'left' ? 'animate-pulse' : ''}
          />
          
          {/* Right nostril */}
          <ellipse
            cx="125"
            cy="100"
            rx="18"
            ry="24"
            fill={activeNostril === 'right' ? '#f59e0b' : '#f3f4f6'}
            stroke={activeNostril === 'right' ? '#d97706' : '#d1d5db'}
            strokeWidth="4"
            className={activeNostril === 'right' ? 'animate-pulse' : ''}
          />
          
          {/* Breathing flow indicators */}
          {(() => {
            if (!isPlaying || activeNostril === 'none') return null;
            
            const elapsed = durationSec - timeLeft;
            const cycleProgress = (elapsed % 4) / 4;
            
            return (
              <>
                {/* Animated breath flow */}
                {activeNostril === 'left' && (
                  <>
                    {[1, 2, 3].map((dot) => (
                      <circle
                        key={`left-${dot}`}
                        cx="75"
                        cy={75 - dot * 20 + 20 * Math.sin(cycleProgress * 2 * Math.PI)}
                        r="4"
                        fill="#f59e0b"
                        opacity={0.8 - dot * 0.2}
                        className="animate-bounce"
                        style={{
                          animationDelay: `${dot * 0.2}s`,
                          animationDuration: '1s'
                        }}
                      />
                    ))}
                  </>
                )}
                
                {activeNostril === 'right' && (
                  <>
                    {[1, 2, 3].map((dot) => (
                      <circle
                        key={`right-${dot}`}
                        cx="125"
                        cy={75 - dot * 20 + 20 * Math.sin(cycleProgress * 2 * Math.PI)}
                        r="4"
                        fill="#f59e0b"
                        opacity={0.8 - dot * 0.2}
                        className="animate-bounce"
                        style={{
                          animationDelay: `${dot * 0.2}s`,
                          animationDuration: '1s'
                        }}
                      />
                    ))}
                  </>
                )}
              </>
            );
          })()}
          
          {/* Hand position indicator */}
          <g opacity="0.3">
            {/* Thumb position (right nostril) */}
            <circle
              cx="125"
              cy="95"
              r="4"
              fill={activeNostril === 'left' || activeNostril === 'none' ? '#6b7280' : '#f3f4f6'}
              stroke="#9ca3af"
              strokeWidth="1"
            />
            
            {/* Ring finger position (left nostril) */}
            <circle
              cx="75"
              cy="95"
              r="4"
              fill={activeNostril === 'right' || activeNostril === 'none' ? '#6b7280' : '#f3f4f6'}
              stroke="#9ca3af"
              strokeWidth="1"
            />
          </g>
        </svg>
      </div>

      {/* Middle section with timer and instructions */}
      <div className="flex flex-col items-center space-y-3 flex-grow justify-center">
        {/* Timer display */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg shadow-amber-500/10 border border-white/20">
          <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            {formatTime(timeLeft)}
          </span>
        </div>
        
        {/* Breathing instruction */}
        <div className={`bg-gradient-to-r from-amber-100/90 to-orange-100/90 backdrop-blur-sm rounded-full px-4 py-2 border border-amber-200/50 shadow-lg transition-all duration-500 ${
          isPlaying ? 'animate-pulse shadow-amber-500/20' : 'shadow-amber-500/10'
        }`}>
          <span className="text-sm font-semibold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">
            {getBreathingPhase()}
          </span>
        </div>
      </div>
      
      {/* Bottom section */}
      <div className="flex flex-col items-center space-y-3 flex-shrink-0 mt-6">
        {/* Technique instructions */}
        <div className="text-center text-xs text-gray-600 max-w-xs">
          <p className="mb-1">Place thumb on right nostril, ring finger on left</p>
          <p>Traditional Nadi Shodhana Pranayama</p>
        </div>
        
        {/* Play/pause button */}
        <button
          onClick={onTogglePlay}
          className="w-14 h-14 bg-amber-500 hover:bg-amber-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
          aria-label={`${isPlaying ? 'Pause' : 'Start'} alternate nostril breathing`}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-white fill-current" />
          ) : (
            <Play className="w-6 h-6 text-white fill-current ml-1" />
          )}
        </button>
      </div>
    </div>
  );
} 