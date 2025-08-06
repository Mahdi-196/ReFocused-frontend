'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Activity, Brain, Info, RotateCcw } from 'lucide-react';
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
  const [aiSuggestions, setAiSuggestions] = useState([
    {
      id: 'books',
      title: 'Book Recommendations',
      prompt: "Recommend 3 books about mindfulness, meditation, or personal growth that would help me develop a better meditation practice and reduce daily stress.",
      icon: Brain,
      color: 'blue'
    },
    {
      id: 'affirmations',
      title: 'Daily Affirmations',
      prompt: "Create 5 personalized daily affirmations that will help me stay calm, focused, and positive throughout my day, especially during stressful moments.",
      icon: Activity,
      color: 'purple'
    },
    {
      id: 'meditation',
      title: 'Meditation Guidance',
      prompt: "Guide me through a personalized 10-minute meditation session based on my current stress level and what I'm hoping to achieve from today's practice.",
      icon: Activity,
      color: 'green'
    },
    {
      id: 'stress',
      title: 'Stress Relief',
      prompt: "Suggest 5 quick stress relief techniques I can use during work breaks, including breathing exercises and mindfulness practices under 5 minutes.",
      icon: Brain,
      color: 'orange'
    }
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const refreshAISuggestions = async () => {
    setIsRefreshing(true);
    
    try {
      const response = await fetch('/api/claude/populate-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataType: 'custom',
          customPrompt: {
            "task": "Generate 4 unique AI assistance prompts for a relaxation and mindfulness app.",
            "instructions": {
              "tone": "Calming, helpful, and wellness-focused.",
              "categories": ["Book/Resource Recommendations", "Affirmations/Mantras", "Meditation/Mindfulness Guidance", "Stress Relief/Coping Techniques"],
              "length_limit": "Each prompt must be 15-25 words maximum, similar to these examples: 'Recommend 3 books about mindfulness that help develop meditation practice and reduce daily stress' or 'Suggest 5 quick stress relief techniques for work breaks under 5 minutes'",
              "format": "Populate the 'content_payload' array with 4 different assistance prompts. Your response should only be the completed JSON object."
            },
            "content_payload": [
              {
                "title": "<2-3 word title for category 1>",
                "category": "<string for category 1>",
                "prompt": "<15-25 word prompt for category 1>",
                "color": "blue"
              },
              {
                "title": "<2-3 word title for category 2>",
                "category": "<string for category 2>",
                "prompt": "<15-25 word prompt for category 2>",
                "color": "purple"
              },
              {
                "title": "<2-3 word title for category 3>",
                "category": "<string for category 3>",
                "prompt": "<15-25 word prompt for category 3>",
                "color": "green"
              },
              {
                "title": "<2-3 word title for category 4>",
                "category": "<string for category 4>",
                "prompt": "<15-25 word prompt for category 4>",
                "color": "orange"
              }
            ]
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.content && data.content[0] && data.content[0].text) {
          const contentPayload = JSON.parse(data.content[0].text);
          if (contentPayload.content_payload && Array.isArray(contentPayload.content_payload)) {
            const newSuggestions = contentPayload.content_payload.map((item: any, index: number) => ({
              id: `suggestion-${index}`,
              title: item.title || `Suggestion ${index + 1}`,
              prompt: item.prompt || "Get personalized wellness guidance",
              icon: index % 2 === 0 ? Brain : Activity,
              color: item.color || ['blue', 'purple', 'green', 'orange'][index % 4]
            }));
            
            setAiSuggestions(newSuggestions);
          }
        }
      }
    } catch (error) {
      console.error('Failed to refresh AI suggestions:', error);
      // Keep existing suggestions on error
    } finally {
      setIsRefreshing(false);
    }
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
          <div className="flex items-center justify-between mb-6">
            <div className="text-center flex-1">
              <h2 className="text-xl font-bold text-white mb-2">AI Assistance</h2>
              <p className="text-gray-300 text-sm">Get personalized recommendations and guidance</p>
            </div>
            <button
              onClick={refreshAISuggestions}
              disabled={isRefreshing}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
            >
              {isRefreshing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Generating...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Refresh
                </>
              )}
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiSuggestions.map((suggestion) => {
              const IconComponent = suggestion.icon;
              const colorClasses = {
                blue: {
                  bg: 'from-blue-900/40 to-indigo-900/40',
                  border: 'border-blue-700/50 hover:border-blue-500/70',
                  iconBg: 'bg-blue-500/20',
                  iconColor: 'text-blue-400',
                  titleColor: 'text-blue-200 group-hover:text-blue-100',
                  textColor: 'text-blue-300/80'
                },
                purple: {
                  bg: 'from-purple-900/40 to-violet-900/40',
                  border: 'border-purple-700/50 hover:border-purple-500/70',
                  iconBg: 'bg-purple-500/20',
                  iconColor: 'text-purple-400',
                  titleColor: 'text-purple-200 group-hover:text-purple-100',
                  textColor: 'text-purple-300/80'
                },
                green: {
                  bg: 'from-green-900/40 to-emerald-900/40',
                  border: 'border-green-700/50 hover:border-green-500/70',
                  iconBg: 'bg-green-500/20',
                  iconColor: 'text-green-400',
                  titleColor: 'text-green-200 group-hover:text-green-100',
                  textColor: 'text-green-300/80'
                },
                orange: {
                  bg: 'from-orange-900/40 to-red-900/40',
                  border: 'border-orange-700/50 hover:border-orange-500/70',
                  iconBg: 'bg-orange-500/20',
                  iconColor: 'text-orange-400',
                  titleColor: 'text-orange-200 group-hover:text-orange-100',
                  textColor: 'text-orange-300/80'
                }
              };
              
              const colors = colorClasses[suggestion.color as keyof typeof colorClasses] || colorClasses.blue;
              
              return (
                <div 
                  key={suggestion.id}
                  onClick={() => handleAIPrompt(suggestion.prompt)}
                  className={`group bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 ${colors.iconBg} rounded-lg flex items-center justify-center`}>
                      <IconComponent className={`w-5 h-5 ${colors.iconColor}`} />
                    </div>
                    <h3 className={`font-semibold ${colors.titleColor}`}>{suggestion.title}</h3>
                  </div>
                  <p className={`${colors.textColor} text-sm leading-relaxed`}>
                    "{suggestion.prompt}"
                  </p>
                </div>
              );
            })}
          </div>
        </div>

{/* Pinned Mantra feature removed for optimization */}
      </div>
      </SkeletonDemo>
    </PageTransition>
  );
}
