'use client';

import React from 'react';
import { Play, Pause } from 'lucide-react';

interface ExtendedExhaleBreathingProps {
  isPlaying: boolean;
  timeLeft: number;
  durationSec: number;
  onTogglePlay: () => void;
}

export default function ExtendedExhaleBreathing({ isPlaying, timeLeft, durationSec, onTogglePlay }: ExtendedExhaleBreathingProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Extended exhale breathing cycle: 10 seconds total (4s inhale, 8s exhale)
  const getBreathingPhase = () => {
    if (!isPlaying) return 'Ready to release';
    
    const elapsed = durationSec - timeLeft;
    const cycleTime = elapsed % 10; // 10 second cycle
    
    if (cycleTime < 4) return 'Inhale 4 seconds';
    return 'Exhale slowly 6 seconds';
  };

  // Calculate progress for visual indicator
  const getPhaseProgress = () => {
    if (!isPlaying) return { phase: 'ready', progress: 0 };
    
    const elapsed = durationSec - timeLeft;
    const cycleTime = elapsed % 10;
    
    if (cycleTime < 4) {
      return { phase: 'inhale', progress: cycleTime / 4 };
    } else {
      return { phase: 'exhale', progress: (cycleTime - 4) / 6 };
    }
  };

  const { phase, progress } = getPhaseProgress();

  return (
    <div className="flex flex-col items-center justify-between mx-auto mb-4 min-h-[264px]">
      {/* Extended Exhale Visualization */}
      <div className="relative w-full max-w-2xl h-32 mb-4 flex-shrink-0">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          {/* Background timeline */}
          <rect
            x="10"
            y="85"
            width="180"
            height="18"
            fill="#f3f4f6"
            rx="9"
          />
          
          {/* Inhale section (4s out of 10s = 40% of 180px = 72px) */}
          <rect
            x="10"
            y="85"
            width="72"
            height="18"
            fill="#e0f2fe"
            rx="9"
          />
          
          {/* Exhale section (6s out of 10s = 60% of 180px = 108px) */}
          <rect
            x="82"
            y="85"
            width="108"
            height="18"
            fill="#fef3c7"
            rx="9"
          />
          
          {/* Progress indicator */}
          <rect
            x={phase === 'inhale' ? 10 : 82}
            y="85"
            width={(phase === 'inhale' ? 72 : 108) * progress}
            height="18"
            fill={phase === 'inhale' ? '#0891b2' : '#f59e0b'}
            rx="9"
            style={{
              transition: 'width 0.1s ease-out'
            }}
          />
          
          {/* Phase labels - above timeline only */}
          <text
            x="46"
            y="75"
            textAnchor="middle"
            className="text-base fill-cyan-700 font-semibold"
          >
            Inhale
          </text>
          
          <text
            x="136"
            y="75"
            textAnchor="middle"
            className="text-base fill-amber-700 font-semibold"
          >
            Exhale
          </text>
          
          {/* Central breathing circle - moved down */}
          <circle
            cx="100"
            cy="150"
            r={50 + (phase === 'inhale' ? progress * 20 : (1 - progress) * 20)}
            fill="url(#extendedGradient)"
            stroke={phase === 'inhale' ? '#0891b2' : '#f59e0b'}
            strokeWidth="6"
            opacity="0.7"
            style={{
              transition: 'r 0.3s ease-in-out'
            }}
          />
          
          {/* Breathing flow visualization */}
          {(() => {
            if (!isPlaying) return null;
            
            return (
              <>
                {/* Inhale particles */}
                {phase === 'inhale' && (
                  <>
                    {[1, 2, 3].map((particle) => (
                      <circle
                        key={`inhale-${particle}`}
                        cx={100 - particle * 20}
                        cy={170 + particle * 10 * Math.sin(progress * 4 * Math.PI)}
                        r="2"
                        fill="#0891b2"
                        opacity={0.8 - particle * 0.2}
                        className="animate-bounce"
                        style={{
                          animationDelay: `${particle * 0.1}s`,
                          animationDuration: '0.8s'
                        }}
                      />
                    ))}
                  </>
                )}
                
                {/* Exhale flow (longer) */}
                {phase === 'exhale' && (
                  <>
                    {[1, 2, 3, 4, 5].map((particle) => (
                      <circle
                        key={`exhale-${particle}`}
                        cx={100 + particle * 15}
                        cy={170 - particle * 8 + 10 * Math.sin(progress * 2 * Math.PI)}
                        r="1.5"
                        fill="#f59e0b"
                        opacity={0.9 - particle * 0.15}
                        className="animate-pulse"
                        style={{
                          animationDelay: `${particle * 0.2}s`,
                          animationDuration: '1.5s'
                        }}
                      />
                    ))}
                  </>
                )}
              </>
            );
          })()}
          
          {/* Gradient definitions */}
          <defs>
            <radialGradient id="extendedGradient">
              <stop offset="0%" stopColor={phase === 'inhale' ? '#cffafe' : '#fef3c7'} stopOpacity="0.6" />
              <stop offset="70%" stopColor={phase === 'inhale' ? '#0891b2' : '#f59e0b'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={phase === 'inhale' ? '#0e7490' : '#d97706'} stopOpacity="0.1" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Middle section with timer and instructions */}
      <div className="flex flex-col items-center space-y-3 flex-grow justify-center">
        {/* Timer display */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg shadow-orange-500/10 border border-white/20">
          <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            {formatTime(timeLeft)}
          </span>
        </div>
        
        {/* Breathing instruction */}
        <div className={`bg-gradient-to-r from-orange-100/90 to-amber-100/90 backdrop-blur-sm rounded-full px-4 py-2 border border-orange-200/50 shadow-lg transition-all duration-500 ${
          isPlaying ? 'animate-pulse shadow-orange-500/20' : 'shadow-orange-500/10'
        }`}>
          <span className="text-sm font-semibold bg-gradient-to-r from-orange-700 to-amber-700 bg-clip-text text-transparent">
            {getBreathingPhase()}
          </span>
        </div>
      </div>
      
      {/* Bottom section */}
      <div className="flex flex-col items-center space-y-3 flex-shrink-0 mt-6">
        {/* Technique explanation */}
        <div className="text-center text-xs text-gray-600 max-w-xs">
          <p className="mb-1">Longer exhales activate rest response</p>
          <p>2:1 ratio - exhale twice as long as inhale</p>
        </div>
        
        {/* Play/pause button */}
        <button
          onClick={onTogglePlay}
          className="w-14 h-14 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
          aria-label={`${isPlaying ? 'Pause' : 'Start'} extended exhale breathing`}
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