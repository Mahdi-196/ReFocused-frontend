'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, RotateCcw, UserRoundCog, X } from 'lucide-react';
import audioService from '@/services/audioService';

interface MeditationTimerProps {
  onComplete: () => void;
  style?: React.CSSProperties;
  initialDuration?: number; // Duration in seconds, optional for backward compatibility
}

// Duration options for the slider interface (simplified)
const DEFAULT_DURATION = 300; // 5 minutes
const ALL_DURATIONS = [
  { label: '1 min', value: 60, description: 'Micro-meditation' },
  { label: '5 min', value: 300, description: 'Morning ritual' },
  { label: '25 min', value: 1500, description: 'Focused session' },
  { label: '60 min', value: 3600, description: 'Full hour practice' },
];

export default function MeditationTimer({ onComplete, style, initialDuration = DEFAULT_DURATION }: MeditationTimerProps) {
  const [selectedDuration, setSelectedDuration] = useState(initialDuration);
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isClientPortalReady, setIsClientPortalReady] = useState(false);
  const [tempSliderIndex, setTempSliderIndex] = useState<number>(0);
  const [tempNotificationSound, setTempNotificationSound] = useState<string>('soft-bell');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnnouncementRef = useRef(0);

  // Circular progress geometry
  const RADIUS = 40;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  // Notification sound selection (defaults to soft-bell like Pomodoro)
  const [notificationSound, setNotificationSound] = useState<string>('soft-bell');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('meditation_notification_sound');
      if (saved) setNotificationSound(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('meditation_notification_sound', notificationSound);
    } catch {}
  }, [notificationSound]);

  // Find the closest duration index for slider
  const getCurrentDurationIndex = () => {
    const index = ALL_DURATIONS.findIndex(d => d.value === selectedDuration);
    const defaultIndex = ALL_DURATIONS.findIndex(d => d.value === DEFAULT_DURATION);
    return index >= 0 ? index : (defaultIndex >= 0 ? defaultIndex : 0);
  };

  const [sliderIndex, setSliderIndex] = useState(getCurrentDurationIndex());

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsPlaying(false);
            setIsComplete(true);
            try { audioService.playNotificationSound(notificationSound); } catch {}
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
    // progress is a fraction [0..1]
    setProgress(1 - timeLeft / selectedDuration);
  }, [timeLeft, selectedDuration]);

  // Prepare portal only on client
  useEffect(() => {
    setIsClientPortalReady(true);
  }, []);

  // Open/close/save settings like Pomodoro modal
  const openSettings = () => {
    setTempSliderIndex(getCurrentDurationIndex());
    setTempNotificationSound(notificationSound);
    setShowSettings(true);
  };

  const closeSettings = () => {
    setShowSettings(false);
  };

  const saveSettings = () => {
    const newDuration = ALL_DURATIONS[tempSliderIndex].value;
    setSelectedDuration(newDuration);
    if (!isPlaying) {
      setTimeLeft(newDuration);
      setProgress(0);
      setIsComplete(false);
    }
    setNotificationSound(tempNotificationSound);
    try {
      localStorage.setItem('meditation_notification_sound', tempNotificationSound);
    } catch {}
    setSliderIndex(tempSliderIndex);
    setShowSettings(false);
  };

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
      {/* Reset Button (moved to top-left to free top-right for personalization) */}
      <button
        onClick={resetTimer}
        className="absolute top-2 left-2 p-2 rounded-full hover:bg-gray-700/50 transition-colors"
        aria-label="Reset timer"
      >
        <RotateCcw className="w-5 h-5 text-gray-300" />
      </button>

      {/* Personalization (top-right) */}
      <button
        onClick={openSettings}
        className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-700/50 transition-colors"
        aria-label="Customize meditation"
      >
        <UserRoundCog className="w-5 h-5 text-gray-300" />
      </button>

      {/* (Duration selector icon removed; selection now lives in Customize modal) */}

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
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={RADIUS}
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
            <p className="text-purple-200 font-medium">Session Complete!</p>
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

      {/* Settings modal (centered) rendered via portal, like Pomodoro */}
      {showSettings && isClientPortalReady && createPortal(
        (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50 p-8" onClick={closeSettings}>
            <div className="bg-gray-800 text-white rounded-lg p-6 w-[480px] max-w-full max-h-[87vh] overflow-y-auto shadow-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Meditation Settings</h2>
                <button 
                  onClick={closeSettings}
                  className="p-1.5 rounded-md bg-gray-700/50 hover:bg-gray-600/50 transition-colors duration-200"
                  aria-label="Close settings"
                >
                  <X className="w-4 h-4 text-gray-300" />
                </button>
              </div>
              {/* Duration Selection */}
              <div className="bg-gray-700/30 rounded-md p-2.5 border border-gray-600/30 mb-4">
                <label className="block text-xs font-medium mb-1.5 text-white">
                  Duration: <span className="text-indigo-300">{ALL_DURATIONS[tempSliderIndex].label}</span>
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min={0}
                    max={ALL_DURATIONS.length - 1}
                    value={tempSliderIndex}
                    onChange={(e) => setTempSliderIndex(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
                    style={{
                      background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(tempSliderIndex / (ALL_DURATIONS.length - 1)) * 100}%, #4b5563 ${(tempSliderIndex / (ALL_DURATIONS.length - 1)) * 100}%, #4b5563 100%)`
                    }}
                  />
                  <div className="flex justify-between mt-1 px-1">
                    {[0, 1, 2, 3].map((index) => (
                      <div key={index} className="text-[11px] text-gray-400 text-center">
                        <div className={`w-0.5 h-0.5 mx-auto mb-0.5 rounded-full ${tempSliderIndex >= index ? 'bg-indigo-400' : 'bg-gray-500'}`} />
                        <span className="text-[11px]">{ALL_DURATIONS[index].label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Notification Sound Selection */}
              <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30">
                <h4 className="block text-base font-semibold mb-3 text-white">
                  Completion Ring
                </h4>
                <p className="text-xs text-gray-400 mb-3">Choose the sound that plays when the session completes</p>
                <div className="space-y-2">
                  {audioService.getAvailableNotificationSounds().map((sound) => (
                    <div key={sound.id} className="bg-gray-600/30 rounded-md p-2.5 border border-gray-500/30 hover:bg-gray-600/40 transition-all duration-200">
                      <label className="flex items-center text-white cursor-pointer">
                        <div className="relative">
                          <input
                            type="radio"
                            name="meditation_sound"
                            value={sound.id}
                            checked={tempNotificationSound === sound.id}
                            onChange={() => {
                              setTempNotificationSound(sound.id);
                              try { audioService.playNotificationSound(sound.id); } catch {}
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-4 h-4 rounded-full border-2 border-gray-500 bg-transparent transition-all duration-200 peer-checked:border-indigo-500 peer-focus:ring-2 peer-focus:ring-indigo-400/40 relative after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-2 after:h-2 after:rounded-full after:bg-indigo-500 after:opacity-0 peer-checked:after:opacity-100"></div>
                        </div>
                        <span className="ml-2.5 text-sm font-medium">{sound.name}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={closeSettings}
                  className="flex-1 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white border border-gray-600/50 hover:border-gray-500/50 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}
    </div>
  );
} 