'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Activity, Brain } from 'lucide-react';
import BreathworkExercises from '@/components/BreathworkExercises';
import MeditationTimer from '@/components/MeditationTimer';
import GratitudeList from '@/components/GratitudeList';
import MantraInput from '@/components/MantraInput';
import QuoteOfTheDay from '@/components/QuoteOfTheDay';

// Constants
const STORAGE_KEY = 'relaxMode';
const DEFAULT_MODE = 'breathing';
const MEDITATION_DURATION = 300; // 5 minutes in seconds
const INITIAL_GRATITUDES = ['', '', ''];

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
  const [gratitudes, setGratitudes] = useState<string[]>(INITIAL_GRATITUDES);
  const [mantra, setMantra] = useState('');
  const [pinnedMantra, setPinnedMantra] = useState('');
  const [activeMode, setActiveMode] = useState<RelaxMode>(DEFAULT_MODE);

  // Load preference from localStorage on component mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(STORAGE_KEY) as RelaxMode;
      if (savedMode && (savedMode === 'breathing' || savedMode === 'meditation')) {
        setActiveMode(savedMode);
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

  const handleGratitudeChange = (index: number, text: string) => {
    const newGratitudes = [...gratitudes];
    newGratitudes[index] = text;
    setGratitudes(newGratitudes);
  };

  const handleSaveGratitudes = () => {
    // Future: Implement actual save functionality
    // Could save to localStorage, database, or external service
  };

  const handleMantraChange = (text: string) => {
    setMantra(text);
  };

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
      <div className="container mx-auto px-4 space-y-12">
        {/* Main Practice Section with Toggle */}
        <div className="w-full max-w-4xl mx-auto">
          {/* Toggle Switch Header */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-center mb-6">
              <div className="relative bg-gray-100 rounded-xl p-1 flex">
                <button
                  onClick={() => setActiveMode('breathing')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeMode === 'breathing'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Activity className="w-5 h-5" />
                  Breathing Exercises
                </button>
                <button
                  onClick={() => setActiveMode('meditation')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeMode === 'meditation'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Brain className="w-5 h-5" />
                  Guided Meditation
                </button>
              </div>
            </div>

            {/* Mode Description */}
            <div className="text-center">
              {activeMode === 'breathing' ? (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Mindful Breathing</h2>
                  <p className="text-gray-600">Focus on your breath and find inner peace through guided breathing techniques</p>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Guided Meditation</h2>
                  <p className="text-gray-600">Immerse yourself in mindful meditation to cultivate awareness and tranquility</p>
                </div>
              )}
            </div>
          </div>

          {/* Practice Content */}
          <div className="transition-all duration-300">
            {activeMode === 'breathing' ? (
              <BreathworkExercises />
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">5-Minute Mindfulness Session</h3>
                  <p className="text-gray-600">Find a comfortable position and let your mind settle into peaceful awareness</p>
                </div>
                
                <div className="max-w-md mx-auto">
                  <MeditationTimer
                    durationSec={MEDITATION_DURATION}
                    onComplete={handleMeditationComplete}
                  />
                </div>

                {/* Meditation Instructions */}
                <div className="mt-8 bg-purple-50 rounded-xl p-6">
                  <h4 className="font-semibold text-purple-900 mb-3">Meditation Guide</h4>
                  <ul className="space-y-2 text-sm text-purple-800">
                    <li>• Find a comfortable seated position</li>
                    <li>• Close your eyes or soften your gaze</li>
                    <li>• Focus on your natural breathing rhythm</li>
                    <li>• When thoughts arise, gently return to your breath</li>
                    <li>• Allow yourself to simply be present</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quote of the Day */}
        <div className="w-full max-w-2xl mx-auto">
          <QuoteOfTheDay resetIntervalHours={24} />
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

        {/* Mantra Input Section */}
        <div className="w-full max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Daily Mantra</h2>
          <MantraInput
            mantra={mantra}
            onChange={handleMantraChange}
            onSave={handleSaveMantra}
          />
        </div>

        {/* Gratitude List Section */}
        <div className="w-full max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Daily Gratitude</h2>
          <GratitudeList
            entries={gratitudes}
            onChange={handleGratitudeChange}
            onSave={handleSaveGratitudes}
          />
        </div>
      </div>
    </div>
  );
}
