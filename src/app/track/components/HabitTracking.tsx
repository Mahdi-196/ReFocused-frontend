import React, { useState, useMemo } from 'react';
import { UserHabit, SimpleFilter } from '../types';
import { CheckIcon } from '@/components/icons';

interface HabitTrackingProps {
  habits: UserHabit[];
  loading: boolean;
  onAddHabit: (habitName: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteHabit: (habitId: number) => Promise<{ success: boolean; error?: string }>;
  onToggleFavorite: (habitId: number) => Promise<{ success: boolean; error?: string }>;
  onToggleCompletion: (habitId: number, date?: string) => Promise<{ success: boolean; error?: string }>;
  isHabitCompleted: (habitId: number, date?: string) => boolean;
}

export default function HabitTracking({
  habits,
  loading,
  onAddHabit,
  onDeleteHabit,
  onToggleFavorite,
  onToggleCompletion,
  isHabitCompleted
}: HabitTrackingProps) {
  const [newHabit, setNewHabit] = useState('');
  const [habitError, setHabitError] = useState('');
  const [simpleFilter, setSimpleFilter] = useState<SimpleFilter>('all');

  const handleAddHabit = async () => {
    if (!newHabit.trim()) return;
    
    const result = await onAddHabit(newHabit);
    
    if (result.success) {
      setNewHabit('');
      setHabitError('');
    } else {
      setHabitError(result.error || 'Failed to add habit');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddHabit();
    }
  };

  const handleToggleCompletion = async (habitId: number) => {
    const habit = habits.find(h => h.id === habitId);
    const wasCompleted = isHabitCompleted(habitId);
    
    const result = await onToggleCompletion(habitId);
    
    if (!result.success && result.error) {
      // Could add error handling here if needed
      console.error('Failed to toggle habit completion:', result.error);
    }
  };

  // Memoized filtering and sorting
  const filteredAndSortedHabits = useMemo(() => {
    // Filter habits
    let filtered = habits;
    switch (simpleFilter) {
      case 'active':
        filtered = habits.filter(habit => habit.streak > 0);
        break;
      case 'inactive':
        filtered = habits.filter(habit => habit.streak === 0);
        break;
      default:
        filtered = habits;
    }

    // Sort habits
    return filtered.sort((a, b) => {
      // Pinned habits first
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      
      // Highest streak first
      if (a.streak !== b.streak) return b.streak - a.streak;
      
      // Oldest habits first
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      if (aDate !== bDate) return aDate - bDate;
      
      // Uncompleted first
      const aCompleted = isHabitCompleted(a.id);
      const bCompleted = isHabitCompleted(b.id);
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
      
      // Alphabetical
      return a.name.localeCompare(b.name);
    });
  }, [habits, simpleFilter, isHabitCompleted]);

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

  return (
    <>
      <section className="mb-8">
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Daily Habits</h2>
            <button
              onClick={cycleFilter}
              className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-md transition-colors text-sm"
              title={`Filter: ${getFilterLabel()}`}
            >
              {getFilterIcon()}
              <span>{getFilterLabel()}</span>
            </button>
          </div>



          {/* Add New Habit */}
          <div className="mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a new habit..."
                className="flex-1 px-4 py-2 bg-gray-700 text-white placeholder-gray-400 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={50}
              />
              <button
                onClick={handleAddHabit}
                disabled={!newHabit.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                Add
              </button>
            </div>
            {habitError && (
              <p className="text-red-400 text-sm mt-2">{habitError}</p>
            )}
          </div>

          {/* Habits List */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {loading ? (
              <div className="text-center text-gray-400 py-8">
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading habits...
              </div>
            ) : filteredAndSortedHabits.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                {simpleFilter !== 'all' 
                  ? `No habits with ${simpleFilter === 'active' ? 'active streaks' : 'zero streaks'}`
                  : 'No habits yet. Add one above to get started!'
                }
              </div>
            ) : (
              filteredAndSortedHabits.map((habit) => {
                const isCompleted = isHabitCompleted(habit.id);
                
                return (
                  <div
                    key={habit.id}
                    className="group flex items-center justify-between hover:bg-gray-700/50 rounded-md p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {/* Completion Checkbox */}
                      <button
                        onClick={() => handleToggleCompletion(habit.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-400 hover:border-green-400 hover:bg-green-400/10'
                        }`}
                      >
                        {isCompleted && (
                          <CheckIcon className="w-4 h-4" />
                        )}
                      </button>

                      {/* Habit Name */}
                      <div className="flex items-center gap-2">
                        {habit.isFavorite && (
                          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                          </svg>
                        )}
                        <span className={`font-medium ${
                          isCompleted ? 'text-gray-400 line-through' : 'text-white'
                        }`}>
                          {habit.name}
                        </span>
                      </div>
                    </div>

                    {/* Streak and Actions */}
                    <div className="flex items-center gap-3">
                      {/* Streak Display */}
                      <div className="flex items-center gap-2">
                        {habit.streak > 0 && (
                          <div className="flex items-center gap-1 text-orange-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8z"/>
                            </svg>
                            <span className="text-sm font-medium">{habit.streak}</span>
                          </div>
                        )}
                        <span className="text-gray-300 text-sm">
                          {habit.streak === 0 ? '0 days' : `${habit.streak} day${habit.streak !== 1 ? 's' : ''}`}
                        </span>
                      </div>


                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>




    </>
  );
} 