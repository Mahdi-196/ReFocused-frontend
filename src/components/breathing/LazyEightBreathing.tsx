'use client';

import React from 'react';
import { Play, Pause } from 'lucide-react';

interface LazyEightBreathingProps {
  isPlaying: boolean;
  timeLeft: number;
  durationSec: number;
  onTogglePlay: () => void;
}

export default function LazyEightBreathing({ isPlaying, timeLeft, durationSec, onTogglePlay }: LazyEightBreathingProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Lazy eight breathing cycle: 8 seconds per loop
  const getBreathingPhase = () => {
    if (!isPlaying) return 'Ready';
    
    const elapsed = durationSec - timeLeft;
    const cycleTime = elapsed % 16; // 16 second cycle
    
    if (cycleTime < 8) return 'Inhale slowly';
    return 'Exhale slowly';
  };

  // Create infinity symbol path (figure-8) with accurate measurements
  const createInfinityPath = () => {
    const centerX = 100;
    const centerY = 100;
    const width = 120;
    const height = 60;
    
    // More accurate infinity symbol using proper cubic bezier curves
    return `M ${centerX - width} ${centerY}
            C ${centerX - width} ${centerY - height}, ${centerX - 20} ${centerY - height}, ${centerX} ${centerY}
            C ${centerX + 20} ${centerY + height}, ${centerX + width} ${centerY + height}, ${centerX + width} ${centerY}
            C ${centerX + width} ${centerY - height}, ${centerX + 20} ${centerY - height}, ${centerX} ${centerY}
            C ${centerX - 20} ${centerY + height}, ${centerX - width} ${centerY + height}, ${centerX - width} ${centerY} Z`;
  };

  // Get the actual path length for accurate animation
  const getPathLength = () => {
    // Calculate approximate path length based on the infinity curve
    // Using ellipse perimeter approximation for each loop
    const width = 120;
    const height = 60;
    const loopLength = Math.PI * (3 * (width + height) - Math.sqrt((3 * width + height) * (width + 3 * height)));
    return loopLength * 2; // Two loops in infinity symbol
  };

  return (
    <div className="flex flex-col items-center justify-between mx-auto mb-4 min-h-[264px]">
      {/* Infinity Symbol Visualization */}
      <div className="relative w-full max-w-2xl h-32 mb-4 flex-shrink-0">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          {/* Base infinity path */}
          <path
            d={createInfinityPath()}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          
          {/* Animated progress path */}
          {(() => {
            if (!isPlaying) return null;
            
            const elapsed = durationSec - timeLeft;
            const cycleProgress = (elapsed % 16) / 16; // 16 seconds for lazy eight cycle
            
            const pathLength = getPathLength();
            const visibleLength = cycleProgress * pathLength;
            
            // Create a smoother animation based on breathing phases
            const breathPhase = elapsed % 16;
            const animationSpeed = breathPhase < 8 ? 'ease-in' : 'ease-out';
            
            return (
              <path
                d={createInfinityPath()}
                fill="none"
                stroke="url(#infinityGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={pathLength}
                strokeDashoffset={pathLength - visibleLength}
                style={{ 
                  transition: `stroke-dashoffset 0.5s ${animationSpeed}`,
                  filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.4))'
                }}
              />
            );
          })()}
          
          {/* Gradient definition for the infinity path */}
          <defs>
            <linearGradient id="infinityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#0e7490" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Middle section with timer and instructions */}
      <div className="flex flex-col items-center space-y-3 flex-grow justify-center">
        {/* Timer display */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg shadow-cyan-500/10 border border-white/20">
          <span className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            {formatTime(timeLeft)}
          </span>
        </div>
        
        {/* Breathing instruction */}
        <div className={`bg-gradient-to-r from-cyan-100/90 to-blue-100/90 backdrop-blur-sm rounded-full px-4 py-2 border border-cyan-200/50 shadow-lg transition-all duration-500 ${
          isPlaying ? 'animate-pulse shadow-cyan-500/20' : 'shadow-cyan-500/10'
        }`}>
          <span className="text-sm font-semibold bg-gradient-to-r from-cyan-700 to-blue-700 bg-clip-text text-transparent">
            {getBreathingPhase()}
          </span>
        </div>
      </div>
      
      {/* Bottom section */}
      <div className="flex flex-col items-center space-y-3 flex-shrink-0 mt-6">
        {/* Technique explanation */}
        <div className="text-center text-xs text-gray-600 max-w-xs">
          <p className="mb-1">Follow the infinity symbol pattern</p>
          <p>Promotes bilateral brain integration</p>
        </div>
        
        {/* Play/pause button */}
        <button
          onClick={onTogglePlay}
          className="w-14 h-14 bg-cyan-500 hover:bg-cyan-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
          aria-label={`${isPlaying ? 'Pause' : 'Start'} lazy eight breathing`}
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