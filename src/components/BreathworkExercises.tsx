'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, Clock, Box, Star, Infinity as InfinityIcon, Heart, Sun, Wind, Activity, Brain, ChevronRight, X } from './icons';
import {
  BoxBreathing,
  StarBreathing,
  LazyEightBreathing,
  BreatheThroughAnxiety,
  BreatheInRelaxation,
  AlternateNostrilBreathing,
  BellyBreathing,
  ExtendedExhaleBreathing,
  DeepBreathing,
  FiveBreathCounting
} from './LazyBreathingComponents';

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
    label: 'Soft Breathing',
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
    key: 'extended-exhale',
    label: 'Extended Exhale',
    description: '3 min "Workout" with longer exhalations than inhales',
    icon: <Brain className="w-5 h-5" />,
    pattern: 'Inhale 4s, exhale 8s',
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
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(0);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'hold2'>('inhale');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTechnique, setModalTechnique] = useState<Technique | null>(null);
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
      const elapsed = selectedTechnique.durationSec - timeLeft;
      const cycleProgress = elapsed % totalCycleTime;
      
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

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);



  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openFocusedSession = (technique: Technique) => {
    setModalTechnique(technique);
    setSelectedTechnique(technique);
    setTimeLeft(technique.durationSec);
    setIsPlaying(false);
    setProgress(0);
    setBreathPhase('inhale');
    setIsModalOpen(true);
  };

  const closeFocusedSession = () => {
    setIsModalOpen(false);
    setModalTechnique(null);
    setSelectedTechnique(null);
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  return (
    <div className="p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Mindful Breathing</h1>
                <p className="text-gray-300">Focus on your breath and find inner peace</p>
              </div>
            </div>
          </div>
          
          <p className="text-gray-300 leading-relaxed">
            This week, we focus on cultivating mindfulness through conscious breathing. 
            Select a technique that resonates with your current needs and state of mind.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Technique Selection Header */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Choose Your Practice</h2>
            <p className="text-gray-300">Select a breathing technique that suits your needs</p>
          </div>

          {/* Breathing Techniques Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {techniques
              .filter(t => t.category === 'breathing')
              .map((technique) => (
                <div
                  key={technique.key}
                  className={`group p-4 rounded-2xl border-2 transition-all duration-200 hover:border-blue-400/50 hover:shadow-xl hover:scale-[1.02] ${
                    selectedTechnique?.key === technique.key
                      ? 'border-blue-400 shadow-xl scale-[1.02] bg-blue-900/20'
                      : 'border-gray-600/50 bg-gray-800/20'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
                          selectedTechnique?.key === technique.key
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-700/50 text-gray-300 group-hover:bg-blue-600/30 group-hover:text-blue-300'
                        }`}>
                          {technique.icon}
                        </div>
                        <h3 className="font-semibold text-white group-hover:text-blue-200 text-sm leading-tight">
                          {technique.label}
                        </h3>
                      </div>
                      <button
                        onClick={() => openFocusedSession(technique)}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                        aria-label={`Start focused ${technique.label} session`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                      {technique.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.round(technique.durationSec / 60)} min
                      </span>
                      <span className="flex items-center gap-1 truncate ml-2">
                        <Activity className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{technique.pattern.split(',')[0]}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Practice Session - Only shows when technique is selected */}
          {selectedTechnique && (
            <div className="max-w-md mx-auto">
              <div className="border border-gray-700/50 rounded-2xl shadow-xl p-6">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white mb-2">
                    {selectedTechnique.label}
                  </h3>
                  <p className="text-sm text-gray-300 mb-6">
                    {selectedTechnique.pattern}
                  </p>

                  {/* Enhanced Timer Circle */}
                  <div className="relative w-40 h-40 mx-auto mb-6">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        className="text-gray-600"
                        strokeWidth="6"
                        stroke="currentColor"
                        fill="transparent"
                        r="44"
                        cx="50"
                        cy="50"
                      />
                      <circle
                        className="text-blue-400 transition-all duration-1000 ease-linear"
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
                      <span className="text-3xl font-bold text-white mb-1">
                        {formatTime(timeLeft)}
                      </span>
                      <button
                        onClick={togglePlayPause}
                        className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full flex items-center justify-center transition-colors shadow-lg"
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
                    <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-700/50 rounded-xl p-4 mb-4">
                      <p className="text-sm text-blue-300 font-medium mb-2">Current Phase</p>
                      <p className="text-lg font-bold text-blue-200 capitalize">
                        {breathPhase === 'hold2' ? 'Hold (Empty)' : breathPhase}
                      </p>
                    </div>
                  )}

                  {/* Progress Stats */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-600/50">
                      <span className="text-sm text-gray-300">Duration</span>
                      <span className="text-sm font-medium text-white">
                        {Math.round(selectedTechnique.durationSec / 60)} minutes
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-600/50">
                      <span className="text-sm text-gray-300">Progress</span>
                      <span className="text-sm font-medium text-white">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-300">Status</span>
                      <span className={`text-sm font-medium ${
                        isPlaying ? 'text-green-400' : 'text-gray-400'
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

        {/* Focused Breathing Session Modal */}
        {isModalOpen && modalTechnique && typeof window !== 'undefined' && createPortal(
          <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900/95 to-slate-900/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl">
              {/* Close Button */}
              <button
                onClick={closeFocusedSession}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center transition-colors z-10"
                aria-label="Close focused session"
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>

              {/* Technique Header */}
              <div className="text-center mb-8 pt-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {modalTechnique.icon}
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  {modalTechnique.label}
                </h2>
                <p className="text-gray-300 text-sm max-w-md mx-auto">
                  {modalTechnique.pattern}
                </p>
              </div>

              {/* Breathing Visualizations */}
              {modalTechnique.key === 'box' ? (
                <BoxBreathing 
                  isPlaying={isPlaying}
                  timeLeft={timeLeft}
                  durationSec={modalTechnique.durationSec}
                  onTogglePlay={togglePlayPause}
                />
              ) : modalTechnique.key === 'star' ? (
                <StarBreathing 
                  isPlaying={isPlaying}
                  timeLeft={timeLeft}
                  durationSec={modalTechnique.durationSec}
                  onTogglePlay={togglePlayPause}
                />
              ) : modalTechnique.key === 'lazy-eight' ? (
                <LazyEightBreathing 
                  isPlaying={isPlaying}
                  timeLeft={timeLeft}
                  durationSec={modalTechnique.durationSec}
                  onTogglePlay={togglePlayPause}
                />
              ) : modalTechnique.key === 'anxiety' ? (
                <BreatheThroughAnxiety 
                  isPlaying={isPlaying}
                  timeLeft={timeLeft}
                  durationSec={modalTechnique.durationSec}
                  onTogglePlay={togglePlayPause}
                />
              ) : modalTechnique.key === 'relaxation' ? (
                <BreatheInRelaxation 
                  isPlaying={isPlaying}
                  timeLeft={timeLeft}
                  durationSec={modalTechnique.durationSec}
                  onTogglePlay={togglePlayPause}
                />
              ) : modalTechnique.key === 'alternate-nostril' ? (
                <AlternateNostrilBreathing 
                  isPlaying={isPlaying}
                  timeLeft={timeLeft}
                  durationSec={modalTechnique.durationSec}
                  onTogglePlay={togglePlayPause}
                />
              ) : modalTechnique.key === 'belly' ? (
                <BellyBreathing 
                  isPlaying={isPlaying}
                  timeLeft={timeLeft}
                  durationSec={modalTechnique.durationSec}
                  onTogglePlay={togglePlayPause}
                />
              ) : modalTechnique.key === 'extended-exhale' ? (
                <ExtendedExhaleBreathing 
                  isPlaying={isPlaying}
                  timeLeft={timeLeft}
                  durationSec={modalTechnique.durationSec}
                  onTogglePlay={togglePlayPause}
                />
              ) : modalTechnique.key === 'deep' ? (
                <DeepBreathing 
                  isPlaying={isPlaying}
                  timeLeft={timeLeft}
                  durationSec={modalTechnique.durationSec}
                  onTogglePlay={togglePlayPause}
                />
              ) : modalTechnique.key === 'five-count' ? (
                <FiveBreathCounting 
                  isPlaying={isPlaying}
                  timeLeft={timeLeft}
                  durationSec={modalTechnique.durationSec}
                  onTogglePlay={togglePlayPause}
                />
              ) : (
                <div className="relative w-48 h-48 mx-auto mb-8">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      className="text-gray-600"
                      strokeWidth="6"
                      stroke="currentColor"
                      fill="transparent"
                      r="44"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-blue-400 transition-all duration-1000 ease-linear"
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
                    <span className="text-4xl font-bold text-white mb-2">
                      {formatTime(timeLeft)}
                    </span>
                    <button
                      onClick={togglePlayPause}
                      className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full flex items-center justify-center transition-colors shadow-lg"
                      aria-label={`${isPlaying ? 'Pause' : 'Start'} ${modalTechnique.label}`}
                    >
                      {isPlaying ? (
                        <Pause className="w-7 h-7 text-white" />
                      ) : (
                        <Play className="w-7 h-7 text-white ml-1" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Breathing Phase Indicator */}
              {modalTechnique.key === 'box' && isPlaying && (
                <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-700/50 rounded-xl p-6 mb-8 text-center">
                  <p className="text-sm text-blue-300 font-medium mb-2">Current Phase</p>
                  <p className="text-2xl font-bold text-blue-200 capitalize">
                    {breathPhase === 'hold2' ? 'Hold (Empty)' : breathPhase}
                  </p>
                </div>
              )}

              {/* Session Info */}
              <div className="text-center mt-8 pt-4">
                <div className="flex justify-center items-center text-sm text-gray-300">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {Math.round(modalTechnique.durationSec / 60)} min session
                  </span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
} 