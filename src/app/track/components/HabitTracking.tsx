import React, { useState } from 'react';
import { UserHabit, SimpleFilter } from '../types';
import HabitModal from './HabitModal';

interface HabitTrackingProps {
  habits: UserHabit[];
  loading: boolean;
  onAddHabit: (habitName: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteHabit: (habitId: number) => Promise<{ success: boolean; error?: string }>;
  onToggleFavorite: (habitId: number) => Promise<{ success: boolean; error?: string }>;
}

export default function HabitTracking({
  habits,
  loading,
  onAddHabit,
  onDeleteHabit,
  onToggleFavorite
}: HabitTrackingProps) {
  const [newHabit, setNewHabit] = useState('');
  const [habitError, setHabitError] = useState('');
  const [simpleFilter, setSimpleFilter] = useState<SimpleFilter>('all');
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<UserHabit | null>(null);

  const handleAddHabit = async () => {
    console.log('🔤 Adding habit:', newHabit);
    const result = await onAddHabit(newHabit);
    
    if (result.success) {
      setSimpleFilter('all');
      setNewHabit('');
      setHabitError('');
    } else {
      setHabitError(result.error || 'Failed to add habit');
    }
  };

  const handleOpenHabitModal = (habit: UserHabit) => {
    setSelectedHabit(habit);
    setHabitModalOpen(true);
  };

  const handleCloseHabitModal = () => {
    setHabitModalOpen(false);
    setSelectedHabit(null);
  };

  const handleDeleteHabitFromModal = async () => {
    if (selectedHabit) {
      await onDeleteHabit(selectedHabit.id);
      handleCloseHabitModal();
    }
  };

  const handleToggleFavoriteFromModal = async () => {
    if (selectedHabit) {
      const result = await onToggleFavorite(selectedHabit.id);
      if (result.success) {
        handleCloseHabitModal();
      }
    }
  };

  // Filter functions
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

  // Sort habits to show favorites (pinned) at the top, then by streak length
  const sortedHabits = getFilteredHabits().sort((a, b) => {
    // First priority: pinned habits at the top
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    
    // Second priority: sort by streak length (highest first)
    return b.streak - a.streak;
  });

  return (
    <>
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

            {/* Habit List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {loading && <div className="text-center text-gray-400 py-8">Loading habits...</div>}
              {!loading && sortedHabits.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  {simpleFilter !== 'all' ? `No habits with ${simpleFilter === 'active' ? 'active streaks' : 'zero streaks'}` : 'No habits yet'}
                </div>
              ) : (
                sortedHabits.map((habit) => (
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
                        onClick={() => handleOpenHabitModal(habit)}
                        className="text-gray-400 hover:text-blue-400 transition-all p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-600"
                        title="Edit habit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Habit Management Modal */}
      <HabitModal
        isOpen={habitModalOpen}
        habit={selectedHabit}
        habits={habits}
        onClose={handleCloseHabitModal}
        onDelete={handleDeleteHabitFromModal}
        onToggleFavorite={handleToggleFavoriteFromModal}
      />

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
    </>
  );
} 