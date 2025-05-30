'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Activity, Brain, Info, Lock, Unlock } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import BreathworkExercises from '@/components/BreathworkExercises';
import MeditationTimer from '@/components/MeditationTimer';




// Constants
const STORAGE_KEY = 'relaxMode';
const DEFAULT_MODE: RelaxMode = 'breathing';
const MEDITATION_DURATION = 300; // 5 minutes in seconds


const WEEKLY_THEMES = [
  {
    name: 'Stoicism',
    subtitle: 'Ancient wisdom for modern resilience',
  },
  {
    name: 'Flow',
    subtitle: 'The psychology of optimal experience',
  },
  {
    name: 'Kaizen',
    subtitle: 'Continuous improvement through small steps',
  },
  {
    name: 'Ikigai',
    subtitle: 'Finding your reason for being',
  },
] as const;

type RelaxMode = 'breathing' | 'meditation';

export default function RelaxPage() {
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  const [mantra, setMantra] = useState('');
  const [pinnedMantra, setPinnedMantra] = useState('');
  const [activeMode, setActiveMode] = useState<RelaxMode>('breathing');
  const [showMeditationGuide, setShowMeditationGuide] = useState(false);
  const [isMantraLocked, setIsMantraLocked] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Initialize client-side rendering flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load preference from localStorage on component mount
  useEffect(() => {
    if (!isClient) return;
    
    try {
      const savedMode = localStorage.getItem(STORAGE_KEY);
      if (savedMode === 'breathing' || savedMode === 'meditation') {
        setActiveMode(savedMode as RelaxMode);
      }
    } catch (error) {
      // Silent fail - use default mode if localStorage is not available
    }
  }, [isClient]);

  // Save preference to localStorage when mode changes
  useEffect(() => {
    if (!isClient) return;
    
    try {
      localStorage.setItem(STORAGE_KEY, activeMode);
    } catch (error) {
      // Silent fail - continue without persistence if localStorage is not available
    }
  }, [activeMode, isClient]);





  const handleSaveMantra = () => {
    setPinnedMantra(mantra);
    // Future: Implement actual save functionality
    // Could save to localStorage, database, or external service
  };

  const nextTheme = () => {
    setCurrentThemeIndex((prev) => (prev + 1) % WEEKLY_THEMES.length);
  };

  const prevTheme = () => {
    setCurrentThemeIndex((prev) => (prev - 1 + WEEKLY_THEMES.length) % WEEKLY_THEMES.length);
  };

  const handleMeditationComplete = () => {
    // Future: Implement completion tracking
    // Could track meditation sessions, update streaks, etc.
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 px-4 py-8">
        {/* Theme Header */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold text-white">Weekly Theme</h2>
              <div className="flex gap-4">
                <button
                  onClick={prevTheme}
                  className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                  aria-label="Previous theme"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-300 hover:text-white" />
                </button>
                <button
                  onClick={nextTheme}
                  className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                  aria-label="Next theme"
                >
                  <ChevronRight className="w-6 h-6 text-gray-300 hover:text-white" />
                </button>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
                {WEEKLY_THEMES[currentThemeIndex].name}
              </h3>
              <p className="text-gray-300">
                {WEEKLY_THEMES[currentThemeIndex].subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Main Practice Section with Toggle */}
        <div className="w-full max-w-4xl mx-auto">
          {/* Practice Content */}
          <div className="transition-all duration-300">
            {activeMode === 'breathing' ? (
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
                {/* Toggle Switch in Top Left */}
                <div className="flex justify-start mb-6">
                  <div className="relative bg-gray-700/50 rounded-full p-1 flex w-64">
                    {/* Sliding Background */}
                    <div
                      className={`absolute top-1 bottom-1 w-1/2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-md transition-transform duration-300 ease-in-out ${
                        activeMode === ('meditation' as RelaxMode) ? 'translate-x-full' : 'translate-x-0'
                      }`}
                    />
                    
                    {/* Toggle Buttons */}
                    <button
                      onClick={() => setActiveMode('breathing')}
                      className={`relative z-10 flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium transition-all duration-200 flex-1 ${
                        activeMode === ('breathing' as RelaxMode)
                          ? 'text-white'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <Activity className="w-4 h-4" />
                      <span className="text-sm">Breathing</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveMode('meditation')}
                      className={`relative z-10 flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium transition-all duration-200 flex-1 ${
                        activeMode === ('meditation' as RelaxMode)
                          ? 'text-white'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <Brain className="w-4 h-4" />
                      <span className="text-sm">Meditation</span>
                    </button>
                  </div>
                </div>
                <BreathworkExercises />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
                {/* Toggle Switch in Top Left */}
                <div className="flex justify-start mb-6">
                  <div className="relative bg-gray-700/50 rounded-full p-1 flex w-64">
                    {/* Sliding Background */}
                    <div
                      className={`absolute top-1 bottom-1 w-1/2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-md transition-transform duration-300 ease-in-out ${
                        activeMode === ('meditation' as RelaxMode) ? 'translate-x-full' : 'translate-x-0'
                      }`}
                    />
                    
                    {/* Toggle Buttons */}
                    <button
                      onClick={() => setActiveMode('breathing')}
                      className={`relative z-10 flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium transition-all duration-200 flex-1 ${
                        activeMode === ('breathing' as RelaxMode)
                          ? 'text-white'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <Activity className="w-4 h-4" />
                      <span className="text-sm">Breathing</span>
                    </button>
                    <button
                      onClick={() => setActiveMode('meditation')}
                      className={`relative z-10 flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium transition-all duration-200 flex-1 ${
                        activeMode === ('meditation' as RelaxMode)
                          ? 'text-white'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <Brain className="w-4 h-4" />
                      <span className="text-sm">Meditation</span>
                    </button>
                  </div>
                </div>
                
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Guided Mindfulness Session</h3>
                  <p className="text-gray-300">Choose your session length and let your mind settle into peaceful awareness</p>
                </div>
              
              <div className="max-w-md mx-auto">
                <MeditationTimer
                  initialDuration={MEDITATION_DURATION}
                  onComplete={handleMeditationComplete}
                />
              </div>

              {/* Meditation Instructions */}
              <div className="mt-8 p-6 bg-gradient-to-br from-purple-900/60 to-violet-900/60 border border-purple-700/50 rounded-lg backdrop-blur-sm">
                <button
                  onClick={() => setShowMeditationGuide(!showMeditationGuide)}
                  className="flex items-center gap-2 w-full text-left hover:text-purple-300 transition-colors duration-200"
                >
                  <h4 className="font-semibold text-purple-200">Meditation Guide</h4>
                  <Info className="w-4 h-4 text-purple-400" />
                </button>
                
                {showMeditationGuide && (
                  <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                    <ul className="space-y-2 text-sm text-purple-200">
                      <li>• Find a comfortable seated position</li>
                      <li>• Close your eyes or soften your gaze</li>
                      <li>• Focus on your natural breathing rhythm</li>
                      <li>• When thoughts arise, gently return to your breath</li>
                      <li>• Allow yourself to simply be present</li>
                    </ul>
                    
                    <div className="mt-4 p-3 bg-purple-800/40 border border-purple-600/50 rounded-md">
                      <p className="text-sm text-purple-200">
                        🧘‍♀️ <strong>Tip:</strong> Start with shorter sessions and gradually increase the duration as you build your practice.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Pinned Mantra */}
        {pinnedMantra && (
          <div className="w-full max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-blue-900/60 to-purple-900/60 border border-blue-700/50 backdrop-blur-sm rounded-xl p-6 text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-400">
              <p className="text-xl font-medium bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">{pinnedMantra}</p>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
