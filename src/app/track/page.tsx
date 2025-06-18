'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import NumberMood from '@/components/NumberMood';
import PageTransition from '@/components/PageTransition';
import AuthGuard from '@/components/AuthGuard';
import client from '@/api/client';
import { HABITS, DASHBOARD } from '@/api/endpoints';
import { getMoodEntries } from '@/services/moodService';
import { getHabits, createHabit, updateHabit, deleteHabit } from '@/services/habitsService';
import { getDailyEntries } from '@/services/dashboardService';
import { cacheService } from '@/services/cacheService';

// Removed unused DayData interface

interface UserHabit {
  id: number;
  name: string;
  streak: number;
  isFavorite: boolean;
  createdAt: Date;
}

interface DailyEntry {
  date: string;
  happiness?: number;
  satisfaction?: number;
  stress?: number;
  dayRating?: number;
  habitCompletions?: {
    habitId: number;
    completed: boolean;
  }[];
}

type SimpleFilter = 'all' | 'active' | 'inactive';

export default function TrackPage() {
  // State for user data
  const [habits, setHabits] = useState<UserHabit[]>([]);
  const [dailyEntries, setDailyEntries] = useState<{[key: string]: DailyEntry}>({});
  const [moodEntries, setMoodEntries] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [newHabit, setNewHabit] = useState('');
  const [habitError, setHabitError] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [selectedHabitIndex, setSelectedHabitIndex] = useState<number | null>(null);
  const [simpleFilter, setSimpleFilter] = useState<SimpleFilter>('all');
  const [showCacheStats, setShowCacheStats] = useState(false);

  // Load user data on component mount (with caching)
  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load habits - gracefully handle if endpoint doesn't exist
      try {
        const habitsData = await getHabits();
        setHabits(habitsData || []);
      } catch (habitsError) {
        console.warn('Habits endpoint not available yet:', habitsError);
        setHabits([]); // Empty array so mood tracking still works
      }
      
      // Load daily entries for current month - gracefully handle if endpoint doesn't exist
      try {
      const monthStr = currentMonth.toISOString().slice(0, 7); // YYYY-MM
        const entriesMap = await getDailyEntries(monthStr);
        setDailyEntries(entriesMap);
      } catch (entriesError) {
        console.warn('Daily entries endpoint not available yet:', entriesError);
        setDailyEntries({}); // Empty object so mood tracking still works
      }

      // Load mood entries for current month (cached)
      try {
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        const startDate = firstDay.toISOString().split('T')[0]; // YYYY-MM-DD
        const endDate = lastDay.toISOString().split('T')[0]; // YYYY-MM-DD
        
        const moodData = await getMoodEntries(startDate, endDate);
      
      // Convert array to object with date as key
        const moodMap: {[key: string]: any} = {};
        if (moodData) {
          moodData.forEach((entry: any) => {
            moodMap[entry.date] = entry;
        });
      }
        setMoodEntries(moodMap);
      } catch (moodError) {
        console.warn('Failed to load mood entries:', moodError);
        setMoodEntries({}); // Empty object if mood data fails
      }
      
    } catch (err) {
      console.error('Failed to load user data:', err);
      setError('Some features may not be available. Mood tracking is still functional.');
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    loadUserData();
  }, [currentMonth, loadUserData]);

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

  const handleAddHabit = async () => {
    try {
      if (!newHabit.trim()) {
        setHabitError('Please enter a habit name');
        return;
      }
      
      const habitExists = habits.some(
        (habit) => habit.name.toLowerCase() === newHabit.trim().toLowerCase()
      );

      if (habitExists) {
        setHabitError('This habit already exists');
        return;
      }

      const habitName = newHabit.trim();
      
      const optimisticHabit: UserHabit = {
        id: Date.now(), 
        name: habitName,
        streak: 0,
        isFavorite: false,
        createdAt: new Date(),
      };
      
      setHabits((prevHabits) => [...prevHabits, optimisticHabit]);
      setSimpleFilter('all');
      setNewHabit('');
      setHabitError('');

      createHabit({ name: habitName })
        .then(response => {
          console.log('🎉 Habit created on server:', response);
          // Update local state with server response
          setHabits((prevHabits) => 
            prevHabits.map(h => h.id === optimisticHabit.id ? response : h)
          );
        })
        .catch((err) => {
          console.error('API call failed:', err);
          if (err.message.includes('Failed to create habit')) {
            setHabitError('Habit tracking feature coming soon. Mood tracking is available now.');
          } else {
          setHabitError('Failed to add habit. Please try again.');
          }
          setHabits((prevHabits) => prevHabits.filter(h => h.id !== optimisticHabit.id));
          setNewHabit(habitName);
        });
    } catch (err) {
      console.error('🚨 Unexpected error in handleAddHabit:', err);
      setHabitError('An unexpected error occurred. Please try again.');
    }
  };

  const handleDeleteHabit = async (indexToDelete: number) => {
    const habitToDelete = habits[indexToDelete];
    if (!habitToDelete) return;
    
    try {
      await deleteHabit(habitToDelete.id);
      
      // Remove habit from state
      const newHabits = habits.filter((_, index) => index !== indexToDelete);
      setHabits(newHabits);
    } catch (err) {
      console.error('Failed to delete habit:', err);
      setError('Failed to delete habit. Please try again.');
    }
  };

  const handleOpenHabitModal = (index: number) => {
    setSelectedHabitIndex(index);
    setHabitModalOpen(true);
  };

  const handleCloseHabitModal = () => {
    setHabitModalOpen(false);
    setSelectedHabitIndex(null);
  };

  const handleDeleteHabitFromModal = () => {
    if (selectedHabitIndex !== null) {
      handleDeleteHabit(selectedHabitIndex);
      handleCloseHabitModal();
    }
  };

  const handleToggleFavorite = async () => {
    if (selectedHabitIndex === null) return;
    
    const currentHabit = habits[selectedHabitIndex];
    const currentFavoriteCount = habits.filter(h => h.isFavorite).length;
    
    // If trying to favorite and already at limit
    if (!currentHabit.isFavorite && currentFavoriteCount >= 3) {
      return; // Don't allow more than 3 favorites
    }
    
    try {
      const updatedHabit = await updateHabit(currentHabit.id, {
        isFavorite: !currentHabit.isFavorite
      });
      
      setHabits(prev => 
        prev.map((habit, index) => 
          index === selectedHabitIndex 
            ? updatedHabit
            : habit
        )
      );
      handleCloseHabitModal();
    } catch (err) {
      console.error('Failed to update habit:', err);
      setError('Failed to update habit. Please try again.');
    }
  };

  // Simple filter function
  const getFilteredHabits = () => {
    switch (simpleFilter) {
      case 'active':
        return habits.filter(habit => habit.streak > 0);
      case 'inactive':
        return habits.filter(habit => habit.streak === 0);
      default:
        return habits;
    }
  };

  // Cache management functions
  const handleRefreshCache = () => {
    cacheService.clear();
    loadUserData();
  };

  const getCacheStats = () => {
    return cacheService.getStats();
  };

  // Sort habits to show favorites (pinned) at the top, then by streak length
  const sortedHabits = getFilteredHabits().sort((a, b) => {
    // First priority: pinned habits at the top
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    
    // Second priority: sort by streak length (highest first)
    return b.streak - a.streak;
  });

  // Debug: Log current habits count
  console.log('🎯 Current habits in component:', habits.length, habits.map(h => h.name));

  const cycleFilter = () => {
    setSimpleFilter(prev => {
      switch (prev) {
        case 'all': return 'active';
        case 'active': return 'inactive';
        case 'inactive': return 'all';
        default: return 'all';
      }
    });
  };

  const getFilterLabel = () => {
    switch (simpleFilter) {
      case 'active': return 'Active streaks';
      case 'inactive': return 'No streaks';
      default: return 'All habits';
    }
  };

  const getFilterIcon = () => {
    switch (simpleFilter) {
      case 'active': 
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'inactive': 
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L12 12M5.636 5.636L12 12" />
          </svg>
        );
      default: 
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
          </svg>
        );
    }
  };

  // Calculate real statistics from user data
  const calculateCurrentStreak = () => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map(h => h.streak));
  };

  const calculateHabitsCompleted = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = dailyEntries[today];
    if (!todayEntry?.habitCompletions) return { completed: 0, total: habits.length };
    
    const completed = todayEntry.habitCompletions.filter(hc => hc.completed).length;
    return { completed, total: habits.length };
  };

  const calculateDaysTracked = () => {
    return Object.keys(dailyEntries).length;
  };

  const calculateMonthlyCompletion = () => {
    const currentMonthEntries = Object.values(dailyEntries).filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === currentMonth.getMonth() && 
             entryDate.getFullYear() === currentMonth.getFullYear();
    });
    
    if (currentMonthEntries.length === 0) return 0;
    
    const daysWithHabits = currentMonthEntries.filter(entry => 
      entry.habitCompletions && entry.habitCompletions.some(hc => hc.completed)
    ).length;
    
    return Math.round((daysWithHabits / currentMonthEntries.length) * 100);
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

  const getRatingColor = (rating: number) => {
    if (rating >= 9) return 'bg-green-600';
    if (rating >= 7) return 'bg-green-500';
    if (rating >= 5) return 'bg-yellow-400';
    if (rating >= 3) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRatingBarColor = (rating: number) => {
    if (rating >= 9) return 'bg-green-500';
    if (rating >= 7) return 'bg-green-500';
    if (rating >= 5) return 'bg-yellow-400';
    if (rating >= 3) return 'bg-orange-500';
    return 'bg-red-500';
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
          {renderTabContent()}
        </div>
      </div>
    );

    function renderTabContent() {
      return (
        <div className="flex flex-col gap-6">
          {/* Mood Data - Show prominently if available */}
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
                  {new Date(moodData.created_at || moodData.updated_at).toLocaleDateString()}
                </span>
                </div>
            </div>
          )}

          {/* Day Rating - Show if available from daily entries */}
          {dailyData && dailyData.dayRating && (
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="font-medium text-white mb-3">Day Rating:</div>
                <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                    className={`h-full transition-all duration-300 ${getRatingBarColor(dailyData.dayRating || 0)}`}
                    style={{ width: `${((dailyData.dayRating || 0) / 10) * 100}%` }}
                    />
                  </div>
                <div className={`px-3 py-1 rounded-full text-white font-medium text-sm ${getRatingColor(dailyData.dayRating || 0)}`}>
                  {dailyData.dayRating || 0}/10
                </div>
              </div>
            </div>
          )}

          {/* Habits - Show all habits with completion status */}
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

              {/* Completed Habits */}
              {(() => {
                const completedHabits = habits.filter(habit => {
                  const completion = dailyData?.habitCompletions?.find(h => h.habitId === habit.id);
                  return completion?.completed === true;
                });
                
                return completedHabits.length > 0 && (
                  <div className="mb-4">
                    <div className="text-green-400 text-sm font-medium mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Completed ({completedHabits.length})
                    </div>
                    <div className="space-y-2">
                      {completedHabits.map((habit) => (
                        <div key={habit.id} className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold">
                              ✓
                  </div>
                            <span className="text-white text-sm">{habit.name}</span>
                            {habit.isFavorite && (
                              <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            )}
            </div>
                          <span className="text-green-400 text-xs">Done</span>
                        </div>
                      ))}
          </div>
        </div>
      );
              })()}

              {/* Pending Habits */}
              {(() => {
                const pendingHabits = habits.filter(habit => {
                  const completion = dailyData?.habitCompletions?.find(h => h.habitId === habit.id);
                  return !completion || completion.completed === false;
                });
                
                return pendingHabits.length > 0 && (
                  <div>
                    <div className="text-orange-400 text-sm font-medium mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Pending ({pendingHabits.length})
            </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {pendingHabits.map((habit) => (
                        <div key={habit.id} className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-600 text-gray-300 text-xs font-bold">
                              ○
                            </div>
                            <span className="text-white text-sm">{habit.name}</span>
                            {habit.isFavorite && (
                              <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
        )}
                          </div>
                          <span className="text-orange-400 text-xs">Pending</span>
                        </div>
                      ))}
                    </div>
      </div>
    );
              })()}

              {/* No Habits Message */}
              {habits.length === 0 && (
                <div className="text-center text-gray-400 py-4">
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">No habits to track</p>
                  <p className="text-xs text-gray-500 mt-1">Add habits to start tracking</p>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
  };

  // Show loading state
  if (loading) {
    return (
      <AuthGuard>
        <PageTransition>
          <div className="min-h-screen bg-gradient-to-b from-[#0a1220] to-[#10182B] text-white">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#42b9e5] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-300">Loading your tracking data...</p>
              </div>
            </div>
          </div>
        </PageTransition>
      </AuthGuard>
    );
  }

  // Show error state
  if (error) {
    return (
      <AuthGuard>
        <PageTransition>
          <div className="min-h-screen bg-gradient-to-b from-[#0a1220] to-[#10182B] text-white">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="text-red-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <p className="text-gray-300 mb-4">{error}</p>
                <button
                  onClick={loadUserData}
                  className="px-4 py-2 bg-[#42b9e5] text-white rounded-lg hover:bg-[#3a9fd4] transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </PageTransition>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <PageTransition>
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
      <div 
        className="min-h-screen py-8"
        style={{ backgroundColor: "#1A2537" }}
      >
        <div className="container mx-auto px-4">
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
          <h1 className="text-3xl font-bold text-white mb-2">Tracking Dashboard</h1>
          <p className="text-white">Monitor your mood, habits, and daily progress</p>
            </div>
            
            {/* Cache Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCacheStats(!showCacheStats)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700/50"
                title="Cache Status"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
              
              <button
                onClick={handleRefreshCache}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700/50"
                title="Clear Cache & Refresh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Cache Stats Panel */}
          {showCacheStats && (
            <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
              <h3 className="text-sm font-medium text-white mb-2">Cache Status</h3>
              <div className="text-xs text-gray-300 space-y-1">
                <div>Cached entries: {getCacheStats().size}/{getCacheStats().maxSize}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {getCacheStats().entries.map((key, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                      {key.length > 20 ? `${key.substring(0, 20)}...` : key}
                    </span>
                  ))}
                </div>
                {getCacheStats().entries.length === 0 && (
                  <div className="text-gray-400 italic">No cached data</div>
                )}
              </div>
            </div>
          )}
        </header>

          {/* Stats Section */}
          <section className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Current Streak */}
              <div 
                className="rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
                style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-gray-300">Current Streak</h3>
                  <div className="text-blue-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{calculateCurrentStreak()} days</p>
              </div>

              {/* Habits Completed */}
              <div 
                className="rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
                style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-gray-300">Habits Completed</h3>
                  <div className="text-green-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{calculateHabitsCompleted().completed}/{calculateHabitsCompleted().total}</p>
              </div>

              {/* Days Tracked */}
              <div 
                className="rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
                style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-gray-300">Days Tracked</h3>
                  <div className="text-purple-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{calculateDaysTracked()}</p>
              </div>

              {/* This Month */}
              <div 
                className="rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
                style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-gray-300">This Month</h3>
                  <div className="text-yellow-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{calculateMonthlyCompletion()}%</p>
              </div>
            </div>
          </section>

        {/* Habit Tracking Section */}
          <section className="mb-8">
            <div 
              className="rounded-lg p-6 shadow-md"
              style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
            >
              <h2 className="text-2xl text-white mb-4">Habit Tracking</h2>
              <div className="rounded-lg p-6">
                <h3 className="text-xl font-medium text-white mb-2">Habit Tracker</h3>
                <p className="text-gray-300 mb-4">Track your daily habits and build streaks</p>
            
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                    className={`flex-1 px-4 py-2 border bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      habitError ? 'border-red-300 focus:ring-red-500' : 'border-gray-600'
                }`}
                placeholder="Add a new habit..."
                value={newHabit}
                onChange={(e) => {
                  setNewHabit(e.target.value);
                  if (habitError) setHabitError(''); // Clear error when typing
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    console.log('🔤 Enter key pressed');
                    handleAddHabit();
                  }
                }}
              />
              <button 
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:scale-95 transform transition-all duration-75"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('🖱️ Button clicked');
                  handleAddHabit();
                }}
              >
                Add
              </button>
              <button
                onClick={cycleFilter}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg active:scale-95 transform transition-all duration-75 ${
                  simpleFilter === 'all' 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-600' 
                    : 'text-blue-300 bg-blue-500/20 hover:bg-blue-500/30'
                }`}
                title={`Filter: ${getFilterLabel()}`}
              >
                {getFilterIcon()}
                <span className="text-sm">{getFilterLabel()}</span>
              </button>
            </div>
            
            {habitError && (
                  <div className="mb-4 text-red-400 text-sm">{habitError}</div>
            )}

                <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {loading && <div className="text-center text-gray-400 py-8">Loading habits...</div>}
              {!loading && sortedHabits.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  {simpleFilter !== 'all' ? `No habits with ${simpleFilter === 'active' ? 'active streaks' : 'zero streaks'}` : 'No habits yet'}
                </div>
              ) : (
                sortedHabits.map((habit) => {
                  const originalIndex = habits.findIndex(h => h.id === habit.id);
                  return (
                    <div key={habit.id} className="group flex items-center justify-between hover:bg-gray-700/50 rounded-md p-2 transition-colors">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                          id={`habit-${habit.id}`} 
                        />
                        <label htmlFor={`habit-${habit.id}`} className="text-white flex items-center gap-2">
                          {habit.name}
                          {habit.isFavorite && (
                            <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          )}
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-300">{habit.streak} days</span>
                        <button
                          onClick={() => handleOpenHabitModal(originalIndex)}
                          className="text-gray-400 hover:text-blue-400 transition-all p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-600"
                          title="Edit habit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
                </div>
            </div>
          </div>
        </section>

        {/* Mood Tracking Section */}
          <section className="mb-8">
        <NumberMood />
          </section>



        {/* Calendar Section */}
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
        </section>
        </div>
      </div>

      {/* Habit Management Modal */}
      {habitModalOpen && selectedHabitIndex !== null && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white rounded-lg p-6 w-96 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Manage Habit</h3>
            <div className="mb-6">
              <p className="text-gray-300 text-center mb-2">
                What would you like to do with <span className="text-white font-medium">"{habits[selectedHabitIndex]?.name}"</span>?
              </p>
              {(() => {
                const currentFavoriteCount = habits.filter(h => h.isFavorite).length;
                const currentHabit = habits[selectedHabitIndex];
                const isAtLimit = currentFavoriteCount >= 3;
                
                if (currentHabit?.isFavorite) {
                  return (
                    <p className="text-xs text-blue-400 text-center">
                      This habit is currently pinned to the top
                    </p>
                  );
                } else if (isAtLimit) {
                  return (
                    <p className="text-xs text-yellow-400 text-center">
                      Pin limit reached (3/3). Unpin another habit first.
                    </p>
                  );
                } else {
                  return (
                    <p className="text-xs text-gray-400 text-center">
                      Pinned habits ({currentFavoriteCount}/3) appear at the top
                    </p>
                  );
                }
              })()}
            </div>
            <div className="flex justify-between">
              {/* Delete button on the left */}
              <button
                onClick={handleDeleteHabitFromModal}
                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md active:scale-95 transform transition-all duration-75"
                title="Delete habit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
              
              {/* Pin and Cancel buttons on the right */}
              <div className="flex gap-2">
                <button
                  onClick={handleToggleFavorite}
                  disabled={(() => {
                    const currentFavoriteCount = habits.filter(h => h.isFavorite).length;
                    const currentHabit = habits[selectedHabitIndex];
                    return !currentHabit?.isFavorite && currentFavoriteCount >= 3;
                  })()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md active:scale-95 transform transition-all duration-75 disabled:opacity-50 disabled:cursor-not-allowed ${
                    habits[selectedHabitIndex]?.isFavorite
                      ? 'text-blue-300 hover:text-blue-200 hover:bg-blue-900/20'
                      : 'text-gray-300 hover:text-blue-300 hover:bg-blue-900/20'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  {habits[selectedHabitIndex]?.isFavorite ? 'Unpin' : 'Pin to Top'}
                </button>
                <button
                  onClick={handleCloseHabitModal}
                  className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-md active:scale-95 transform transition-transform duration-75"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
    </AuthGuard>
  );
}
