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
    // Future: Implement completion tracking
    // Could track meditation sessions, update streaks, etc.
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mindful Breathing</h1>
                <p className="text-gray-600">Focus on your breath and find inner peace</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
              ℹ️ Learn More
            </button>
          </div>
          
          <p className="text-gray-700 leading-relaxed">
            This week, we focus on cultivating mindfulness through conscious breathing. 
            Select a technique that resonates with your current needs and state of mind.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Technique Selection Header */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Choose Your Practice</h2>
            <p className="text-gray-600">Select a breathing technique that suits your needs</p>
          </div>

          {/* Breathing Techniques Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {techniques
              .filter(t => t.category === 'breathing')
              .map((technique) => (
                <button
                  key={technique.key}
                  onClick={() => handleTechniqueSelect(technique)}
                  className={`group p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                    selectedTechnique?.key === technique.key
                      ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]'
                      : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-md hover:scale-[1.01]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        selectedTechnique?.key === technique.key
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                      }`}>
                        {technique.icon}
                      </div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-900">
                        {technique.label}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {technique.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.round(technique.durationSec / 60)} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {technique.pattern.split(',')[0]}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
          </div>

          {/* Practice Session - Only shows when technique is selected */}
          {selectedTechnique && (
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {selectedTechnique.label}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {selectedTechnique.pattern}
                  </p>

                  {/* Enhanced Timer Circle */}
                  <div className="relative w-40 h-40 mx-auto mb-6">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        className="text-gray-200"
                        strokeWidth="6"
                        stroke="currentColor"
                        fill="transparent"
                        r="44"
                        cx="50"
                        cy="50"
                      />
                      <circle
                        className="text-blue-500 transition-all duration-1000 ease-linear"
                        strokeWidth="6"
                        strokeDasharray={`${progress * 2.76} 276`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="44"
                        cx="50"
                        cy="50"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-gray-900 mb-1">
                        {formatTime(timeLeft)}
                      </span>
                      <button
                        onClick={togglePlayPause}
                        className="w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
                        aria-label={`${isPlaying ? 'Pause' : 'Start'} ${selectedTechnique.label}`}
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6 text-white" />
                        ) : (
                          <Play className="w-6 h-6 text-white ml-1" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Breathing Phase Indicator */}
                  {selectedTechnique.key === 'box' && isPlaying && (
                    <div className="bg-blue-50 rounded-xl p-4 mb-4">
                      <p className="text-sm text-blue-700 font-medium mb-2">Current Phase</p>
                      <p className="text-lg font-bold text-blue-900 capitalize">
                        {breathPhase === 'hold2' ? 'Hold (Empty)' : breathPhase}
                      </p>
                    </div>
                  )}

                  {/* Progress Stats */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Duration</span>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round(selectedTechnique.durationSec / 60)} minutes
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`text-sm font-medium ${
                        isPlaying ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {isPlaying ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>


      </div>
    </div>
  );
} 