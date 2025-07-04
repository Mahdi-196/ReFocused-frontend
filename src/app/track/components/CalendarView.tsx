import React, { useState, useRef, useMemo, useCallback } from 'react';
import { UserHabit, DailyCalendarEntry } from '../types';
import type { MoodEntry } from '@/services/moodService';
import { useCalendarData } from '../hooks/useCalendarData';
import { useCurrentDate } from '@/contexts/TimeContext';
import { CheckIcon } from '@/components/icons';

interface CalendarViewProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  habits: UserHabit[];
}

export default function CalendarView({
  currentMonth,
  setCurrentMonth,
  habits
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const currentDate = useCurrentDate();
  
  const {
    calendarEntries,
    loading,
    error,
    toggleHabitCompletion,
    saveMoodData,
    getCalendarEntryForDate,
    isDateReadOnly,
    getHabitCompletionForDate,
    getHabitsForDate
  } = useCalendarData(currentMonth, habits);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)));
      } else {
        setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)));
      }
    }
    setTouchStart(null);
  };

  // Calculate overall mood score from happiness, focus, and stress
  const calculateMoodScore = (happiness: number, focus: number, stress: number) => {
    // Convert to 0-10 scale: (happiness + focus + (6-stress)) / 3 * 2
    // Stress is inverted (higher stress = lower score)
    const invertedStress = 6 - stress; // Convert 1-5 stress to 5-1 scale
    return ((happiness + focus + invertedStress) / 3) * 2;
  };

  const getDayClass = (dateStr: string) => {
    // Check for calendar entry with mood data
    const calendarEntry = getCalendarEntryForDate(dateStr);
    if (calendarEntry?.moodEntry) {
      const { happiness, focus, stress } = calendarEntry.moodEntry;
      const moodScore = calculateMoodScore(happiness, focus, stress);
      if (moodScore >= 7) return 'mood-good';
      if (moodScore >= 5) return 'mood-neutral';
      return 'mood-poor';
    }
    
    // Check if there's habit activity on this day
    if (calendarEntry?.habitCompletions.some(hc => hc.completed)) {
      return 'has-activity';
    }
    
    return '';
  };

  const getMoodBadgeColor = (rating: number, type: 'happiness' | 'focus' | 'stress' = 'happiness') => {
    if (type === 'stress') {
      // For stress, lower is better, so invert the color logic
      if (rating <= 1) return 'bg-green-500';
      if (rating <= 2) return 'bg-yellow-400';
      if (rating <= 3) return 'bg-orange-500';
      return 'bg-red-500';
    } else {
      // For happiness and focus, higher is better
      if (rating >= 5) return 'bg-green-500';
      if (rating >= 4) return 'bg-yellow-400';
      if (rating >= 3) return 'bg-orange-500';
      if (rating >= 2) return 'bg-red-400';
      return 'bg-red-500';
    }
  };

  const getRatingBarColor = (rating: number) => {
    if (rating >= 9) return 'bg-green-500';
    if (rating >= 7) return 'bg-green-500';
    if (rating >= 5) return 'bg-yellow-400';
    if (rating >= 3) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const renderCalendar = () => {
    const firstDay = new Date(currentMonth);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const days = [];
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    days.push(
      <div key="weekdays" className="grid grid-cols-7 gap-1.5 mb-1.5">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
            {day}
          </div>
        ))}
      </div>
    );

    const firstDayOfWeek = firstDay.getDay();
    const previousMonth = new Date(firstDay);
    previousMonth.setDate(0);
    const daysInPreviousMonth = previousMonth.getDate();

    const dateRows = [];
    let currentRow = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      const date = daysInPreviousMonth - firstDayOfWeek + i + 1;
      currentRow.push(
        <div key={`prev-${date}`} className="aspect-square flex items-center justify-center text-gray-500 bg-gray-800 rounded text-xs">
          {date}
        </div>
      );
    }

    for (let date = 1; date <= lastDay.getDate(); date++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      const dayClass = getDayClass(dateStr);
      const calendarEntry = getCalendarEntryForDate(dateStr);
      const isReadOnly = isDateReadOnly(dateStr);
      
      // Get styling based on mood and activity
      const getMoodStyling = () => {
        if (selectedDate === dateStr) {
          return {
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
            border: '1px solid #3b82f6'
          };
        }
        
        switch (dayClass) {
          case 'mood-good':
            return {
              background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              border: '1px solid #10b981'
            };
          case 'mood-neutral':
            return {
              background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 50%, #a16207 100%)',
              boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              border: '1px solid #eab308'
            };
          case 'mood-poor':
            return {
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              border: '1px solid #ef4444'
            };
          case 'has-activity':
            return {
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              border: '1px solid #8b5cf6'
            };
          default:
            return {
              background: 'linear-gradient(135deg, #4b5563 0%, #374151 50%, #1f2937 100%)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              border: '1px solid #4b5563'
            };
        }
      };
      
      // Check if this is today
      const today = new Date().toISOString().split('T')[0];
      const isToday = dateStr === today;
      
      // Get habit completion stats for this day
      const habitsOnDate = calendarEntry?.habitCompletions || [];
      const completedHabits = habitsOnDate.filter(hc => hc.completed).length;
      const totalHabits = habitsOnDate.length;
      
      currentRow.push(
        <div
          key={date}
          className={`aspect-square flex flex-col items-center justify-center rounded transition-all text-xs text-white relative cursor-pointer ${
            isReadOnly ? 'opacity-80' : ''
          }`}
          onClick={() => setSelectedDate(dateStr)}
          style={getMoodStyling()}
        >

          
          {/* Gloss effect */}
          <div className="absolute inset-0 rounded opacity-20 pointer-events-none"
               style={{
                 background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)'
               }}
          />
          
          {/* Date number */}
          <span className="relative z-10 font-medium">{date}</span>
          

        </div>
      );

      if (currentRow.length === 7) {
        dateRows.push(
          <div key={`row-${dateRows.length}`} className="grid grid-cols-7 gap-1.5">
            {currentRow}
          </div>
        );
        currentRow = [];
      }
    }

    const remainingCells = 7 - currentRow.length;
    if (remainingCells < 7) {
      for (let i = 1; i <= remainingCells; i++) {
        currentRow.push(
          <div key={`next-${i}`} className="aspect-square flex items-center justify-center text-gray-500 bg-gray-800 rounded text-xs">
            {i}
          </div>
        );
      }
      dateRows.push(
        <div key={`row-${dateRows.length}`} className="grid grid-cols-7 gap-1.5">
          {currentRow}
        </div>
      );
    }

    return (
      <div className="p-6">
        {days}
        {dateRows}
      </div>
    );
  };

  const renderDayDetails = () => {
    if (!selectedDate) {
      return (
        <div className="p-6">
          <div className="text-center text-gray-400 py-8">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Click a date to view details</p>
          </div>
        </div>
      );
    }

    // Check if selected date is today or future
    const today = new Date().toISOString().split('T')[0];
    const isToday = selectedDate === today;
    const isFuture = selectedDate > today;

    // Show motivational message for today
    if (isToday) {
      return (
        <div className="p-6">
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Keep Pushing Today!</h3>
              <p className="text-gray-300 text-sm mb-4">Today is your chance to make progress</p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-500/30">
              <p className="text-white font-medium mb-2">Focus on today's goals:</p>
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
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">Future date selected</p>
            <p className="text-xs text-gray-500 mt-2">Data will be available after this date passes</p>
          </div>
        </div>
      );
    }

    const calendarData = getCalendarEntryForDate(selectedDate);
    
    if (!calendarData) {
      return (
        <div className="p-6">
          <div className="text-center text-gray-400 py-8">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No data available for this date</p>
            <p className="text-xs text-gray-500 mt-2">Track your mood to see data here</p>
          </div>
        </div>
      );
    }

    const date = new Date(selectedDate);
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <div className="p-6">
        <div className="space-y-6">
          {/* Mood Data */}
          {calendarData?.moodEntry && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="text-center">
                <div className="text-3xl font-light text-white mb-2">
                  {Math.round(calculateMoodScore(calendarData.moodEntry.happiness, calendarData.moodEntry.focus, calendarData.moodEntry.stress) * 10) / 10}<span className="text-gray-400">/10</span>
                </div>
                <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${getRatingBarColor(calculateMoodScore(calendarData.moodEntry.happiness, calendarData.moodEntry.focus, calendarData.moodEntry.stress))}`}
                    style={{ width: `${(calculateMoodScore(calendarData.moodEntry.happiness, calendarData.moodEntry.focus, calendarData.moodEntry.stress) / 10) * 100}%` }}
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
                            className={`h-full transition-all duration-300 ${getMoodBadgeColor(calendarData.moodEntry.happiness, 'happiness')}`}
                            style={{ width: `${(calendarData.moodEntry.happiness / 5) * 100}%` }}
                      />
                    </div>
                        <span className="text-white text-sm w-8">{calendarData.moodEntry.happiness}/5</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Focus</span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                            className={`h-full transition-all duration-300 ${getMoodBadgeColor(calendarData.moodEntry.focus, 'focus')}`}
                            style={{ width: `${(calendarData.moodEntry.focus / 5) * 100}%` }}
                      />
                    </div>
                        <span className="text-white text-sm w-8">{calendarData.moodEntry.focus}/5</span>
                  </div>
                </div>
              
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Stress</span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                            className={`h-full transition-all duration-300 ${getMoodBadgeColor(calendarData.moodEntry.stress, 'stress')}`}
                            style={{ width: `${(calendarData.moodEntry.stress / 5) * 100}%` }}
                      />
                    </div>
                        <span className="text-white text-sm w-8">{calendarData.moodEntry.stress}/5</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Habits Section */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="font-medium text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Habits
              </div>
              
            {(() => {
              const habitsForDate = getHabitsForDate(selectedDate);
              const completedCount = habitsForDate.filter(h => h.completed).length;
              const totalHabits = habitsForDate.length;
              
              if (totalHabits === 0) {
                return (
                  <div className="text-center text-gray-400 py-6">
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-sm">No habits tracked on this date</p>
                  </div>
                );
              }

              return (
                <>
              {/* Progress Summary */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-300 text-sm">Progress:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-300"
                          style={{ width: `${totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
              </div>

              {/* Habit List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {habitsForDate
                      .sort((a, b) => {
                        // First sort by completion status (completed first)
                        if (a.completed !== b.completed) {
                          return b.completed ? 1 : -1;
                        }
                        // Then sort by favorite status (favorites first within each group)
                        if (a.habit.isFavorite !== b.habit.isFavorite) {
                          return a.habit.isFavorite ? -1 : 1;
                        }
                        // Finally sort alphabetically
                        return a.habit.name.localeCompare(b.habit.name);
                      })
                      .map(({ habit, completed, wasActive }) => {
                      const handleToggle = async () => {
                        if (!isDateReadOnly(selectedDate)) {
                          await toggleHabitCompletion(selectedDate, habit.id, !completed);
                        }
                      };
                  
                  return (
                        <div 
                          key={habit.id} 
                          className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                            completed 
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-red-500/10 border border-red-500/20'
                          } ${!isDateReadOnly(selectedDate) ? 'cursor-pointer hover:opacity-80' : 'opacity-70'}`}
                          onClick={handleToggle}
                        >
                      <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                              completed 
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500/20 border border-red-500'
                            }`}>
                              {completed ? (
                                <CheckIcon className="w-4 h-4 text-white" />
                              ) : (
                                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </div>
                            <div className="flex flex-col">
                        <span className="text-white text-sm">{habit.name}</span>
                              {!wasActive && (
                                <span className="text-xs text-gray-400">Was inactive on this date</span>
                              )}
                            </div>
                        {habit.isFavorite && (
                          <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
                </>
              );
            })()}
            </div>
        </div>
      </div>
    );
  };



  // Loading state
  if (loading) {
    return (
      <section className="mb-8">
        <div 
          className="rounded-lg shadow-md overflow-hidden max-w-7xl mx-auto"
          style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
        >
          <h2 className="text-xl text-white px-6 py-4 border-b border-gray-600">Calendar Overview</h2>
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

  return (
    <section className="mb-8">
      <div 
        className="rounded-lg shadow-md overflow-hidden max-w-7xl mx-auto"
        style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
      >
        <h2 className="text-xl text-white px-6 py-4 border-b border-gray-600">
          Calendar     </h2>
        
        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 bg-red-900/50 border border-red-600 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-200">{error}</p>
            </div>
          </div>
        )}
        <div className="flex">
          {/* Calendar Grid Section */}
          <div 
            className="flex-1 select-none"
            ref={calendarRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex justify-between items-center px-6 py-3 border-b border-gray-600">
              <button 
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors text-base text-white"
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
              >
                ←
              </button>
              <h3 className="text-lg font-medium text-white">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button 
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors text-base text-white"
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
              >
                →
              </button>
            </div>
            {renderCalendar()}
          </div>
          
          {/* Day Details Section */}
          <div className="w-80 border-l border-gray-600">
            {renderDayDetails()}
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