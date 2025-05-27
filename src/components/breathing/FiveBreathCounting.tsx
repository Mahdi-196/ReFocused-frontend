'use client';

import React from 'react';
import { Play, Pause } from 'lucide-react';

interface FiveBreathCountingProps {
  isPlaying: boolean;
  timeLeft: number;
  durationSec: number;
  onTogglePlay: () => void;
}

export default function FiveBreathCounting({ isPlaying, timeLeft, durationSec, onTogglePlay }: FiveBreathCountingProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Simple counting breathing cycle: 10 seconds total (5s inhale, 5s exhale)
  const getBreathingPhase = () => {
    if (!isPlaying) return 'Count to 5 with each breath';
    
    const elapsed = durationSec - timeLeft;
    const cycleTime = elapsed % 10; // 10 second cycle
    
    if (cycleTime < 5) return 'Inhale counting to 5';
    return 'Exhale counting to 5';
  };

  // Get current count (1-5)
  const getCurrentCount = () => {
    if (!isPlaying) return 0;
    
    const elapsed = durationSec - timeLeft;
    const cycleTime = elapsed % 10;
    
    if (cycleTime < 5) {
      return Math.floor(cycleTime) + 1;
    } else {
      return Math.floor(cycleTime - 5) + 1;
    }
  };

  // Get current phase
  const getCurrentPhase = () => {
    if (!isPlaying) return 'ready';
    
    const elapsed = durationSec - timeLeft;
    const cycleTime = elapsed % 10;
    
    return cycleTime < 5 ? 'inhale' : 'exhale';
  };

  const currentCount = getCurrentCount();
  const currentPhase = getCurrentPhase();

  return (
    <div className="flex flex-col items-center justify-between mx-auto mb-4 min-h-[370px] px-4">
      {/* Five Breath Counting Visualization */}
      <div className="relative w-full max-w-lg h-32 mb-5 flex-shrink-0">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          {/* Five counting circles */}
          {[1, 2, 3, 4, 5].map((number) => {
            const angle = ((number - 1) * 2 * Math.PI) / 5 - Math.PI / 2;
            const radius = 65;
            const x = 100 + radius * Math.cos(angle);
            const y = 100 + radius * Math.sin(angle);
            const isActive = isPlaying && currentCount === number;
            const isPassed = isPlaying && currentCount > number;
            
            return (
              <g key={number}>
                {/* Number circle */}
                <circle
                  cx={x}
                  cy={y}
                  r="26"
                  fill={
                    isActive 
                      ? (currentPhase === 'inhale' ? '#3b82f6' : '#10b981')
                      : isPassed 
                        ? '#e5e7eb' 
                        : '#f3f4f6'
                  }
                  stroke={
                    isActive 
                      ? (currentPhase === 'inhale' ? '#1d4ed8' : '#059669')
                      : '#d1d5db'
                  }
                  strokeWidth="3"
                  className={isActive ? 'animate-pulse' : ''}
                />
                
                {/* Number text */}
                <text
                  x={x}
                  y={y + 6}
                  textAnchor="middle"
                  className={`text-lg font-bold ${
                    isActive 
                      ? 'fill-white' 
                      : isPassed 
                        ? 'fill-gray-400' 
                        : 'fill-gray-600'
                  }`}
                >
                  {number}
                </text>
              </g>
            );
          })}
          
          {/* Central indicator */}
          <circle
            cx="100"
            cy="100"
            r={17 + (isPlaying ? 6 * Math.sin((Date.now() / 500) % (2 * Math.PI)) : 0)}
            fill="none"
            stroke={currentPhase === 'inhale' ? '#3b82f6' : currentPhase === 'exhale' ? '#10b981' : '#e5e7eb'}
            strokeWidth="3"
            opacity="0.4"
            style={{
              transition: 'stroke 0.3s ease-in-out'
            }}
          />
          
          {/* Breathing direction indicator */}
          {isPlaying && (
            <>
              {/* Inhale arrows pointing inward */}
              {currentPhase === 'inhale' && (
                <>
                  {[0, 1, 2, 3].map((i) => {
                    const angle = (i * Math.PI) / 2;
                    const x1 = 100 + 37 * Math.cos(angle);
                    const y1 = 100 + 37 * Math.sin(angle);
                    const x2 = 100 + 30 * Math.cos(angle);
                    const y2 = 100 + 30 * Math.sin(angle);
                    
                    return (
                      <path
                        key={`inhale-${i}`}
                        d={`M ${x1} ${y1} L ${x2} ${y2} M ${x2 + 2.3 * Math.cos(angle + Math.PI/4)} ${y2 + 2.3 * Math.sin(angle + Math.PI/4)} L ${x2} ${y2} L ${x2 + 2.3 * Math.cos(angle - Math.PI/4)} ${y2 + 2.3 * Math.sin(angle - Math.PI/4)}`}
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="animate-pulse"
                      />
                    );
                  })}
                </>
              )}
              
              {/* Exhale arrows pointing outward */}
              {currentPhase === 'exhale' && (
                <>
                  {[0, 1, 2, 3].map((i) => {
                    const angle = (i * Math.PI) / 2;
                    const x1 = 100 + 30 * Math.cos(angle);
                    const y1 = 100 + 30 * Math.sin(angle);
                    const x2 = 100 + 37 * Math.cos(angle);
                    const y2 = 100 + 37 * Math.sin(angle);
                    
                    return (
                      <path
                        key={`exhale-${i}`}
                        d={`M ${x1} ${y1} L ${x2} ${y2} M ${x2 - 2.3 * Math.cos(angle + Math.PI/4)} ${y2 - 2.3 * Math.sin(angle + Math.PI/4)} L ${x2} ${y2} L ${x2 - 2.3 * Math.cos(angle - Math.PI/4)} ${y2 - 2.3 * Math.sin(angle - Math.PI/4)}`}
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="animate-pulse"
                      />
                    );
                  })}
                </>
              )}
            </>
          )}
        </svg>
      </div>

      {/* Middle section with timer and instructions */}
      <div className="flex flex-col items-center space-y-4 flex-grow justify-center py-2">
        {/* Timer display */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg shadow-gray-500/10 border border-white/20">
          <span className="text-xl font-bold bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent">
            {formatTime(timeLeft)}
          </span>
        </div>
        
        {/* Breathing instruction */}
        <div className={`bg-gradient-to-r from-gray-100/90 to-slate-100/90 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200/50 shadow-lg transition-all duration-500 ${
          isPlaying ? 'animate-pulse shadow-gray-500/20' : 'shadow-gray-500/10'
        }`}>
          <span className="text-sm font-semibold bg-gradient-to-r from-gray-700 to-slate-700 bg-clip-text text-transparent">
            {getBreathingPhase()}
          </span>
        </div>
        
        {/* Current count display */}
        {isPlaying && (
          <div className="text-center">
            <div className={`text-3xl font-bold ${currentPhase === 'inhale' ? 'text-blue-600' : 'text-emerald-600'} transition-colors duration-300 mb-1`}>
              {currentCount}
            </div>
            <div className="text-xs text-gray-500">
              {currentPhase === 'inhale' ? 'Breathing in' : 'Breathing out'}
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom section */}
      <div className="flex flex-col items-center space-y-3 flex-shrink-0 mt-6">
        {/* Technique explanation */}
        <div className="text-center text-xs text-gray-600 max-w-xs px-2">
          <p className="mb-1">Foundation breathing practice</p>
          <p>Count steadily with each breath</p>
        </div>
        
        {/* Play/pause button */}
        <button
          onClick={onTogglePlay}
          className="w-12 h-12 bg-gray-500 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
          aria-label={`${isPlaying ? 'Pause' : 'Start'} five breath counting`}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white fill-current" />
          ) : (
            <Play className="w-5 h-5 text-white fill-current ml-1" />
          )}
        </button>
      </div>
    </div>
  );
} 