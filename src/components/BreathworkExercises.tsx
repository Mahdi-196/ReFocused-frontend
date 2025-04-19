'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Clock, Box, Star, Infinity as InfinityIcon, Heart, Sun, Wind, Activity, Brain } from 'lucide-react';
import MeditationTimer from './MeditationTimer';

export interface Technique {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  pattern: string;
  durationSec: number;
  category: 'meditation' | 'breathing';
}

const BREATHING_TECHNIQUES: Technique[] = [
  {
    key: 'box',
    label: 'Box Breathing',
    description: 'A 4-4-4-4 breath cycle, featured as both a "Mindful Activity" and a 3 min "Workout"',
    icon: <Box className="w-5 h-5" />,
    pattern: 'Inhale 4s, hold 4s, exhale 4s, hold 4s',
    durationSec: 180, // 3 min
    category: 'breathing'
  },
  {
    key: 'star',
    label: 'Star Breathing',
    description: 'Inhale/exhale pattern tracing a star shape, 5 min "Mindful Activity"',
    icon: <Star className="w-5 h-5" />,
    pattern: 'Follow the star pattern with your breath',
    durationSec: 300, // 5 min
    category: 'breathing'
  },
  {
    key: 'lazy-eight',
    label: 'Lazy Eight Breathing',
    description: 'Follows a figure-8 pattern for 5 min',
    icon: <InfinityIcon className="w-5 h-5" />,
    pattern: 'Trace the infinity symbol with your breath',
    durationSec: 300, // 5 min
    category: 'breathing'
  },
  {
    key: 'anxiety',
    label: 'Breathe Through Anxiety',
    description: '5 min "Mindful Activity" specifically for anxiety relief',
    icon: <Heart className="w-5 h-5" />,
    pattern: 'Gentle, calming breath pattern',
    durationSec: 300, // 5 min
    category: 'breathing'
  },
  {
    key: 'relaxation',
    label: 'Breathe in Relaxation',
    description: '5 min gentle breath-pattern exercise',
    icon: <Sun className="w-5 h-5" />,
    pattern: 'Slow, gentle breathing pattern',
    durationSec: 300, // 5 min
    category: 'breathing'
  },
  {
    key: 'alternate-nostril',
    label: 'Alternate Nostril Breathing',
    description: '4 min "Workout" for hemispheric balance (Nadi Shodhana)',
    icon: <Wind className="w-5 h-5" />,
    pattern: 'Alternate between nostrils',
    durationSec: 240, // 4 min
    category: 'breathing'
  },
  {
    key: 'belly',
    label: 'Belly Breathing',
    description: '3 min diaphragm-engaging "Workout"',
    icon: <Activity className="w-5 h-5" />,
    pattern: 'Focus on belly movement',
    durationSec: 180, // 3 min
    category: 'breathing'
  },
  {
    key: 'extended-exhale',
    label: 'Extended Exhale',
    description: '3 min "Workout" with longer exhalations than inhales',
    icon: <Brain className="w-5 h-5" />,
    pattern: 'Inhale 4s, exhale 6s',
    durationSec: 180, // 3 min
    category: 'breathing'
  },
  {
    key: 'deep',
    label: 'Deep Breathing',
    description: '2-3 min wind-down technique activating "rest and digest"',
    icon: <Wind className="w-5 h-5" />,
    pattern: 'Slow, deep breaths',
    durationSec: 150, // 2.5 min
    category: 'breathing'
  },
  {
    key: 'five-count',
    label: '5-Breath Counting',
    description: 'Simple inhale/exhale count to 5, foundation of all other practices',
    icon: <Activity className="w-5 h-5" />,
    pattern: 'Count to 5 with each breath',
    durationSec: 180, // 3 min
    category: 'breathing'
  }
];

interface BreathworkExercisesProps {
  techniques?: Technique[];
}

