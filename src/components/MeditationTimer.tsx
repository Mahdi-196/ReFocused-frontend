'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';

interface MeditationTimerProps {
  onComplete: () => void;
  style?: React.CSSProperties;
  initialDuration?: number; // Duration in seconds, optional for backward compatibility
}

// Duration options for the slider interface
const ALL_DURATIONS = [
  { label: '1 min', value: 60, description: 'Micro-meditation' },
  { label: '2 min', value: 120, description: 'Quick reset' },
  { label: '3 min', value: 180, description: 'Breath break' },
  { label: '5 min', value: 300, description: 'Morning ritual' },
  { label: '10 min', value: 600, description: 'Standard session' },
  { label: '15 min', value: 900, description: 'Deep focus' },
  { label: '20 min', value: 1200, description: 'Extended practice' },
  { label: '25 min', value: 1500, description: 'Focused session' },
  { label: '30 min', value: 1800, description: 'Deep meditation' },
  { label: '45 min', value: 2700, description: 'Extended retreat' },
  { label: '60 min', value: 3600, description: 'Full hour practice' },
];

export default function MeditationTimer({ onComplete, style, initialDuration = 300 }: MeditationTimerProps) {
  const [selectedDuration, setSelectedDuration] = useState(initialDuration);
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showDurationSelector, setShowDurationSelector] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnnouncementRef = useRef(0);

  // Find the closest duration index for slider
  const getCurrentDurationIndex = () => {
    const index = ALL_DURATIONS.findIndex(d => d.value === selectedDuration);
    return index >= 0 ? index : 2; // Default to 3 min if not found
  };

  const [sliderIndex, setSliderIndex] = useState(getCurrentDurationIndex());

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsPlaying(false);
            setIsComplete(true);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, onComplete]);

  useEffect(() => {
    setProgress((1 - timeLeft / selectedDuration) * 360);
  }, [timeLeft, selectedDuration]);

  useEffect(() => {
    // Announce time every 30 seconds
    const currentTime = Math.floor(timeLeft);
    if (currentTime % 30 === 0 && currentTime !== lastAnnouncementRef.current) {
      lastAnnouncementRef.current = currentTime;
      const minutes = Math.floor(currentTime / 60);
      const seconds = currentTime % 60;
      const message = `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''} remaining`;
      const liveRegion = document.getElementById('timer-announcement');
      if (liveRegion) {
        liveRegion.textContent = message;
      }
    }
  }, [timeLeft]);

  const resetTimer = () => {
    setIsPlaying(false);
    setTimeLeft(selectedDuration);
    setProgress(0);
    setIsComplete(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };



  const handleSliderChange = (index: number) => {
    setSliderIndex(index);
    const newDuration = ALL_DURATIONS[index].value;
    if (!isPlaying) {
      setSelectedDuration(newDuration);
      setTimeLeft(newDuration);
      setProgress(0);
      setIsComplete(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDurationLabel = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };



  return (
    <div 
      className={`bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6 relative overflow-hidden transition-all duration-300 ${
        isComplete ? 'border-2 border-purple-400 animate-pulse' : ''
      }`}
      style={style}
    >
      {/* Reset Button */}
      <button
        onClick={resetTimer}
        className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-700/50 transition-colors"
        aria-label="Reset timer"
      >
        <RotateCcw className="w-5 h-5 text-gray-300" />
      </button>

      {/* Duration Selector Button */}
      <button
        onClick={() => setShowDurationSelector(!showDurationSelector)}
        disabled={isPlaying}
        className={`absolute top-2 left-2 p-2 rounded-full transition-colors ${
          isPlaying 
            ? 'text-gray-500 cursor-not-allowed' 
            : 'hover:bg-gray-700/50 text-gray-300'
        }`}
        aria-label="Change duration"
      >
        <Clock className="w-5 h-5" />
      </button>

      {/* Enhanced Duration Selector */}
      {showDurationSelector && !isPlaying && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDurationSelector(false)}
          />
          
          <div className="absolute top-12 left-2 bg-gradient-to-br from-gray-800/95 to-slate-800/95 backdrop-blur-sm border border-gray-600/50 rounded-xl shadow-2xl p-4 z-20 min-w-[210px] max-w-[240px]">
          {/* Header */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-white mb-1">Choose Your Session</h4>
            <p className="text-xs text-gray-300">Select the perfect duration</p>
          </div>

          {/* Slider View */}
          <div className="space-y-4">
            {/* Current Selection Display */}
            <div className="text-center p-2.5 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg">
              <div className="text-lg font-bold text-purple-300 mb-0.5">
                {ALL_DURATIONS[sliderIndex].label}
              </div>
              <div className="text-xs text-purple-400">
                {ALL_DURATIONS[sliderIndex].description}
              </div>
            </div>

            {/* Visual Duration Slider */}
            <div className="relative">
              <input
                type="range"
                min="0"
                max={ALL_DURATIONS.length - 1}
                value={sliderIndex}
                onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
                style={{
                  background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(sliderIndex / (ALL_DURATIONS.length - 1)) * 100}%, #4b5563 ${(sliderIndex / (ALL_DURATIONS.length - 1)) * 100}%, #4b5563 100%)`
                }}
              />
              
              {/* Duration Markers */}
              <div className="flex justify-between mt-1.5 px-1">
                {[0, Math.floor(ALL_DURATIONS.length / 3), Math.floor(2 * ALL_DURATIONS.length / 3), ALL_DURATIONS.length - 1].map((index) => (
                  <div key={index} className="text-xs text-gray-400 text-center">
                    <div className={`w-0.5 h-0.5 mx-auto mb-0.5 rounded-full ${
                      sliderIndex >= index ? 'bg-purple-400' : 'bg-gray-500'
                    }`} />
                    <span className="text-xs">{ALL_DURATIONS[index].label}</span>
                  </div>
                ))}
              </div>
            </div>


          </div>
        </div>
        </>
      )}

      {/* Timer Display */}
      <div className="flex flex-col items-center justify-center">
        {/* Duration Label */}
        <div className="mb-4">
          <span className="text-sm text-gray-300 bg-gray-700/50 border border-gray-600/50 px-3 py-1 rounded-full">
            {formatDurationLabel(selectedDuration)} session
          </span>
        </div>

        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Progress Ring */}
          <svg className="w-full h-full absolute" viewBox="0 0 100 100">
            <circle
              className="text-gray-600"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
            <circle
              className="text-purple-400 transition-all duration-1000 ease-linear"
              strokeWidth="8"
              strokeDasharray={`${progress * 2.51} 251`}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
              transform="rotate(-90 50 50)"
            />
          </svg>
          
          {/* Time Display */}
          <span className="text-4xl font-bold text-white">{formatTime(timeLeft)}</span>
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="mt-6 p-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 transition-all duration-200 shadow-lg transform hover:scale-105"
          aria-label={isPlaying ? 'Pause meditation' : 'Start meditation'}
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>
      </div>

      {/* Completion Message */}
      {isComplete && (
        <div className="mt-6 text-center">
          <div className="bg-gradient-to-br from-purple-800/60 to-blue-800/60 border border-purple-600/50 rounded-lg p-4">
            <p className="text-purple-200 font-medium">🎉 Session Complete!</p>
            <p className="text-purple-300 text-sm mt-1">Great job on completing your {formatDurationLabel(selectedDuration)} meditation</p>
          </div>
        </div>
      )}

      {/* ARIA Live Region */}
      <div
        id="timer-announcement"
        aria-live="polite"
        className="sr-only"
      />

      {/* Custom slider styles */}
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
          border: 2px solid white;
        }
        
        .slider-thumb::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
          border: 2px solid white;
        }
      `}</style>
    </div>
  );
} 