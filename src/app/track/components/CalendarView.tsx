import React, { useState, useRef } from 'react';
import { UserHabit, DailyEntry, MoodEntry } from '../types';

interface CalendarViewProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  habits: UserHabit[];
  dailyEntries: { [key: string]: DailyEntry };
  moodEntries: { [key: string]: MoodEntry };
}

export default function CalendarView({
  currentMonth,
  setCurrentMonth,
  habits,
  dailyEntries,
  moodEntries
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

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

  // Calculate overall mood score from happiness, satisfaction, and stress
  const calculateMoodScore = (happiness: number, satisfaction: number, stress: number) => {
    // Convert to 0-10 scale: (happiness + satisfaction + (6-stress)) / 3 * 2
    // Stress is inverted (higher stress = lower score)
    const invertedStress = 6 - stress; // Convert 1-5 stress to 5-1 scale
    return ((happiness + satisfaction + invertedStress) / 3) * 2;
  };

  const getDayClass = (dateStr: string) => {
    // Check for mood data first
    const moodEntry = moodEntries[dateStr];
    if (moodEntry && moodEntry.happiness && moodEntry.satisfaction && moodEntry.stress) {
      const moodScore = calculateMoodScore(moodEntry.happiness, moodEntry.satisfaction, moodEntry.stress);
      if (moodScore >= 7) return 'mood-good';
      if (moodScore >= 5) return 'mood-neutral';
      return 'mood-poor';
    }
    
    // Fallback to daily entries if available
    const entry = dailyEntries[dateStr];
    if (entry && entry.dayRating) {
      const dayRating = entry.dayRating;
      if (dayRating >= 8) return 'mood-good';
      if (dayRating >= 5) return 'mood-neutral';
      return 'mood-poor';
    }
    
    return '';
  };

  const getMoodBadgeColor = (rating: number, type: 'happiness' | 'satisfaction' | 'stress' = 'happiness') => {
    if (type === 'stress') {
      // For stress, lower is better, so invert the color logic
      if (rating <= 1) return 'bg-green-500';
      if (rating <= 2) return 'bg-yellow-400';
      if (rating <= 3) return 'bg-orange-500';
      return 'bg-red-500';
    } else {
      // For happiness and satisfaction, higher is better
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
      const moodEntry = moodEntries[dateStr];
      
      // Get styling based on mood
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
          default:
            return {
              background: 'linear-gradient(135deg, #4b5563 0%, #374151 50%, #1f2937 100%)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              border: '1px solid #4b5563'
            };
        }
      };
      
      // Check if this is today or future date
      const today = new Date().toISOString().split('T')[0];
      const isToday = dateStr === today;
      const isFuture = dateStr > today;
      
      currentRow.push(
        <div
          key={date}
          className={`aspect-square flex flex-col items-center justify-center rounded transition-all text-xs text-white relative ${
            isToday || isFuture ? 'cursor-pointer' : 'cursor-pointer'
          }`}
          onClick={() => setSelectedDate(dateStr)}
          style={getMoodStyling()}
        >
          {/* Mood indicator dots */}
          {moodEntry && (
            <div className="absolute top-1 right-1 flex gap-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${getMoodBadgeColor(moodEntry.happiness, 'happiness')}`} title="Happiness" />
              <div className={`w-1.5 h-1.5 rounded-full ${getMoodBadgeColor(moodEntry.satisfaction, 'satisfaction')}`} title="Satisfaction" />
              <div className={`w-1.5 h-1.5 rounded-full ${getMoodBadgeColor(moodEntry.stress, 'stress')}`} title="Stress" />
            </div>
          )}
          
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
              <div className="flex justify-center space-x-2 mb-4">
                <span className="text-2xl">💪</span>
                <span className="text-2xl">🔥</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-500/30">
              <p className="text-white font-medium mb-2">Focus on today's goals:</p>
              <div className="text-left space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Track your mood</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">○</span>
                  <span>Complete your habits</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">○</span>
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

    const dailyData = dailyEntries[selectedDate];
    const moodData = moodEntries[selectedDate];
    
    if (!dailyData && !moodData) {
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
        <div className="mb-8">
          <h3 className="text-xl font-light text-white">{formattedDate}</h3>
        </div>

        <div className="space-y-6">
          {/* Mood Data */}
          {moodData && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="text-center">
                <div className="text-3xl font-light text-white mb-2">
                  {Math.round(calculateMoodScore(moodData.happiness, moodData.satisfaction, moodData.stress) * 10) / 10}<span className="text-gray-400">/10</span>
                </div>
                <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${getRatingBarColor(calculateMoodScore(moodData.happiness, moodData.satisfaction, moodData.stress))}`}
                    style={{ width: `${(calculateMoodScore(moodData.happiness, moodData.satisfaction, moodData.stress) / 10) * 100}%` }}
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
                        className={`h-full transition-all duration-300 ${getMoodBadgeColor(moodData.happiness, 'happiness')}`}
                        style={{ width: `${(moodData.happiness / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-white text-sm w-8">{moodData.happiness}/5</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Satisfaction</span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getMoodBadgeColor(moodData.satisfaction, 'satisfaction')}`}
                        style={{ width: `${(moodData.satisfaction / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-white text-sm w-8">{moodData.satisfaction}/5</span>
                  </div>
                </div>
              
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Stress</span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getMoodBadgeColor(moodData.stress, 'stress')}`}
                        style={{ width: `${(moodData.stress / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-white text-sm w-8">{moodData.stress}/5</span>
                  </div>
                </div>
              </div>
              
              {/* Date only - no time */}
              <div className="text-center">
                <span className="text-gray-400 text-xs">
                  {new Date(moodData.created_at || moodData.updated_at || selectedDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {/* Habits Section */}
          {habits.length > 0 && (
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="font-medium text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Habits for {formattedDate}
              </div>
              
              {/* Progress Summary */}
              <div className="flex items-center justify-between mb-3 p-2 bg-gray-600/50 rounded">
                <span className="text-gray-300 text-sm">Progress:</span>
                <span className="text-white font-medium">
                  {(() => {
                    const completedCount = dailyData?.habitCompletions?.filter(h => h.completed).length || 0;
                    const totalFromData = dailyData?.habitCompletions?.length || 0;
                    const totalHabits = habits.length;
                    
                    // If we have completion data, use it; otherwise show 0/total
                    return totalFromData > 0 ? `${completedCount}/${totalFromData} completed` : `0/${totalHabits} completed`;
                  })()}
                </span>
              </div>

              {/* Habit List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {habits.map((habit) => {
                  const completion = dailyData?.habitCompletions?.find(h => h.habitId === habit.id);
                  const isCompleted = completion?.completed === true;
                  
                  return (
                    <div key={habit.id} className={`flex items-center justify-between p-3 rounded-lg ${
                      isCompleted 
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-orange-500/10 border border-orange-500/20'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          isCompleted 
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-600 text-gray-300'
                        }`}>
                          {isCompleted ? '✓' : '○'}
                        </div>
                        <span className="text-white text-sm">{habit.name}</span>
                        {habit.isFavorite && (
                          <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs ${isCompleted ? 'text-green-400' : 'text-orange-400'}`}>
                        {isCompleted ? 'Done' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="mb-8">
      <div 
        className="rounded-lg shadow-md overflow-hidden max-w-7xl mx-auto"
        style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
      >
        <h2 className="text-xl text-white px-6 py-4 border-b border-gray-600">Calendar Overview</h2>
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