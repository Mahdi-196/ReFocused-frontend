import React from "react";
import type { MoodEntry } from "@/services/moodService";

interface MoodDisplayProps {
  moodEntry?: MoodEntry | null;
}

export default function MoodDisplay({ moodEntry }: MoodDisplayProps) {
  // Show empty state when no mood data
  if (!moodEntry) {
    return (
      <div className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className="text-3xl font-light text-gray-500 mb-2">
            -<span className="text-gray-400">/10</span>
          </div>
          <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gray-600 transition-all duration-500" style={{ width: "0%" }} />
          </div>
        </div>

        {/* Mood Metrics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Happiness</span>
            <div className="flex items-center gap-3">
              <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gray-600 transition-all duration-300" style={{ width: "0%" }} />
              </div>
              <span className="text-gray-500 text-sm w-8">-/5</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-300">Focus</span>
            <div className="flex items-center gap-3">
              <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gray-600 transition-all duration-300" style={{ width: "0%" }} />
              </div>
              <span className="text-gray-500 text-sm w-8">-/5</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-300">Stress</span>
            <div className="flex items-center gap-3">
              <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gray-600 transition-all duration-300" style={{ width: "0%" }} />
              </div>
              <span className="text-gray-500 text-sm w-8">-/5</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate overall mood score from happiness, focus, and stress
  const calculateMoodScore = (
    happiness: number,
    focus: number,
    stress: number
  ) => {
    // Convert to 0-10 scale: (happiness + focus + (6-stress)) / 3 * 2
    // Stress is inverted (higher stress = lower score)
    const invertedStress = 6 - stress; // Convert 1-5 stress to 5-1 scale
    return ((happiness + focus + invertedStress) / 3) * 2;
  };

  const getMoodBadgeColor = (
    rating: number,
    type: "happiness" | "focus" | "stress" = "happiness"
  ) => {
    if (type === "stress") {
      // For stress, lower is better, so invert the color logic
      if (rating <= 1) return "bg-green-500";
      if (rating <= 2) return "bg-yellow-400";
      if (rating <= 3) return "bg-orange-500";
      return "bg-red-500";
    } else {
      // For happiness and focus, higher is better
      if (rating >= 5) return "bg-green-500";
      if (rating >= 4) return "bg-yellow-400";
      if (rating >= 3) return "bg-orange-500";
      if (rating >= 2) return "bg-red-400";
      return "bg-red-500";
    }
  };

  const getRatingBarColor = (rating: number) => {
    if (rating >= 9) return "bg-green-500";
    if (rating >= 7) return "bg-green-500";
    if (rating >= 5) return "bg-yellow-400";
    if (rating >= 3) return "bg-orange-500";
    return "bg-red-500";
  };

  const overallScore = calculateMoodScore(
    moodEntry.happiness || 0,
    moodEntry.focus || 0,
    moodEntry.stress || 0
  );

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="text-center">
        <div className="text-3xl font-light text-white mb-2">
          {Math.round(overallScore * 10) / 10}
          <span className="text-gray-400">/10</span>
        </div>
        <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${getRatingBarColor(
              overallScore
            )}`}
            style={{
              width: `${(overallScore / 10) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Mood Metrics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Happiness</span>
          <div className="flex items-center gap-3">
            <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getMoodBadgeColor(
                  moodEntry.happiness || 0,
                  "happiness"
                )}`}
                style={{
                  width: `${((moodEntry.happiness || 0) / 5) * 100}%`,
                }}
              />
            </div>
            <span className="text-white text-sm w-8">
              {moodEntry.happiness || 0}/5
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-300">Focus</span>
          <div className="flex items-center gap-3">
            <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getMoodBadgeColor(
                  moodEntry.focus || 0,
                  "focus"
                )}`}
                style={{
                  width: `${((moodEntry.focus || 0) / 5) * 100}%`,
                }}
              />
            </div>
            <span className="text-white text-sm w-8">
              {moodEntry.focus || 0}/5
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-300">Stress</span>
          <div className="flex items-center gap-3">
            <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getMoodBadgeColor(
                  moodEntry.stress || 0,
                  "stress"
                )}`}
                style={{
                  width: `${((moodEntry.stress || 0) / 5) * 100}%`,
                }}
              />
            </div>
            <span className="text-white text-sm w-8">
              {moodEntry.stress || 0}/5
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 