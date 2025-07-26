'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Activity, Brain, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PageTransition from '@/components/PageTransition';
import BreathworkExercises from '@/components/BreathworkExercises';
import MeditationTimer from '@/components/MeditationTimer';
import AmbientSounds from '@/components/AmbientSounds';
import { RelaxPageSkeleton, SkeletonDemo } from '@/components/skeletons';




// Constants
const STORAGE_KEY = 'relaxMode';
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
  const router = useRouter();
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  const [activeMode, setActiveMode] = useState<RelaxMode>('breathing');
  const [showMeditationGuide, setShowMeditationGuide] = useState(false);
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
    } catch {
      // Silent fail - use default mode if localStorage is not available
    }
  }, [isClient]);

  // Save preference to localStorage when mode changes
  useEffect(() => {
    if (!isClient) return;
    
    try {
      localStorage.setItem(STORAGE_KEY, activeMode);
    } catch {
      // Silent fail - continue without persistence if localStorage is not available
    }
  }, [activeMode, isClient]);





  // Removed unused handleSaveMantra function

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

  const handleAIPrompt = (message: string) => {
    // Navigate to AI page with the message as a URL parameter
    const encodedMessage = encodeURIComponent(message);
    router.push(`/ai?message=${encodedMessage}`);
  };

  return (
    <PageTransition>
      <SkeletonDemo
        skeleton={<RelaxPageSkeleton />}
        delay={100} // Minimal delay for smooth transition
        enabled={false} // Disable forced demo mode
      >
        <div className="min-h-screen px-2 py-8">
        {/* Theme Header */}
        {/* <div className="w-full max-w-2xl mx-auto">
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
        </div> */}

        {/* Main Practice Section with Toggle */}
        <div className="w-[70vw] max-w-none mx-auto mb-8">
          {/* Practice Content */}
          <div className="transition-all duration-300">
            {activeMode === 'breathing' ? (
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-5 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
                {/* Toggle Switch in Top Left */}
                <div className="flex justify-start mb-4">
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
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-5 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
                {/* Toggle Switch in Top Left */}
                <div className="flex justify-start mb-4">
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
                
                <div className="text-center mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Guided Mindfulness Session</h3>
                  <p className="text-gray-300 text-sm">Choose your session length and let your mind settle into peaceful awareness</p>
                </div>
              
              <div className="max-w-md mx-auto mb-4">
                <MeditationTimer
                  initialDuration={MEDITATION_DURATION}
                  onComplete={handleMeditationComplete}
                />
              </div>

              {/* Meditation Instructions */}
              <div className="mt-5 p-4 bg-gradient-to-br from-purple-900/60 to-violet-900/60 border border-purple-700/50 rounded-lg backdrop-blur-sm">
                <button
                  onClick={() => setShowMeditationGuide(!showMeditationGuide)}
                  className="flex items-center gap-2 w-full text-left hover:text-purple-300 transition-colors duration-200"
                >
                  <h4 className="font-semibold text-purple-200">Meditation Guide</h4>
                  <Info className="w-4 h-4 text-purple-400" />
                </button>
                
                                  {showMeditationGuide && (
                    <div className="mt-3 animate-in slide-in-from-top-2 duration-300">
                      <ul className="space-y-1 text-sm text-purple-200">
                        <li>• Find a comfortable seated position</li>
                        <li>• Close your eyes or soften your gaze</li>
                        <li>• Focus on your natural breathing rhythm</li>
                        <li>• When thoughts arise, gently return to your breath</li>
                        <li>• Allow yourself to simply be present</li>
                      </ul>
                      
                      <div className="mt-3 p-2 bg-purple-800/40 border border-purple-600/50 rounded-md">
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

        {/* Ambient Sounds & Weekly Theme Side by Side */}
        <div className="w-full max-w-6xl mx-auto py-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Ambient Sounds Section - Left & Bigger */}
            <div className="flex-2 lg:w-[65%]">
              <AmbientSounds />
            </div>

            {/* Weekly Theme - Right & Smaller */}
            <div className="flex-1 lg:w-[35%]">
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Weekly Theme</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={prevTheme}
                      className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                      aria-label="Previous theme"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-300 hover:text-white" />
                    </button>
                    <button
                      onClick={nextTheme}
                      className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                      aria-label="Next theme"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-300 hover:text-white" />
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
                    {WEEKLY_THEMES[currentThemeIndex].name}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {WEEKLY_THEMES[currentThemeIndex].subtitle}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Prompt Boxes */}
        <div className="w-full max-w-7xl mx-auto mb-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-2">AI Assistance</h2>
            <p className="text-gray-300 text-sm">Get personalized recommendations and guidance</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Book Recommendations */}
            <div 
              onClick={() => handleAIPrompt("Recommend 3 books about mindfulness, meditation, or personal growth that would help me develop a better meditation practice and reduce daily stress.")}
              className="group bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-700/50 rounded-xl p-4 hover:border-blue-500/70 hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-blue-200 group-hover:text-blue-100">Book Recommendations</h3>
              </div>
              <p className="text-blue-300/80 text-sm leading-relaxed">
                "Recommend 3 books about mindfulness, meditation, or personal growth that would help me develop a better meditation practice and reduce daily stress."
              </p>
            </div>

            {/* Daily Affirmations */}
            <div 
              onClick={() => handleAIPrompt("Create 5 personalized daily affirmations that will help me stay calm, focused, and positive throughout my day, especially during stressful moments.")}
              className="group bg-gradient-to-br from-purple-900/40 to-violet-900/40 border border-purple-700/50 rounded-xl p-4 hover:border-purple-500/70 hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-semibold text-purple-200 group-hover:text-purple-100">Daily Affirmations</h3>
              </div>
              <p className="text-purple-300/80 text-sm leading-relaxed">
                "Create 5 personalized daily affirmations that will help me stay calm, focused, and positive throughout my day, especially during stressful moments."
              </p>
            </div>

            {/* Meditation Guidance */}
            <div 
              onClick={() => handleAIPrompt("Guide me through a personalized 10-minute meditation session based on my current stress level and what I'm hoping to achieve from today's practice.")}
              className="group bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-700/50 rounded-xl p-4 hover:border-green-500/70 hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="font-semibold text-green-200 group-hover:text-green-100">Meditation Guidance</h3>
              </div>
              <p className="text-green-300/80 text-sm leading-relaxed">
                "Guide me through a personalized 10-minute meditation session based on my current stress level and what I'm hoping to achieve from today's practice."
              </p>
            </div>

            {/* Stress Relief Tips */}
            <div 
              onClick={() => handleAIPrompt("Suggest 5 quick stress relief techniques I can use during work breaks, including breathing exercises and mindfulness practices under 5 minutes.")}
              className="group bg-gradient-to-br from-orange-900/40 to-red-900/40 border border-orange-700/50 rounded-xl p-4 hover:border-orange-500/70 hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="font-semibold text-orange-200 group-hover:text-orange-100">Stress Relief</h3>
              </div>
              <p className="text-orange-300/80 text-sm leading-relaxed">
                "Suggest 5 quick stress relief techniques I can use during work breaks, including breathing exercises and mindfulness practices under 5 minutes."
              </p>
            </div>
          </div>
        </div>

{/* Pinned Mantra feature removed for optimization */}
      </div>
      </SkeletonDemo>
    </PageTransition>
  );
}
