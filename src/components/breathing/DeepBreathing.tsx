'use client';

import React from 'react';
import { Play, Pause } from 'lucide-react';

interface DeepBreathingProps {
  isPlaying: boolean;
  timeLeft: number;
  durationSec: number;
  onTogglePlay: () => void;
}

export default function DeepBreathing({ isPlaying, timeLeft, durationSec, onTogglePlay }: DeepBreathingProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Deep breathing cycle: 20 seconds total (very slow)
  const getBreathingPhase = () => {
    if (!isPlaying) return 'Rest and digest';
    
    const elapsed = durationSec - timeLeft;
    const cycleTime = elapsed % 20; // 20 second cycle
    
    if (cycleTime < 7) return 'Deep inhale slowly';
    if (cycleTime < 9) return 'Hold naturally';
    if (cycleTime < 16) return 'Long peaceful exhale';
    return 'Natural pause';
  };

  // Calculate breathing depth
  const getBreathingDepth = () => {
    if (!isPlaying) return 1;
    
    const elapsed = durationSec - timeLeft;
    const cycleTime = elapsed % 20;
    
    if (cycleTime < 7) {
      // Deep inhale
      return 1 + (cycleTime / 7) * 0.6;
    } else if (cycleTime < 9) {
      // Hold
      return 1.6;
    } else if (cycleTime < 16) {
      // Long exhale
      return 1.6 - ((cycleTime - 9) / 7) * 0.6;
    } else {
      // Pause
      return 1;
    }
  };

  const breathingDepth = getBreathingDepth();

  return (
    <div className="flex flex-col items-center justify-between mx-auto mb-4 min-h-[264px]">
      {/* Deep Breathing Visualization */}
      <div className="relative w-full max-w-2xl h-32 mb-4 flex-shrink-0">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          {/* Outer calming rings */}
          {[1, 2, 3].map((ring) => (
            <circle
              key={ring}
              cx="100"
              cy="100"
              r={85 + ring * 10}
              fill="none"
              stroke="#e0e7ff"
              strokeWidth="3"
              opacity={0.2 / ring}
              className={isPlaying ? 'animate-pulse' : ''}
              style={{
                animationDuration: `${3 + ring}s`,
                animationDelay: `${ring * 0.5}s`
              }}
            />
          ))}
          
          {/* Main breathing visualization */}
          <circle
            cx="100"
            cy="100"
            r={75 * breathingDepth}
            fill="url(#deepGradient)"
            stroke="#3b82f6"
            strokeWidth="6"
            opacity="0.8"
            style={{
              transition: 'r 1s ease-in-out'
            }}
          />
          
          {/* Inner depth indicator */}
          <circle
            cx="100"
            cy="100"
            r={45 * breathingDepth}
            fill="url(#innerDeepGradient)"
            opacity="0.6"
            style={{
              transition: 'r 1s ease-in-out'
            }}
          />
          
          {/* Parasympathetic activation visualization */}
          {(() => {
            if (!isPlaying) return null;
            
            const elapsed = durationSec - timeLeft;
            const cycleProgress = (elapsed % 20) / 20;
            
            return (
              <>
                {/* Floating meditation particles */}
                {[0, 1, 2, 3, 4, 5, 6, 7].map((particle) => {
                  const angle = (particle * Math.PI) / 4;
                  const baseRadius = 130;
                  const radiusVar = 20 * Math.sin(cycleProgress * 2 * Math.PI + particle);
                  const x = 100 + (baseRadius + radiusVar) * Math.cos(angle);
                  const y = 100 + (baseRadius + radiusVar) * Math.sin(angle);
                  
                  return (
                    <circle
                      key={particle}
                      cx={x}
                      cy={y}
                      r="2"
                      fill="#3b82f6"
                      opacity={0.4 + 0.3 * Math.sin(cycleProgress * 4 * Math.PI + particle)}
                      className="animate-pulse"
                      style={{
                        animationDelay: `${particle * 0.3}s`,
                        animationDuration: '2s'
                      }}
                    />
                  );
                })}
                
                {/* Central calm indicator */}
                <circle
                  cx="100"
                  cy="100"
                  r="5"
                  fill="#3b82f6"
                  opacity="0.8"
                  className="animate-ping"
                  style={{
                    animationDuration: '3s'
                  }}
                />
              </>
            );
          })()}
          
          {/* Gradient definitions */}
          <defs>
            <radialGradient id="deepGradient">
              <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.1" />
            </radialGradient>
            <radialGradient id="innerDeepGradient">
              <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Middle section with timer and instructions */}
      <div className="flex flex-col items-center space-y-3 flex-grow justify-center">
        {/* Timer display */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg shadow-blue-500/10 border border-white/20">
          <span className="text-2xl font-bold text-blue-600">
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Breathing instruction */}
        <div className={`bg-blue-100/90 backdrop-blur-sm rounded-full px-4 py-2 border border-blue-200/50 shadow-lg transition-all duration-500 ${
          isPlaying ? 'animate-pulse shadow-blue-500/20' : 'shadow-blue-500/10'
        }`}>
          <span className="text-sm font-semibold text-blue-700">
            {getBreathingPhase()}
          </span>
        </div>
      </div>
      
      {/* Bottom section */}
      <div className="flex flex-col items-center space-y-3 flex-shrink-0 mt-6">
        {/* Technique explanation */}
        <div className="text-center text-xs text-gray-600 max-w-xs">
          <p className="mb-1">Activates parasympathetic nervous system</p>
          <p>Promotes rest, digest, and restore</p>
        </div>
        
        {/* Play/pause button */}
        <button
          onClick={onTogglePlay}
          className="w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
          aria-label={`${isPlaying ? 'Pause' : 'Start'} deep breathing`}
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