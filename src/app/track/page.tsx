'use client';

import { useState, useRef } from 'react';
import NumberMood from '@/components/NumberMood';
import PageTransition from '@/components/PageTransition';

interface DayData {
  mood: {
    happiness: number;
    satisfaction: number;
    stress: number;
  };
  dayRating: number;
  habits: {
    name: string;
    completed: boolean;
  }[];
}

interface MockData {
  [key: string]: DayData;
}

// Mock historical data
const mockDayData: MockData = {
  '2025-04-05': {
    mood: {
      happiness: 4,
      satisfaction: 5,
      stress: 2
    },
    dayRating: 9,
    habits: [
      { name: 'Exercise', completed: true },
      { name: 'Meditate', completed: true },
      { name: 'Read', completed: true }
    ]
  },
  '2025-04-08': {
    mood: {
      happiness: 2,
      satisfaction: 2,
      stress: 4
    },
    dayRating: 3,
    habits: [
      { name: 'Exercise', completed: false },
      { name: 'Meditate', completed: true },
      { name: 'Read', completed: false }
    ]
  },
  '2025-04-12': {
    mood: {
      happiness: 5,
      satisfaction: 4,
      stress: 2
    },
    dayRating: 9,
    habits: [
      { name: 'Exercise', completed: true },
      { name: 'Meditate', completed: true },
      { name: 'Read', completed: true }
    ]
  },
  // May 2025 seed data
  '2025-05-01': {
    mood: {
      happiness: 5,
      satisfaction: 5,
      stress: 1
    },
    dayRating: 10,
    habits: [
      { name: 'Exercise', completed: true },
      { name: 'Meditate', completed: true },
      { name: 'Read', completed: true }
    ]
  },
  '2025-05-02': {
    mood: {
      happiness: 3,
      satisfaction: 3,
      stress: 3
    },
    dayRating: 6,
    habits: [
      { name: 'Exercise', completed: true },
      { name: 'Meditate', completed: false },
      { name: 'Read', completed: true }
    ]
  },
  '2025-05-03': {
    mood: {
      happiness: 2,
      satisfaction: 2,
      stress: 5
    },
    dayRating: 2,
    habits: [
      { name: 'Exercise', completed: false },
      { name: 'Meditate', completed: false },
      { name: 'Read', completed: false }
    ]
  },
  '2025-05-05': {
    mood: {
      happiness: 4,
      satisfaction: 4,
      stress: 2
    },
    dayRating: 8,
    habits: [
      { name: 'Exercise', completed: true },
      { name: 'Meditate', completed: true },
      { name: 'Read', completed: true }
    ]
  },
  '2025-05-07': {
    mood: {
      happiness: 3,
      satisfaction: 2,
      stress: 4
    },
    dayRating: 4,
    habits: [
      { name: 'Exercise', completed: false },
      { name: 'Meditate', completed: true },
      { name: 'Read', completed: false }
    ]
  },
  '2025-05-08': {
    mood: {
      happiness: 5,
      satisfaction: 4,
      stress: 1
    },
    dayRating: 9,
    habits: [
      { name: 'Exercise', completed: true },
      { name: 'Meditate', completed: true },
      { name: 'Read', completed: true }
    ]
  },
  '2025-05-10': {
    mood: {
      happiness: 4,
      satisfaction: 3,
      stress: 2
    },
    dayRating: 7,
    habits: [
      { name: 'Exercise', completed: true },
      { name: 'Meditate', completed: false },
      { name: 'Read', completed: true }
    ]
  },
  '2025-05-12': {
    mood: {
      happiness: 1,
      satisfaction: 1,
      stress: 5
    },
    dayRating: 1,
    habits: [
      { name: 'Exercise', completed: false },
      { name: 'Meditate', completed: false },
      { name: 'Read', completed: false }
    ]
  },
  '2025-05-14': {
    mood: {
      happiness: 4,
      satisfaction: 5,
      stress: 2
    },
    dayRating: 8,
    habits: [
      { name: 'Exercise', completed: true },
      { name: 'Meditate', completed: true },
      { name: 'Read', completed: false }
    ]
  },
  '2025-05-15': {
    mood: {
      happiness: 5,
      satisfaction: 5,
      stress: 1
    },
    dayRating: 10,
    habits: [
      { name: 'Exercise', completed: true },
      { name: 'Meditate', completed: true },
      { name: 'Read', completed: true }
    ]
  },
  '2025-05-17': {
    mood: {
      happiness: 3,
      satisfaction: 4,
      stress: 3
    },
    dayRating: 6,
    habits: [
      { name: 'Exercise', completed: true },
      { name: 'Meditate', completed: true },
      { name: 'Read', completed: false }
    ]
  },
  '2025-05-18': {
    mood: {
      happiness: 2,
      satisfaction: 2,
      stress: 4
    },
    dayRating: 3,
    habits: [
      { name: 'Exercise', completed: false },
      { name: 'Meditate', completed: true },
      { name: 'Read', completed: false }
    ]
  },
  '2025-05-20': {
    mood: {
      happiness: 4,
      satisfaction: 4,
      stress: 2
    },
    dayRating: 8,
    habits: [
      { name: 'Exercise', completed: true },
      { name: 'Meditate', completed: true },
      { name: 'Read', completed: true }
    ]
  },
  '2025-05-22': {
    mood: {
      happiness: 3,
      satisfaction: 3,
      stress: 3
    },
    dayRating: 5,
    habits: [
      { name: 'Exercise', completed: true },
      { name: 'Meditate', completed: false },
      { name: 'Read', completed: true }
    ]
  },
  '2025-05-24': {
    mood: {
      happiness: 5,
      satisfaction: 4,
      stress: 1
    },
    dayRating: 9,
    habits: [
      { name: 'Exercise', completed: true },
      { name: 'Meditate', completed: true },
      { name: 'Read', completed: true }
    ]
  },
  '2025-05-25': {
    mood: {
      happiness: 2,
      satisfaction: 1,
      stress: 5
    },
    dayRating: 2,
    habits: [
      { name: 'Exercise', completed: false },
      { name: 'Meditate', completed: false },
      { name: 'Read', completed: false }
    ]
  },
  '2025-05-27': {
    mood: {
      happiness: 4,
      satisfaction: 4,
      stress: 2
    },
    dayRating: 7,
    habits: [
      { name: 'Exercise', completed: true },
      { name: 'Meditate', completed: true },
      { name: 'Read', completed: false }
    ]
  },
  '2025-05-28': {
    mood: {
      happiness: 5,
      satisfaction: 5,
      stress: 1
    },
    dayRating: 10,
    habits: [
      { name: 'Exercise', completed: true },
      { name: 'Meditate', completed: true },
      { name: 'Read', completed: true }
    ]
  },
  '2025-05-30': {
    mood: {
      happiness: 3,
      satisfaction: 3,
      stress: 3
    },
    dayRating: 6,
    habits: [
      { name: 'Exercise', completed: true },
      { name: 'Meditate', completed: false },
      { name: 'Read', completed: true }
    ]
  },
  '2025-05-31': {
    mood: {
      happiness: 4,
      satisfaction: 5,
      stress: 2
    },
    dayRating: 8,
    habits: [
      { name: 'Exercise', completed: true },
      { name: 'Meditate', completed: true },
      { name: 'Read', completed: true }
    ]
  }
};