export default function BreathworkExercises({ techniques = BREATHING_TECHNIQUES }: BreathworkExercisesProps) {
  const [selectedCategory, setSelectedCategory] = useState<'meditation' | 'breathing'>('meditation');
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(0);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'hold2'>('inhale');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Box breathing phases timing
  const BOX_PHASES = {
    inhale: 4,
    hold: 4,
    exhale: 4,
    hold2: 4,
  };

  useEffect(() => {
    if (isPlaying && selectedTechnique?.key === 'box') {
      const totalCycleTime = BOX_PHASES.inhale + BOX_PHASES.hold + BOX_PHASES.exhale + BOX_PHASES.hold2;
      const cycleProgress = (selectedTechnique.durationSec - timeLeft) % totalCycleTime;
      
      if (cycleProgress < BOX_PHASES.inhale) {
        setBreathPhase('inhale');
      } else if (cycleProgress < BOX_PHASES.inhale + BOX_PHASES.hold) {
        setBreathPhase('hold');
      } else if (cycleProgress < BOX_PHASES.inhale + BOX_PHASES.hold + BOX_PHASES.exhale) {
        setBreathPhase('exhale');
      } else {
        setBreathPhase('hold2');
      }
    }
  }, [timeLeft, isPlaying, selectedTechnique]);

  useEffect(() => {
    if (isPlaying && selectedTechnique) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsPlaying(false);
            return selectedTechnique.durationSec;
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
  }, [isPlaying, selectedTechnique, BOX_PHASES.exhale, BOX_PHASES.hold, BOX_PHASES.hold2, BOX_PHASES.inhale]);

  useEffect(() => {
    if (selectedTechnique) {
      setProgress((1 - timeLeft / selectedTechnique.durationSec) * 100);
    }
  }, [timeLeft, selectedTechnique]);

  const handleCategorySelect = (category: 'meditation' | 'breathing') => {
    setSelectedCategory(category);
    setSelectedTechnique(null);
    setIsPlaying(false);
    setTimeLeft(0);
    setProgress(0);
  };

  const handleTechniqueSelect = (technique: Technique) => {
    setSelectedTechnique(technique);
    setTimeLeft(technique.durationSec);
    setIsPlaying(false);
    setProgress(0);
    setBreathPhase('inhale');
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMeditationComplete = () => {
    console.log('Meditation completed!');
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Category Selector */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => handleCategorySelect('meditation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              selectedCategory === 'meditation'
                ? 'bg-primary/10 border-2 border-primary'
                : 'border-2 border-transparent hover:bg-gray-100'
            }`}
            aria-label="Select meditation"
          >
            <Clock className="w-5 h-5" />
            <span className="font-medium">Meditation</span>
          </button>
          <button
            onClick={() => handleCategorySelect('breathing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              selectedCategory === 'breathing'
                ? 'bg-primary/10 border-2 border-primary'
                : 'border-2 border-transparent hover:bg-gray-100'
            }`}
            aria-label="Select breathing exercises"
          >
            <Activity className="w-5 h-5" />
            <span className="font-medium">Breathing Exercises</span>
          </button>
        </div>

        {/* Technique Selector */}
        {selectedCategory === 'breathing' && (
          <div className="flex flex-wrap gap-4 mb-6 overflow-x-auto pb-2">
            {techniques
              .filter(t => t.category === 'breathing')
              .map((technique) => (
                <button
                  key={technique.key}
                  onClick={() => handleTechniqueSelect(technique)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    selectedTechnique?.key === technique.key
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'border-2 border-transparent hover:bg-gray-100'
                  }`}
                  aria-label={`Select ${technique.label}`}
                >
                  {technique.icon}
                  <span className="font-medium">{technique.label}</span>
                </button>
              ))}
          </div>
        )}

        {/* Detail Panel */}
        <div className="flex flex-col md:flex-row gap-6 items-center">
          {selectedCategory === 'meditation' ? (
            <MeditationTimer
              durationSec={300}
              onComplete={handleMeditationComplete}
            />
          ) : selectedTechnique ? (
            <>
              {/* Timer and Progress Ring */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 100 100">
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
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold">{formatTime(timeLeft)}</span>
                  <button
                    onClick={togglePlayPause}
                    className="mt-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label={`${isPlaying ? 'Pause' : 'Start'} ${selectedTechnique.label}`}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="flex-1">
                <p className="text-gray-600">{selectedTechnique.description}</p>
                <p className="mt-2 text-sm text-gray-500">Pattern: {selectedTechnique.pattern}</p>
                {selectedTechnique.key === 'box' && isPlaying && (
                  <p className="mt-2 text-sm font-medium text-primary">
                    Current Phase: {breathPhase.charAt(0).toUpperCase() + breathPhase.slice(1)}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="w-full text-center text-gray-500">
              Select a breathing technique to begin
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 