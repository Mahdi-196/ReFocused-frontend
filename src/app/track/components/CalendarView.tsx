import React, { useState, useRef, useMemo, useCallback } from "react";
import { UserHabit, DailyCalendarEntry } from "../types";
import type { MoodEntry } from "@/services/moodService";
import { useCurrentDate } from "@/contexts/TimeContext";
import { TbXboxX } from "react-icons/tb";
import CalendarHeader from "./CalendarHeader";
import CalendarGrid from "./CalendarGrid";
import DayDetails from "./DayDetails";

interface CalendarViewProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  habits: UserHabit[];
  calendarEntries: { [key: string]: DailyCalendarEntry };
  loading: boolean;
  error: string | null;
  onToggleHabit: (dateStr: string, habitId: string, completed: boolean) => void;
  isHabitCompleted: (habitId: number, date?: string) => boolean;
}

export default function CalendarView({
  currentMonth,
  setCurrentMonth,
  habits,
  calendarEntries,
  loading,
  error,
  onToggleHabit,
  isHabitCompleted,
}: CalendarViewProps) {
  const currentDate = useCurrentDate();
  const [selectedDate, setSelectedDate] = useState<string | null>(currentDate);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Helper functions moved from hook
  const getCalendarEntryForDate = (date: string): DailyCalendarEntry | null => {
    return calendarEntries[date] || null;
  };

  const isDateReadOnly = (date: string): boolean => {
    const today = currentDate;
    return date < today;
  };

  const getHabitsForDate = (date: string): Array<{ habit: UserHabit; completed: boolean; wasActive: boolean }> => {
    const entry = calendarEntries[date];
    if (!entry) {
      return habits.map(habit => ({
        habit,
        completed: false,
        wasActive: habit.isActive !== false
      }));
    }

    return entry.habitCompletions.map(hc => {
      const currentHabit = habits.find(h => h.id === hc.habitId);
      return {
        habit: currentHabit || {
          id: hc.habitId,
          name: hc.habitName,
          streak: 0,
          isFavorite: false,
          createdAt: new Date(),
          isActive: hc.wasActiveOnDate
        },
        completed: hc.completed,
        wasActive: hc.wasActiveOnDate
      };
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCurrentMonth(
          new Date(currentMonth.setMonth(currentMonth.getMonth() + 1))
        );
      } else {
        setCurrentMonth(
          new Date(currentMonth.setMonth(currentMonth.getMonth() - 1))
        );
      }
    }
    setTouchStart(null);
  };

  // Add timestamp display
  const timestamp = new Date().toLocaleString();

  // Loading state
  if (loading) {
    return (
      <section className="mb-8">
        <div
          className="rounded-lg shadow-md overflow-hidden max-w-7xl mx-auto"
          style={{
            background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)",
          }}
        >
          <h2 className="text-xl text-white px-6 py-4 border-b border-gray-600">
            Calendar Overview
          </h2>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#42b9e5] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-300">Loading calendar data...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-8">
        <div
          className="rounded-lg shadow-md overflow-hidden max-w-7xl mx-auto"
          style={{
            background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)",
          }}
        >
          <h2 className="text-xl text-white px-6 py-4 border-b border-gray-600">
            Calendar Overview
          </h2>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-red-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-red-300">Error loading calendar data: {error}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div
        className="rounded-lg shadow-md overflow-hidden max-w-7xl mx-auto"
        style={{
          background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)",
        }}
      >
        <h2 className="text-xl text-white px-6 py-4 border-b border-gray-600">
          Calendar{" "}
        </h2>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 bg-red-900/50 border border-red-600 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-red-400 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-200">{error}</p>
            </div>
          </div>
        )}
        

        
        <div className="flex flex-col lg:flex-row">
          {/* Calendar Section */}
          <div className="flex-1" ref={calendarRef}>
            <CalendarHeader
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
            />
            <div className="flex flex-col lg:grid lg:grid-cols-[70%_30%] gap-0 lg:items-start">
              <div>
                <CalendarGrid
                  currentMonth={currentMonth}
                  selectedDate={selectedDate}
                  calendarEntries={Object.values(calendarEntries)}
                  onDateClick={setSelectedDate}
                  isDateReadOnly={isDateReadOnly}
                  getCalendarEntryForDate={getCalendarEntryForDate}
                  touchStart={touchStart}
                  setTouchStart={setTouchStart}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                />
              </div>
              
              {/* Day Details Section - Responsive */}
              <div className="border-t lg:border-t-0 lg:border-l border-gray-600 overflow-y-auto custom-scrollbar max-h-[400px] lg:max-h-[580px]">
                <DayDetails
                  selectedDate={selectedDate}
                  calendarData={selectedDate ? getCalendarEntryForDate(selectedDate) : null}
                  isDateReadOnly={isDateReadOnly}
                  getHabitsForDate={getHabitsForDate}
                  onToggleHabit={onToggleHabit}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.8);
        }
      `}</style>
    </section>
  );
}
