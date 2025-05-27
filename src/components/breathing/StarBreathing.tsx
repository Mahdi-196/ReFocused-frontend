'use client';

import React from 'react';
import { Play, Pause } from 'lucide-react';

interface StarBreathingProps {
  isPlaying: boolean;
  timeLeft: number;
  durationSec: number;
  onTogglePlay: () => void;
}

export default function StarBreathing({ isPlaying, timeLeft, durationSec, onTogglePlay }: StarBreathingProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Star breathing cycle: 5 points = 5 phases
  // Each point: 4 seconds (inhale 4s, hold 4s, exhale 4s, hold 4s, inhale 4s) = 20 seconds total
  const getBreathingPhase = () => {
    if (!isPlaying) return 'Ready';
    
    const elapsed = durationSec - timeLeft;
    const cycleTime = elapsed % 20; // 20 second cycle
    
    if (cycleTime < 4) return 'Inhale';
    if (cycleTime < 8) return 'Hold';
    if (cycleTime < 12) return 'Exhale';
    if (cycleTime < 16) return 'Hold';
    return 'Inhale';
  };

  // Calculate star points (5-pointed star) with perfect proportions
  const centerX = 100;
  const centerY = 100;
  const outerRadius = 90;
  const innerRadius = 36;
  
  const getStarPoints = () => {
    const points: { x: number; y: number }[] = [];
    
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2; // Start from top
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push({ x, y });
    }
    
    return points;
  };

  const starPoints = getStarPoints();
  
  // Create star path starting from top point
  const createStarPath = () => {
    const points = getStarPoints();
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    
    path += ' Z'; // Close the path
    return path;
  };

  return (
    <div className="flex flex-col items-center justify-between mx-auto mb-4 min-h-[264px]">
      {/* Star Breathing Visualization */}
      <div className="relative w-full max-w-2xl h-32 mb-4 flex-shrink-0">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          {/* Star base with simple styling */}
          <path
            d={createStarPath()}
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
            const cycleProgress = (elapsed % 20) / 20; // 20 seconds for star breathing cycle
            
            // Complete star path
            const completePath = createStarPath();
            
            // Approximate total path length (perimeter of star)
            let totalLength = 0;
            for (let i = 0; i < starPoints.length; i++) {
              const current = starPoints[i];
              const next = starPoints[(i + 1) % starPoints.length];
              const distance = Math.sqrt(Math.pow(next.x - current.x, 2) + Math.pow(next.y - current.y, 2));
              totalLength += distance;
            }
            
            // Calculate visible length based on progress
            const visibleLength = cycleProgress < 0.99 ? cycleProgress * totalLength : 0;
            
            return (
              <path
                d={completePath}
                fill="none"
                stroke="#eab308"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={totalLength}
                strokeDashoffset={totalLength - visibleLength}
                style={{ 
                  transition: 'stroke-dashoffset 0.2s ease-out'
                }}
              />
            );
          })()}
        </svg>
      </div>

      {/* Middle section with timer and instructions */}
      <div className="flex flex-col items-center space-y-3 flex-grow justify-center">
        {/* Timer display */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg shadow-amber-500/10 border border-white/20">
          <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
            {formatTime(timeLeft)}
          </span>
        </div>
        
        {/* Breathing instruction */}
        <div className={`bg-gradient-to-r from-amber-100/90 to-yellow-100/90 backdrop-blur-sm rounded-full px-4 py-2 border border-amber-200/50 shadow-lg transition-all duration-500 ${
          isPlaying ? 'animate-pulse shadow-amber-500/20' : 'shadow-amber-500/10'
        }`}>
          <span className="text-sm font-semibold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent">
            {getBreathingPhase()}
          </span>
        </div>
      </div>
      
      {/* Bottom section */}
      <div className="flex flex-col items-center space-y-3 flex-shrink-0 mt-6">
        {/* Technique explanation */}
        <div className="text-center text-xs text-gray-600 max-w-xs">
          <p className="mb-3">Five-pointed star breathing pattern</p>
          <p>Enhances focus and concentration</p>
        </div>
        
        {/* Play/pause button */}
        <button
          onClick={onTogglePlay}
          className="w-14 h-14 bg-yellow-500 hover:bg-yellow-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
          aria-label={`${isPlaying ? 'Pause' : 'Start'} star breathing`}
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