type TabType = 'Summary';

type SimpleFilter = 'all' | 'active' | 'inactive';

export default function TrackPage() {
  const [habits, setHabits] = useState([
    { name: 'Exercise', streak: 3, isFavorite: false, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }, // 5 days ago
    { name: 'Meditate', streak: 5, isFavorite: true, createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }, // 10 days ago
    { name: 'Read', streak: 0, isFavorite: false, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } // 2 days ago
  ]);
  const [newHabit, setNewHabit] = useState('');
  const [habitError, setHabitError] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabType>('Summary');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [selectedHabitIndex, setSelectedHabitIndex] = useState<number | null>(null);
  
  // Simple filter state
  const [simpleFilter, setSimpleFilter] = useState<SimpleFilter>('all');

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

  const handleAddHabit = () => {
    if (!newHabit.trim()) {
      setHabitError('Please enter a habit name');
      return;
    }
    
    // Check for duplicate habit names (case-insensitive)
    const habitExists = habits.some(habit => 
      habit.name.toLowerCase() === newHabit.trim().toLowerCase()
    );
    
    if (habitExists) {
      setHabitError('This habit already exists');
      return;
    }
    
    // Add the new habit and clear error
    setHabits([...habits, { name: newHabit.trim(), streak: 0, isFavorite: false, createdAt: new Date() }]);
    setNewHabit('');
    setHabitError('');
  };

  const handleDeleteHabit = (indexToDelete: number) => {
    const newHabits = habits.filter((_, index) => index !== indexToDelete);
    setHabits(newHabits);
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

  const handleToggleFavorite = () => {
    if (selectedHabitIndex !== null) {
      const currentHabit = habits[selectedHabitIndex];
      const currentFavoriteCount = habits.filter(h => h.isFavorite).length;
      
      // If trying to favorite and already at limit
      if (!currentHabit.isFavorite && currentFavoriteCount >= 3) {
        return; // Don't allow more than 3 favorites
      }
      
      setHabits(prev => 
        prev.map((habit, index) => 
          index === selectedHabitIndex 
            ? { ...habit, isFavorite: !habit.isFavorite }
            : habit
        )
      );
      handleCloseHabitModal();
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

  // Sort habits to show favorites (pinned) at the top, then by streak length
  const sortedHabits = getFilteredHabits().sort((a, b) => {
    // First priority: pinned habits at the top
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    
    // Second priority: sort by streak length (highest first)
    return b.streak - a.streak;
  });

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

  const getDayClass = (dateStr: string) => {
    if (!mockDayData[dateStr]) return '';
    const dayRating = mockDayData[dateStr].dayRating;
    if (dayRating >= 8) return 'bg-gradient-to-br from-green-500 to-green-700 border-green-400 shadow-lg shadow-green-900/30 relative overflow-hidden';
    if (dayRating >= 5) return 'bg-gradient-to-br from-yellow-500 to-yellow-600 border-yellow-400 shadow-lg shadow-yellow-900/30 relative overflow-hidden';
    return 'bg-gradient-to-br from-red-500 to-red-700 border-red-400 shadow-lg shadow-red-900/30 relative overflow-hidden';
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

  const getRatingStyle = (rating: number) => {
    if (rating >= 9) {
      return {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      };
    } else if (rating >= 7) {
      return {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      };
    } else if (rating >= 5) {
      return {
        background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 50%, #a16207 100%)',
        boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      };
    } else if (rating >= 3) {
      return {
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      };
    } else {
      return {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      };
    }
  };

  const getMoodBadgeColor = (rating: number, type: 'happiness' | 'satisfaction' | 'stress' = 'happiness') => {
    if (type === 'stress') {
      switch (rating) {
        case 1: return 'bg-green-500';
        case 2: return 'bg-yellow-400';
        case 3: return 'bg-orange-500';
        case 4:
        case 5: return 'bg-red-500';
        default: return 'bg-green-500';
      }
    } else {
      switch (rating) {
        case 1:
        case 2: return 'bg-red-500';
        case 3: return 'bg-orange-500';
        case 4: return 'bg-yellow-400';
        case 5: return 'bg-green-500';
        default: return 'bg-yellow-400';
      }
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
      
      currentRow.push(
        <div
          key={date}
          className={`aspect-square flex items-center justify-center cursor-pointer rounded border transition-all text-xs text-white relative ${
            dayClass
          } ${
            selectedDate === dateStr ? 'border-blue-400' : dayClass ? '' : 'border-gray-500'
          }`}
          onClick={() => setSelectedDate(dateStr)}
          style={{
            ...(dayClass.includes('gradient') && {
              background: dayClass.includes('green') 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)'
                : dayClass.includes('yellow')
                ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 50%, #a16207 100%)'
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
              boxShadow: dayClass.includes('green')
                ? '0 4px 12px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                : dayClass.includes('yellow')
                ? '0 4px 12px rgba(234, 179, 8, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                : '0 4px 12px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }),
            ...(selectedDate === dateStr && {
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
            }),
            ...(!dayClass && selectedDate !== dateStr && {
              background: 'linear-gradient(135deg, #4b5563 0%, #374151 50%, #1f2937 100%)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            })
          }}
        >
          {(dayClass.includes('gradient') || selectedDate === dateStr || !dayClass) && (
            <div className="absolute inset-0 rounded opacity-20 pointer-events-none"
                 style={{
                   background: dayClass.includes('green')
                     ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)'
                     : dayClass.includes('yellow')
                     ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)'
                     : dayClass.includes('red') || selectedDate === dateStr
                     ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)'
                     : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)'
                 }}
            />
          )}
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
    if (!selectedDate || !mockDayData[selectedDate]) {
      return <p className="text-center text-gray-400 py-8 text-sm">Click a date to view details</p>;
    }

    const data = mockDayData[selectedDate];
    const date = new Date(selectedDate);
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const renderTabContent = () => {
      return (
        <div className="flex flex-col gap-6">
          {/* Day Rating */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="font-medium text-white mb-3">Day Rating:</div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${getRatingBarColor(data.dayRating)}`}
                  style={{ width: `${(data.dayRating / 10) * 100}%` }}
                />
              </div>
              <div className={`px-3 py-1 rounded-full text-white font-medium text-sm ${getRatingColor(data.dayRating)}`}>
                {data.dayRating}/10
              </div>
            </div>
          </div>

          {/* Mood */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="font-medium text-white mb-3">Mood:</div>
            <div className="space-y-3">
              {/* Happy */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-300 text-sm">Happy:</span>
                  <span className="text-white text-sm font-medium">{data.mood.happiness}/5</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${getMoodBadgeColor(data.mood.happiness, 'happiness').replace('bg-', 'bg-')}`}
                      style={{ width: `${(data.mood.happiness / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Satisfied */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-300 text-sm">Satisfied:</span>
                  <span className="text-white text-sm font-medium">{data.mood.satisfaction}/5</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${getMoodBadgeColor(data.mood.satisfaction, 'satisfaction').replace('bg-', 'bg-')}`}
                      style={{ width: `${(data.mood.satisfaction / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Stress */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-300 text-sm">Stress:</span>
                  <span className="text-white text-sm font-medium">{data.mood.stress}/5</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${getMoodBadgeColor(data.mood.stress, 'stress').replace('bg-', 'bg-')}`}
                      style={{ width: `${(data.mood.stress / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Habits */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="font-medium text-white mb-3">Habits:</div>
            <div className="flex items-center justify-between mb-3 p-2 bg-gray-600/50 rounded">
              <span className="text-gray-300 text-sm">Progress:</span>
              <span className="text-white font-medium">
                {data.habits.filter(h => h.completed).length}/{data.habits.length} completed
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {data.habits.map((habit, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-600/30 rounded-lg hover:bg-gray-600/50 transition-colors">
                  <span className="text-white text-sm flex-1">{habit.name}</span>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    habit.completed 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500/80 text-white'
                  }`}>
                    {habit.completed ? '✓' : '✗'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="p-4">
        {!selectedDate || !mockDayData[selectedDate] ? (
          <p className="text-center text-gray-400 py-8 text-sm">Click a date to view details</p>
        ) : (
          <>
            <h3 className="text-lg font-medium text-white mb-4">{formattedDate}</h3>
            


            <div className="text-gray-300 text-sm">
              {renderTabContent()}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
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
          <h1 className="text-3xl font-bold text-white mb-2">Tracking Dashboard</h1>
          <p className="text-white">Monitor your mood, habits, and daily progress</p>
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
                <p className="text-2xl font-bold text-white">7 days</p>
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
                <p className="text-2xl font-bold text-white">3/5</p>
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
                <p className="text-2xl font-bold text-white">28</p>
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
                <p className="text-2xl font-bold text-white">85%</p>
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
              />
              <button 
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:scale-95 transform transition-all duration-75"
                onClick={handleAddHabit}
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
              {sortedHabits.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  {simpleFilter !== 'all' ? `No habits with ${simpleFilter === 'active' ? 'active streaks' : 'zero streaks'}` : 'No habits yet'}
                </div>
              ) : (
                sortedHabits.map((habit, sortedIndex) => {
                  const originalIndex = habits.findIndex(h => h.name === habit.name && h.streak === habit.streak);
                  return (
                    <div key={originalIndex} className="group flex items-center justify-between hover:bg-gray-700/50 rounded-md p-2 transition-colors">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                          id={`habit-${originalIndex}`} 
                        />
                        <label htmlFor={`habit-${originalIndex}`} className="text-white flex items-center gap-2">
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
                const canPin = !currentHabit?.isFavorite && !isAtLimit;
                
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
  );
}
