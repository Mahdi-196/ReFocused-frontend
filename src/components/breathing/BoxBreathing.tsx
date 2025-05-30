'use client';

import React from 'react';
import { Play, Pause } from 'lucide-react';

interface BoxBreathingProps {
  isPlaying: boolean;
  timeLeft: number;
  durationSec: number;
  onTogglePlay: () => void;
}

export default function BoxBreathing({ isPlaying, timeLeft, durationSec, onTogglePlay }: BoxBreathingProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Box breathing cycle: 16 seconds total (4s each phase)
  const getBreathingPhase = () => {
    if (!isPlaying) return 'Ready for box breathing';
    
    const elapsed = durationSec - timeLeft;
    const cycleTime = elapsed % 16; // 16 second cycle
    
    if (cycleTime < 4) return 'Inhale for 4';
    if (cycleTime < 8) return 'Hold for 4';
    if (cycleTime < 12) return 'Exhale for 4';
    return 'Hold for 4';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] mx-auto">
      <div className="flex flex-col items-center justify-center space-y-8 max-w-2xl w-full">
        {/* Box Breathing Visualization */}
        <div className="relative w-full h-48 flex items-center justify-center">
          <svg className="w-full h-full max-w-md" viewBox="0 0 200 200">
            {/* Box outline with rounded corners */}
            <path
              d="M 38 30 L 162 30 Q 170 30 170 38 L 170 162 Q 170 170 162 170 L 38 170 Q 30 170 30 162 L 30 38 Q 30 30 38 30"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="6"
            />
            
            {/* Smooth progress path starting from top left corner */}
            {(() => {
              if (!isPlaying) return null;
              
              const elapsed = durationSec - timeLeft;
              const cycleProgress = (elapsed % 16) / 16; // 0 to 1
              
              // Complete path starting from top left corner (clockwise)
              const completePath = "M 38 30 L 162 30 Q 170 30 170 38 L 170 162 Q 170 170 162 170 L 38 170 Q 30 170 30 162 L 30 38 Q 30 30 38 30";
              
              // Approximate total path length
              const straightSideLength = 124; // each straight side
              const cornerLength = Math.PI * 8 / 2; // quarter circle radius 8
              const totalLength = (4 * straightSideLength) + (4 * cornerLength);
              
              // Calculate visible length based on progress
              // Reset to 0 when cycle completes to create fresh start effect
              const visibleLength = cycleProgress < 0.99 ? cycleProgress * totalLength : 0;
              
              return (
                <path
                  d={completePath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={totalLength}
                  strokeDashoffset={totalLength - visibleLength}
                  style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
                />
              );
            })()}
          </svg>
        </div>

        {/* Timer and instructions - centered group */}
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Timer display */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg shadow-blue-500/10 border border-white/20">
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {formatTime(timeLeft)}
            </span>
          </div>
          
          {/* Breathing instruction */}
          <div className={`bg-gradient-to-r from-blue-100/90 to-indigo-100/90 backdrop-blur-sm rounded-full px-6 py-3 border border-blue-200/50 shadow-lg transition-all duration-500 ${
            isPlaying ? 'animate-pulse shadow-blue-500/20' : 'shadow-blue-500/10'
          }`}>
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              {getBreathingPhase()}
            </span>
          </div>
        </div>
        
        {/* Control section - centered */}
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Play/pause button */}
          <button
            onClick={onTogglePlay}
            className="w-16 h-16 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
            aria-label={`${isPlaying ? 'Pause' : 'Start'} box breathing`}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 text-white fill-current" />
            ) : (
              <Play className="w-7 h-7 text-white fill-current ml-1" />
            )}
          </button>
          
          {/* Technique explanation */}
          <div className="text-center text-sm text-gray-300 max-w-xs">
            <p className="mb-1">Equal timing for all four phases</p>
            <p>Promotes focus and calm alertness</p>
          </div>
        </div>
      </div>
    </div>
  );
} 