'use client';

import React from 'react';
import { Play, Pause } from 'lucide-react';

interface BreatheInRelaxationProps {
  isPlaying: boolean;
  timeLeft: number;
  durationSec: number;
  onTogglePlay: () => void;
}

export default function BreatheInRelaxation({ isPlaying, timeLeft, durationSec, onTogglePlay }: BreatheInRelaxationProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Slow relaxation breathing cycle: 18 seconds total
  const getBreathingPhase = () => {
    if (!isPlaying) return 'Ready to relax';
    
    const elapsed = durationSec - timeLeft;
    const cycleTime = elapsed % 18; // 18 second cycle
    
    if (cycleTime < 6) return 'Breathe in slowly';
    if (cycleTime < 9) return 'Hold gently';
    if (cycleTime < 15) return 'Exhale completely';
    return 'Pause';
  };

  // Calculate breathing animation scale
  const getBreathingScale = () => {
    if (!isPlaying) return 1;
    
    const elapsed = durationSec - timeLeft;
    const cycleTime = elapsed % 18;
    
    if (cycleTime < 6) {
      // Inhale - expand
      return 1 + (cycleTime / 6) * 0.5;
    } else if (cycleTime < 9) {
      // Hold - stay expanded
      return 1.5;
    } else if (cycleTime < 15) {
      // Exhale - contract
      return 1.5 - ((cycleTime - 9) / 6) * 0.5;
    } else {
      // Pause - stay small
      return 1;
    }
  };

  const scale = getBreathingScale();

  return (
    <div className="flex flex-col items-center justify-between mx-auto mb-4 min-h-[264px]">
      {/* Relaxation Circle Visualization */}
      <div className="relative w-full max-w-2xl h-32 mb-4 flex-shrink-0">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          {/* Outer relaxation rings */}
          {[1, 2].map((ring) => (
            <circle
              key={ring}
              cx="100"
              cy="100"
              r={90 + ring * 15}
              fill="none"
              stroke="#e0e7ff"
              strokeWidth="3"
              opacity={0.3 / ring}
              className={isPlaying ? 'animate-ping' : ''}
              style={{
                animationDuration: `${2 + ring}s`,
                animationDelay: `${ring * 0.5}s`
              }}
            />
          ))}
          
          {/* Main breathing circle */}
          <circle
            cx="100"
            cy="100"
            r="75"
            fill="url(#relaxGradient)"
            stroke="#8b5cf6"
            strokeWidth="6"
            opacity="0.8"
            transform={`scale(${scale})`}
            transformOrigin="100 100"
            style={{
              transition: 'transform 0.5s ease-in-out'
            }}
          />
          
          {/* Inner breathing pattern */}
          {(() => {
            if (!isPlaying) return null;
            
            const elapsed = durationSec - timeLeft;
            const cycleProgress = (elapsed % 18) / 18;
            
            return (
              <>
                {/* Breathing dots around circle */}
                {[0, 1, 2, 3, 4, 5].map((dot) => {
                  const angle = (dot * Math.PI) / 3;
                  const radius = 60 + 30 * Math.sin(cycleProgress * 2 * Math.PI);
                  const x = 100 + radius * Math.cos(angle);
                  const y = 100 + radius * Math.sin(angle);
                  
                  return (
                    <circle
                      key={dot}
                      cx={x}
                      cy={y}
                      r="6"
                      fill="#8b5cf6"
                      opacity="0.6"
                      className="animate-pulse"
                      style={{
                        animationDelay: `${dot * 0.2}s`
                      }}
                    />
                  );
                })}
              </>
            );
          })()}
          
          {/* Gradient definitions */}
          <defs>
            <radialGradient id="relaxGradient">
              <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#8b5cf6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.1" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Middle section with timer and instructions */}
      <div className="flex flex-col items-center space-y-3 flex-grow justify-center">
        {/* Timer display */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg shadow-purple-500/10 border border-white/20">
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            {formatTime(timeLeft)}
          </span>
        </div>
        
        {/* Breathing instruction */}
        <div className={`bg-gradient-to-r from-purple-100/90 to-violet-100/90 backdrop-blur-sm rounded-full px-4 py-2 border border-purple-200/50 shadow-lg transition-all duration-500 ${
          isPlaying ? 'animate-pulse shadow-purple-500/20' : 'shadow-purple-500/10'
        }`}>
          <span className="text-sm font-semibold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent">
            {getBreathingPhase()}
          </span>
        </div>
      </div>
      
      {/* Bottom section */}
      <div className="flex flex-col items-center space-y-3 flex-shrink-0 mt-6">
        {/* Technique explanation */}
        <div className="text-center text-xs text-gray-600 max-w-xs">
          <p className="mb-1">Slow, mindful breathing for relaxation</p>
          <p>Reduces stress and promotes calm</p>
        </div>
        
        {/* Play/pause button */}
        <button
          onClick={onTogglePlay}
          className="w-14 h-14 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
          aria-label={`${isPlaying ? 'Pause' : 'Start'} relaxation breathing`}
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