'use client';

import React from 'react';
import { Play, Pause } from 'lucide-react';

interface BreatheThroughAnxietyProps {
  isPlaying: boolean;
  timeLeft: number;
  durationSec: number;
  onTogglePlay: () => void;
}

export default function BreatheThroughAnxiety({ isPlaying, timeLeft, durationSec, onTogglePlay }: BreatheThroughAnxietyProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Gentle anxiety breathing cycle: 12 seconds total
  const getBreathingPhase = () => {
    if (!isPlaying) return 'Find your calm';
    
    const elapsed = durationSec - timeLeft;
    const cycleTime = elapsed % 12; // 12 second cycle
    
    if (cycleTime < 4) return 'Breathe in gently';
    if (cycleTime < 6) return 'Hold softly';
    if (cycleTime < 10) return 'Release slowly';
    return 'Rest';
  };

  // Create gentle wave path for anxiety relief
  const createWavePath = (amplitude: number = 20) => {
    const centerY = 100;
    const width = 160;
    const startX = 20;
    
    let path = `M ${startX} ${centerY}`;
    
    // Create smooth waves using quadratic curves
    for (let i = 0; i < 4; i++) {
      const x1 = startX + (i * width / 4) + (width / 8);
      const y1 = centerY + (i % 2 === 0 ? -amplitude : amplitude);
      const x2 = startX + ((i + 1) * width / 4);
      const y2 = centerY;
      
      path += ` Q ${x1} ${y1} ${x2} ${y2}`;
    }
    
    return path;
  };

  return (
    <div className="flex flex-col items-center justify-between mx-auto mb-4 min-h-[264px]">
      {/* Gentle Wave Visualization */}
      <div className="relative w-full max-w-2xl h-32 mb-4 flex-shrink-0">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          {/* Background calming circle */}
          <circle
            cx="100"
            cy="100"
            r="95"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="4"
            opacity="0.5"
            className={isPlaying ? 'animate-pulse' : ''}
          />
          
          {/* Base wave path */}
          <path
            d={createWavePath(30)}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          
          {/* Animated breathing wave */}
          {(() => {
            if (!isPlaying) return null;
            
            const elapsed = durationSec - timeLeft;
            const cycleProgress = (elapsed % 12) / 12; // 12 seconds for anxiety relief cycle
            
            const completePath = createWavePath(37);
            const approximateLength = 240;
            const visibleLength = cycleProgress * approximateLength;
            
            return (
              <>
                <path
                  d={completePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={approximateLength}
                  strokeDashoffset={approximateLength - visibleLength}
                  style={{ 
                    transition: 'stroke-dashoffset 0.3s ease-out'
                  }}
                />
                {/* Calming gradient overlay */}
                <circle
                  cx="100"
                  cy="100"
                  r={80 + 15 * Math.sin(cycleProgress * 2 * Math.PI)}
                  fill="url(#calmGradient)"
                  opacity="0.1"
                  className="animate-pulse"
                />
              </>
            );
          })()}
          
          {/* Gradient definition */}
          <defs>
            <radialGradient id="calmGradient">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Middle section with timer and instructions */}
      <div className="flex flex-col items-center space-y-3 flex-grow justify-center">
        {/* Timer display */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg shadow-emerald-500/10 border border-white/20">
          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            {formatTime(timeLeft)}
          </span>
        </div>
        
        {/* Breathing instruction */}
        <div className={`bg-gradient-to-r from-emerald-100/90 to-green-100/90 backdrop-blur-sm rounded-full px-4 py-2 border border-emerald-200/50 shadow-lg transition-all duration-500 ${
          isPlaying ? 'animate-pulse shadow-emerald-500/20' : 'shadow-emerald-500/10'
        }`}>
          <span className="text-sm font-semibold bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent">
            {getBreathingPhase()}
          </span>
        </div>
      </div>
      
      {/* Bottom section */}
      <div className="flex flex-col items-center space-y-3 flex-shrink-0 mt-6">
        {/* Technique explanation */}
        <div className="text-center text-xs text-gray-600 max-w-xs">
          <p className="mb-1">Gentle breathing to ease anxiety</p>
          <p>Activates calming response naturally</p>
        </div>
        
        {/* Play/pause button */}
        <button
          onClick={onTogglePlay}
          className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
          aria-label={`${isPlaying ? 'Pause' : 'Start'} anxiety relief breathing`}
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