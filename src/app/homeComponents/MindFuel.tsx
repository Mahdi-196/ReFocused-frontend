"use client";

import { useState } from 'react';
import { Lightbulb, Brain, RotateCcw } from 'lucide-react';

interface MindFuelData {
  weeklyFocus: {
    focus: string;
  };
  tipOfTheDay: {
    tip: string;
  };
  productivityHack: {
    hack: string;
  };
  brainBoost: {
    word: string;
    definition: string;
  };
  mindfulnessMoment: {
    moment: string;
  };
}

const MindFuel = () => {
  const [mindFuelData, setMindFuelData] = useState<MindFuelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMindFuelData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/claude/mind-fuel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract the content from Claude's response
      if (data.content && data.content[0] && data.content[0].text) {
        const contentPayload = JSON.parse(data.content[0].text);
        
        // Handle complete response with all sections
        console.log('🧠 Mind Fuel source: Claude API (comprehensive generation)');
        console.log('🧠 Generated content:', contentPayload);
        
        if (contentPayload.weeklyFocus && contentPayload.tipOfTheDay && contentPayload.productivityHack && contentPayload.brainBoost && contentPayload.mindfulnessMoment) {
          setMindFuelData(contentPayload);
        } else {
          throw new Error('Invalid response format - missing required sections');
        }
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Mind Fuel data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section 
      className="lg:col-span-1" 
      aria-labelledby="mind-fuel"
    >
      <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 id="mind-fuel" className="flex items-center gap-2 text-xl font-semibold text-white">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Mind Fuel
          </h2>
          <button
            onClick={fetchMindFuelData}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs rounded-md transition duration-200 flex items-center gap-1"
          >
            {loading ? (
              <>
                <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></div>
                Generating...
              </>
            ) : (
              <>
                <RotateCcw className="w-3 h-3" />
                Refresh
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-900/20 border border-red-500/30 rounded-md">
            <p className="text-xs text-red-400">Error: {error}</p>
          </div>
        )}

        {!mindFuelData && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Brain className="w-10 h-10 text-purple-400 mb-3" />
            <p className="text-gray-400 text-sm mb-4">Click "Refresh" to generate Mind Fuel content</p>
          </div>
        )}

        {mindFuelData && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-sm text-gray-300">Daily Focus</span>
              </div>
              <p className="text-sm text-gray-200">
                "{mindFuelData.weeklyFocus.focus}"
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-sm text-gray-300">Tip of the Day</span>
              </div>
              <p className="text-sm text-gray-200">
                {mindFuelData.tipOfTheDay.tip}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-sm text-gray-300">Productivity Hack</span>
              </div>
              <p className="text-sm text-gray-200">
                {mindFuelData.productivityHack.hack}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-sm text-gray-300">Brain Boost</span>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1 text-white">{mindFuelData.brainBoost.word}</h4>
                <p className="text-sm text-gray-200">
                  {mindFuelData.brainBoost.definition}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-sm text-gray-300">Mindfulness Moment</span>
              </div>
              <p className="text-sm text-gray-200">
                {mindFuelData.mindfulnessMoment.moment}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default MindFuel; 