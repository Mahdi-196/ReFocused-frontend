'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Trees, Waves, CloudRain, Zap, Wind, Bird, Droplets, Flame, Coffee, Music, Clock, Infinity } from 'lucide-react';

interface Sound {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const AMBIENT_SOUNDS: Sound[] = [
  {
    id: 'forest',
    name: 'Forest Sounds',
    icon: <Trees className="w-6 h-6" />,
    color: 'from-green-600/80 to-green-700/80'
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    icon: <Waves className="w-6 h-6" />,
    color: 'from-blue-600/80 to-blue-700/80'
  },
  {
    id: 'rain',
    name: 'Rain Drops',
    icon: <CloudRain className="w-6 h-6" />,
    color: 'from-gray-600/80 to-gray-700/80'
  },
  {
    id: 'thunderstorm',
    name: 'Thunder Storm',
    icon: <Zap className="w-6 h-6" />,
    color: 'from-slate-600/80 to-slate-700/80'
  },
  {
    id: 'wind',
    name: 'Wind',
    icon: <Wind className="w-6 h-6" />,
    color: 'from-cyan-600/80 to-cyan-700/80'
  },
  {
    id: 'birdsong',
    name: 'Birdsong',
    icon: <Bird className="w-6 h-6" />,
    color: 'from-yellow-600/80 to-yellow-700/80'
  },
  {
    id: 'waterfall',
    name: 'Water Fall',
    icon: <Droplets className="w-6 h-6" />,
    color: 'from-teal-600/80 to-teal-700/80'
  },
  {
    id: 'fire',
    name: 'Crackling Fire',
    icon: <Flame className="w-6 h-6" />,
    color: 'from-red-600/80 to-red-700/80'
  },
  {
    id: 'coffee',
    name: 'Coffee Shop',
    icon: <Coffee className="w-6 h-6" />,
    color: 'from-orange-600/80 to-orange-700/80'
  },
  {
    id: 'whitenoise',
    name: 'White Noise',
    icon: <Music className="w-6 h-6" />,
    color: 'from-purple-600/80 to-purple-700/80'
  }
];

export default function AmbientSounds() {
  const [currentSound, setCurrentSound] = useState<Sound | null>(AMBIENT_SOUNDS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null); // null means infinity
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (isPlaying && duration && timeLeft !== null) {
      if (timeLeft <= 0) {
        setIsPlaying(false);
        setTimeLeft(null);
        return;
      }
      
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev ? prev - 1 : 0);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, timeLeft, duration]);

  const handleSoundSelect = (sound: Sound) => {
    if (currentSound?.id === sound.id) {
      if (!isPlaying) {
        setShowDurationPicker(true);
      } else {
        setIsPlaying(false);
        setTimeLeft(null);
      }
    } else {
      setCurrentSound(sound);
      setShowDurationPicker(true);
    }
  };

  const startPlaying = (selectedDuration: number | null) => {
    setDuration(selectedDuration);
    if (selectedDuration) {
      setTimeLeft(selectedDuration * 60); // Convert minutes to seconds
    } else {
      setTimeLeft(null);
    }
    setIsPlaying(true);
    setShowDurationPicker(false);
  };

  const togglePlayPause = () => {
    if (!isPlaying) {
      setShowDurationPicker(true);
    } else {
      setIsPlaying(false);
      setTimeLeft(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          🎵 Ambient Sounds
        </h2>
        
        {/* Now Playing */}
        {currentSound && (
          <div className="flex items-center gap-3 bg-gray-700/30 rounded-lg px-4 py-2">
            <div className="flex flex-col">
              <span className="text-sm text-gray-300">
                Now Playing: {currentSound.name}
              </span>
              {timeLeft !== null && (
                <span className="text-xs text-gray-400">
                  Time left: {formatTime(timeLeft)}
                </span>
              )}
              {isPlaying && duration === null && (
                <span className="text-xs text-gray-400">
                  Playing infinitely
                </span>
              )}
            </div>
            <button
              onClick={togglePlayPause}
              className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Sound Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {AMBIENT_SOUNDS.map((sound) => {
          const isActive = currentSound?.id === sound.id;
          const isCurrentlyPlaying = isActive && isPlaying;
          
          return (
            <button
              key={sound.id}
              onClick={() => handleSoundSelect(sound)}
              className={`relative p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] border-2 ${
                isActive 
                  ? `bg-gradient-to-br ${sound.color} border-white/20` 
                  : `bg-gray-700/30 border-gray-600/50 hover:bg-gradient-to-br hover:${sound.color} hover:border-white/10`
              }`}
            >
              {/* Sound Icon */}
              <div className={`mb-2 flex justify-center ${
                isActive ? 'text-white' : 'text-gray-400'
              }`}>
                {sound.icon}
              </div>
              
              {/* Sound Name */}
              <h3 className={`font-medium text-center ${
                isActive ? 'text-white' : 'text-gray-300'
              }`}>
                {sound.name}
              </h3>


            </button>
          );
        })}
      </div>

      {/* Duration Picker - Fixed Size */}
      {showDurationPicker && currentSound && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setShowDurationPicker(false)}>
          <div 
            className="bg-gray-800/90 backdrop-blur border border-gray-600/70 rounded-lg p-3 w-64 h-24 shadow-lg flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="999"
                placeholder="Minutes"
                autoFocus
                className="flex-1 p-2 bg-gray-700/60 border border-gray-600/50 rounded text-white text-sm placeholder-gray-400 text-center focus:border-blue-500 focus:outline-none h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = parseInt(e.currentTarget.value);
                    if (value && value > 0) {
                      startPlaying(value);
                    }
                  }
                  if (e.key === 'Escape') {
                    setShowDurationPicker(false);
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  const value = parseInt(input.value);
                  if (value && value > 0) {
                    startPlaying(value);
                  }
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm transition-colors h-8 flex items-center"
              >
                Play
              </button>
            </div>
            
            <button
              onClick={() => startPlaying(null)}
              className="w-full p-2 bg-gray-700/60 hover:bg-gray-600/60 rounded flex items-center justify-center gap-2 text-gray-300 text-sm transition-colors h-8"
            >
              <Infinity className="w-4 h-4" />
              Forever
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      {currentSound && (
        <div className="mt-6 pt-4 border-t border-gray-600/50">
          <div className="flex items-center justify-between text-sm text-gray-300">
            <span>
              {isPlaying ? 'Playing' : 'Paused'} • {currentSound.name}
            </span>
            <span className="text-gray-400">
              Ambient focus sounds for productivity
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 