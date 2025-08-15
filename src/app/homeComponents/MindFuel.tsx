"use client";

import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { useMindFuelSimple as useMindFuel } from '../../hooks/useDailyContentSimple';

const MindFuel = () => {
  const { data: mindFuelData, loading, error, refresh, isCached } = useMindFuel();
  const [isFading, setIsFading] = useState(false);

  // Manual refresh removed

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
            {isCached && process.env.NEXT_PUBLIC_APP_ENV === 'development' && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-400 rounded" title="Loaded from cache">
                📋
              </span>
            )}
          </h2>
          {/* Refresh removed */}
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-900/20 border border-red-500/30 rounded-md">
            <p className="text-xs text-red-400">Failed to load Mind Fuel. Please try again.</p>
          </div>
        )}

        {!mindFuelData && loading && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-yellow-400 border-t-transparent rounded-full mb-3"></div>
            <p className="text-gray-400 text-sm">Loading your daily mind fuel...</p>
          </div>
        )}

        {mindFuelData && (
          <div className={`space-y-6 transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
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