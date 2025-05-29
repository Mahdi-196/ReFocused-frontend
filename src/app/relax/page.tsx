'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Activity, Brain, Info, Lock, Unlock } from 'lucide-react';
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

  // Load preference from localStorage on component mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(STORAGE_KEY);
      if (savedMode === 'breathing' || savedMode === 'meditation') {
        setActiveMode(savedMode as RelaxMode);
      }
    } catch (error) {
      // Silent fail - use default mode if localStorage is not available
    }
  }, []);

  // Save preference to localStorage when mode changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, activeMode);
    } catch (error) {
      // Silent fail - continue without persistence if localStorage is not available
    }
  }, [activeMode]);





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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 space-y-4">
        {/* Daily Mantra Section - Moved to Top */}
        <div className="w-full max-w-md mx-auto">
          {isMantraLocked && mantra ? (
            <div className="text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
              <p 
                className="text-lg font-bold text-purple-900 cursor-pointer hover:text-purple-700 transition-colors duration-200"
                onClick={() => setIsMantraLocked(false)}
                title="Click to edit mantra"
              >
                {mantra}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-2">
              <div className="flex items-center gap-2">
                <input
                  value={mantra}
                  onChange={(e) => {
                    if (e.target.value.length <= 250 && !isMantraLocked) {
                      setMantra(e.target.value);
                    }
                  }}
                  disabled={isMantraLocked}
                  placeholder="Enter your daily mantra..."
                  className="flex-1 px-2 py-1 border rounded text-sm border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
                  maxLength={250}
                />
                <button
                  onClick={() => {
                    if (!isMantraLocked && mantra.trim()) {
                      handleSaveMantra();
                    }
                    setIsMantraLocked(!isMantraLocked);
                  }}
                  className="p-1 rounded bg-green-100 text-green-600 hover:bg-green-200 transition-colors duration-200"
                  aria-label="Lock mantra"
                >
                  <Unlock className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Main Practice Section with Toggle */}
        <div className="w-full max-w-4xl mx-auto">
          {/* Practice Content */}
          <div className="transition-all duration-300">
            {activeMode === 'breathing' ? (
              <div className="bg-white rounded-xl shadow-sm p-8">
                {/* Toggle Switch in Top Left */}
                <div className="flex justify-start mb-6">
                  <div className="relative bg-gray-200 rounded-full p-1 flex w-64">
                    {/* Sliding Background */}
                    <div
                      className={`absolute top-1 bottom-1 w-1/2 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${
                        activeMode === ('meditation' as RelaxMode) ? 'translate-x-full' : 'translate-x-0'
                      }`}
                    />
                    
                    {/* Toggle Buttons */}
                    <button
                      onClick={() => setActiveMode('breathing')}
                      className={`relative z-10 flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium transition-all duration-200 flex-1 ${
                        activeMode === ('breathing' as RelaxMode)
                          ? 'text-blue-600'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Activity className="w-4 h-4" />
                      <span className="text-sm">Breathing</span>
                    </button>
                    <button
                      onClick={() => setActiveMode('meditation')}
                      className={`relative z-10 flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium transition-all duration-200 flex-1 ${
                        activeMode === ('meditation' as RelaxMode)
                          ? 'text-purple-600'
                          : 'text-gray-600 hover:text-gray-800'
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
                <div className="bg-white rounded-xl shadow-sm p-8">
                  {/* Toggle Switch in Top Left */}
                  <div className="flex justify-start mb-6">
                    <div className="relative bg-gray-200 rounded-full p-1 flex w-64">
                      {/* Sliding Background */}
                      <div
                        className={`absolute top-1 bottom-1 w-1/2 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${
                          activeMode === ('meditation' as RelaxMode) ? 'translate-x-full' : 'translate-x-0'
                        }`}
                      />
                      
                      {/* Toggle Buttons */}
                      <button
                        onClick={() => setActiveMode('breathing')}
                        className={`relative z-10 flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium transition-all duration-200 flex-1 ${
                          activeMode === ('breathing' as RelaxMode)
                            ? 'text-blue-600'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <Activity className="w-4 h-4" />
                        <span className="text-sm">Breathing</span>
                      </button>
                      <button
                        onClick={() => setActiveMode('meditation')}
                        className={`relative z-10 flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium transition-all duration-200 flex-1 ${
                          activeMode === ('meditation' as RelaxMode)
                            ? 'text-purple-600'
                            : 'text-gray-600 hover:text-gray-800'
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
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Guided Mindfulness Session</h3>
                    <p className="text-gray-600">Choose your session length and let your mind settle into peaceful awareness</p>
                  </div>
                
                <div className="max-w-md mx-auto">
                  <MeditationTimer
                    initialDuration={MEDITATION_DURATION}
                    onComplete={handleMeditationComplete}
                  />
                </div>

                {/* Meditation Instructions */}
                <div className="mt-8 bg-purple-50 rounded-xl p-6">
                  <button
                    onClick={() => setShowMeditationGuide(!showMeditationGuide)}
                    className="flex items-center gap-2 w-full text-left hover:text-purple-700 transition-colors duration-200"
                  >
                    <h4 className="font-semibold text-purple-900">Meditation Guide</h4>
                    <Info className="w-4 h-4 text-purple-600" />
                  </button>
                  
                  {showMeditationGuide && (
                    <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                      <ul className="space-y-2 text-sm text-purple-800">
                        <li>• Find a comfortable seated position</li>
                        <li>• Close your eyes or soften your gaze</li>
                        <li>• Focus on your natural breathing rhythm</li>
                        <li>• When thoughts arise, gently return to your breath</li>
                        <li>• Allow yourself to simply be present</li>
                      </ul>
                      
                      <div className="mt-4 pt-4 border-t border-purple-200">
                        <h5 className="font-medium text-purple-900 mb-2">Duration Tips</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-purple-700">
                          <div>
                            <span className="font-medium">Beginners (1-5 min):</span> Start small and build consistency
                          </div>
                          <div>
                            <span className="font-medium">Regular (10-20 min):</span> Develop deeper awareness
                          </div>
                          <div>
                            <span className="font-medium">Advanced (30+ min):</span> Profound contemplative states
                          </div>
                          <div>
                            <span className="font-medium">Extended (45-60 min):</span> Deep transformation practice
                          </div>
                        </div>
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
            <div className="bg-primary/10 rounded-xl p-6 text-center">
              <p className="text-xl font-medium text-primary">{pinnedMantra}</p>
            </div>
          </div>
        )}

        {/* Weekly Theme Section */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold">Weekly Theme</h2>
              <div className="flex gap-4">
                <button
                  onClick={prevTheme}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Previous theme"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600 hover:text-primary" />
                </button>
                <button
                  onClick={nextTheme}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Next theme"
                >
                  <ChevronRight className="w-6 h-6 text-gray-600 hover:text-primary" />
                </button>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-3xl font-bold mb-4 text-primary">
                {WEEKLY_THEMES[currentThemeIndex].name}
              </h3>
              <p className="text-gray-600">
                {WEEKLY_THEMES[currentThemeIndex].subtitle}
              </p>
            </div>
          </div>
        </div>




      </div>
    </div>
  );
}
