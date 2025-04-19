'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface MeditationTimerProps {
  durationSec: number;
  onComplete: () => void;
  style?: React.CSSProperties;
}

export default function MeditationTimer({ durationSec, onComplete, style }: MeditationTimerProps) {
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnnouncementRef = useRef(0);

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
    setProgress((1 - timeLeft / durationSec) * 360);
  }, [timeLeft, durationSec]);

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
    setTimeLeft(durationSec);
    setProgress(0);
    setIsComplete(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm p-6 relative overflow-hidden transition-all duration-300 ${
        isComplete ? 'border-2 border-primary animate-pulse' : ''
      }`}
      style={style}
    >
      {/* Reset Button */}
      <button
        onClick={resetTimer}
        className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Reset timer"
      >
        <RotateCcw className="w-5 h-5 text-gray-500" />
      </button>

      {/* Timer Display */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Progress Ring */}
          <svg className="w-full h-full absolute" viewBox="0 0 100 100">
            <circle
              className="text-gray-200"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
            <circle
              className="text-primary transition-all duration-1000 ease-linear"
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
          <span className="text-4xl font-bold">{formatTime(timeLeft)}</span>
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="mt-6 p-3 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
          aria-label={isPlaying ? 'Pause meditation' : 'Start meditation'}
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>
      </div>

      {/* ARIA Live Region */}
      <div
        id="timer-announcement"
        aria-live="polite"
        className="sr-only"
      />
    </div>
  );
} 