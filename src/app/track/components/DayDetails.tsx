import React from "react";
import { UserHabit, DailyCalendarEntry } from "../types";
import MoodDisplay from "./MoodDisplay";
import HabitsDisplay from "./HabitsDisplay";
import GoalsActivityDisplay from "./GoalsActivityDisplay";
import { useTime } from "@/contexts/TimeContext";

interface DayDetailsProps {
  selectedDate: string | null;
  calendarData: DailyCalendarEntry | null;
  isDateReadOnly: (dateStr: string) => boolean;
  getHabitsForDate: (dateStr: string) => Array<{
    habit: UserHabit;
    completed: boolean;
    wasActive: boolean;
  }>;
  onToggleHabit: (dateStr: string, habitId: string, completed: boolean) => void;
}

export default function DayDetails({
  selectedDate,
  calendarData,
  isDateReadOnly,
  getHabitsForDate,
  onToggleHabit,
}: DayDetailsProps) {
  const { getCurrentDate } = useTime();
  
  if (!selectedDate) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-400 py-8">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm">Click a date to view details</p>
        </div>
      </div>
    );
  }

  // Check if selected date is today or future using the time service
  const today = getCurrentDate();
  const isToday = selectedDate === today;
  const isFuture = selectedDate > today;

  // Show motivational message for today
  if (isToday) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500/30 to-blue-600/40 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Keep Pushing Today!
            </h3>
          </div>

          <div className="bg-gradient-to-r from-blue-500/20 to-gray-500/20 rounded-lg p-4 border border-blue-500/30">
            <p className="text-white font-medium mb-2">
              Focus on today's goals:
            </p>
            <div className="text-left space-y-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <span className="text-green-400">•</span>
                <span>Track your mood</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">•</span>
                <span>Complete your habits</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400">•</span>
                <span>Stay consistent</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Check back tomorrow to see today's progress!
          </p>
        </div>
      </div>
    );
  }

  // Show message for future dates
  if (isFuture) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-400 py-8">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm">Future date selected</p>
          <p className="text-xs text-gray-500 mt-2">
            Data will be available after this date passes
          </p>
        </div>
      </div>
    );
  }

  if (!calendarData) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-400 py-8">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm">No data available for this date</p>
          <p className="text-xs text-gray-500 mt-2">
            Track your mood to see data here
          </p>
        </div>
      </div>
    );
  }

  const habitsForDate = getHabitsForDate(selectedDate);
  const goalActivities = calendarData.goalActivities || [];

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Mood Data */}
        <MoodDisplay moodEntry={calendarData.moodEntry ? {
          ...calendarData.moodEntry,
          date: selectedDate,
          happiness: calendarData.moodEntry.happiness || 0,
          focus: calendarData.moodEntry.focus || 0,
          stress: calendarData.moodEntry.stress || 0
        } : null} />

        {/* Habits Section */}
        <HabitsDisplay
          habitsForDate={habitsForDate}
          selectedDate={selectedDate}
          isDateReadOnly={isDateReadOnly}
          onToggleHabit={onToggleHabit}
        />

        {/* Goals Activity Section */}
        <GoalsActivityDisplay goalActivities={goalActivities} />
      </div>
    </div>
  );
} 