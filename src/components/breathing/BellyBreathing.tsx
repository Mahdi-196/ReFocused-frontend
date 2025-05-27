'use client';

import React from 'react';
import { Play, Pause } from 'lucide-react';

interface BellyBreathingProps {
  isPlaying: boolean;
  timeLeft: number;
  durationSec: number;
  onTogglePlay: () => void;
}

export default function BellyBreathing({ isPlaying, timeLeft, durationSec, onTogglePlay }: BellyBreathingProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Diaphragmatic breathing cycle: 10 seconds total
  const getBreathingPhase = () => {
    if (!isPlaying) return 'Place hand on belly';
    
    const elapsed = durationSec - timeLeft;
    const cycleTime = elapsed % 10; // 10 second cycle
    
    if (cycleTime < 4) return 'Belly expands out';
    if (cycleTime < 5) return 'Hold gently';
    if (cycleTime < 9) return 'Belly draws in';
    return 'Rest';
  };

  // Calculate belly expansion
  const getBellyScale = () => {
    if (!isPlaying) return 1;
    
    const elapsed = durationSec - timeLeft;
    const cycleTime = elapsed % 10;
    
    if (cycleTime < 4) {
      // Inhale - belly expands
      return 1 + (cycleTime / 4) * 0.4;
    } else if (cycleTime < 5) {
      // Hold - stay expanded
      return 1.4;
    } else if (cycleTime < 9) {
      // Exhale - belly contracts
      return 1.4 - ((cycleTime - 5) / 4) * 0.4;
    } else {
      // Rest - normal position
      return 1;
    }
  };

  const bellyScale = getBellyScale();

  return (
    <div className="flex flex-col items-center justify-between mx-auto mb-4 min-h-[264px]">
      {/* Belly Breathing Visualization */}
      <div className="relative w-full max-w-2xl h-32 mb-4 flex-shrink-0">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          {/* Simple torso silhouette */}
          <path
            d="M 80 60 Q 100 50 120 60 L 125 120 Q 125 140 120 160 L 80 160 Q 75 140 75 120 Z"
            fill="#f8fafc"
            stroke="#e2e8f0"
            strokeWidth="2"
            opacity="0.6"
          />
          
          {/* Chest area (stays relatively still) */}
          <ellipse
            cx="100"
            cy="80"
            rx="20"
            ry="15"
            fill="#e2e8f0"
            opacity="0.4"
          />
          
          {/* Belly area - main expanding element */}
          <circle
            cx="100"
            cy="130"
            r={60 + (bellyScale - 1) * 37}
            fill="url(#bellyGradient)"
            stroke="#06b6d4"
            strokeWidth="5"
            opacity="0.8"
            style={{
              transition: 'r 0.4s ease-in-out'
            }}
          />
          
          {/* Simple hand placement indicator */}
          <circle
            cx="100"
            cy="130"
            r="27"
            fill="none"
            stroke="#64748b"
            strokeWidth="3"
            strokeDasharray="4,4"
            opacity="0.6"
          />
          <text
            x="100"
            y="135"
            textAnchor="middle"
            className="text-xs fill-gray-500"
            fontSize="10"
          >
            hand
          </text>
          
          {/* Breathing direction indicators */}
          {(() => {
            if (!isPlaying) return null;
            
            const elapsed = durationSec - timeLeft;
            const cycleTime = elapsed % 10;
            const isInhaling = cycleTime < 4;
            const isExhaling = cycleTime >= 5 && cycleTime < 9;
            
            // Simple directional arrows around the belly
            return (
              <>
                {isInhaling && (
                  <>
                    {/* Expansion arrows */}
                    <path
                      d="M 60 130 L 50 130 M 52 127 L 50 130 L 52 133"
                      stroke="#06b6d4"
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="animate-pulse"
                    />
                    <path
                      d="M 140 130 L 150 130 M 148 127 L 150 130 L 148 133"
                      stroke="#06b6d4"
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="animate-pulse"
                    />
                    <path
                      d="M 100 90 L 100 80 M 97 82 L 100 80 L 103 82"
                      stroke="#06b6d4"
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="animate-pulse"
                    />
                    <path
                      d="M 100 170 L 100 180 M 97 178 L 100 180 L 103 178"
                      stroke="#06b6d4"
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="animate-pulse"
                    />
                  </>
                )}
                
                {isExhaling && (
                  <>
                    {/* Contraction arrows */}
                    <path
                      d="M 50 130 L 60 130 M 58 127 L 60 130 L 58 133"
                      stroke="#f59e0b"
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="animate-pulse"
                    />
                    <path
                      d="M 150 130 L 140 130 M 142 127 L 140 130 L 142 133"
                      stroke="#f59e0b"
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="animate-pulse"
                    />
                    <path
                      d="M 100 80 L 100 90 M 97 88 L 100 90 L 103 88"
                      stroke="#f59e0b"
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="animate-pulse"
                    />
                    <path
                      d="M 100 180 L 100 170 M 97 172 L 100 170 L 103 172"
                      stroke="#f59e0b"
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="animate-pulse"
                    />
                  </>
                )}
              </>
            );
          })()}
          
          {/* Gradient definitions */}
          <defs>
            <radialGradient id="bellyGradient">
              <stop offset="0%" stopColor="#cffafe" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.2" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Middle section with timer and instructions */}
      <div className="flex flex-col items-center space-y-3 flex-grow justify-center">
        {/* Timer display */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg shadow-cyan-500/10 border border-white/20">
          <span className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
            {formatTime(timeLeft)}
          </span>
        </div>
        
        {/* Breathing instruction */}
        <div className={`bg-gradient-to-r from-cyan-100/90 to-teal-100/90 backdrop-blur-sm rounded-full px-4 py-2 border border-cyan-200/50 shadow-lg transition-all duration-500 ${
          isPlaying ? 'animate-pulse shadow-cyan-500/20' : 'shadow-cyan-500/10'
        }`}>
          <span className="text-sm font-semibold bg-gradient-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent">
            {getBreathingPhase()}
          </span>
        </div>
      </div>
      
      {/* Bottom section */}
      <div className="flex flex-col items-center space-y-3 flex-shrink-0 mt-6">
        {/* Technique tips */}
        <div className="text-center text-xs text-gray-600 max-w-xs">
          <p className="mb-1">Feel your belly rise and fall</p>
          <p>Keep chest relatively still</p>
        </div>
        
        {/* Play/pause button */}
        <button
          onClick={onTogglePlay}
          className="w-14 h-14 bg-cyan-500 hover:bg-cyan-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
          aria-label={`${isPlaying ? 'Pause' : 'Start'} belly breathing`}
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