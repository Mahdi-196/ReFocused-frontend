import React, { useState, useMemo, useEffect } from 'react';
import { UserHabit, SimpleFilter } from '../types';
import { FireIcon } from '@/components/icons';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Bookmark, Trash2 } from 'lucide-react';
import ConfirmationDialog from '@/components/ConfirmationDialog';

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
  const [editDialog, setEditDialog] = useState<{
    isOpen: boolean;
    habit: UserHabit | null;
  }>({ isOpen: false, habit: null });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    habit: UserHabit | null;
  }>({ isOpen: false, habit: null });
  const [pinError, setPinError] = useState('');

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

  const openEditDialog = (habitId: number) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      setEditDialog({
        isOpen: true,
        habit: habit
      });
    }
  };

  const handlePinToggle = async () => {
    if (!editDialog.habit) return;
    
    const habit = editDialog.habit;
    
    // Check if we're trying to pin and already have 3 pinned habits
    if (!habit.isFavorite) {
      const pinnedCount = habits.filter(h => h.isFavorite).length;
      if (pinnedCount >= 3) {
        setPinError('You can only pin up to 3 habits at a time.');
        setTimeout(() => setPinError(''), 3000);
        return;
      }
    }
    
    await onToggleFavorite(habit.id);
    setEditDialog({ isOpen: false, habit: null });
  };

  const handleDeleteFromEdit = async () => {
    if (!editDialog.habit) return;
    
    const habit = editDialog.habit;
    setEditDialog({ isOpen: false, habit: null });
    
    // If habit has streak >= 1, show confirmation dialog
    if (habit.streak >= 1) {
      setDeleteConfirmation({
        isOpen: true,
        habit: habit
      });
    } else {
      // Delete immediately for habits with 0 streak
      await onDeleteHabit(habit.id);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation.habit) {
      await onDeleteHabit(deleteConfirmation.habit.id);
    }
    setDeleteConfirmation({ isOpen: false, habit: null });
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
            {pinError && (
              <p className="text-yellow-400 text-sm mt-2">{pinError}</p>
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
                        className="w-6 h-6 flex items-center justify-center transition-colors"
                        aria-label={isCompleted ? 'Completed' : 'Mark complete'}
                      >
                        <motion.span
                          key={isCompleted ? 'done' : 'todo'}
                          initial={{ scale: 0.85, rotate: -8, opacity: 0.85 }}
                          animate={{ scale: 1, rotate: 0, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                        >
                          <CheckCircle
                            className={`w-6 h-6 ${
                              isCompleted ? 'text-[#06DF73]' : 'text-gray-400'
                            }`}
                          />
                        </motion.span>
                      </button>

                      {/* Habit Name */}
                      <div className="flex items-center gap-2">
                        {habit.isFavorite && (
                          <Bookmark 
                            size={16} 
                            className="text-blue-400" 
                            fill="currentColor"
                          />
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
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-gray-300">{habit.streak}</span>
                            <span className="text-gray-300 text-sm">
                              day{habit.streak !== 1 ? 's' : ''}
                            </span>
                            <FireIcon className="w-4 h-4 text-red-500" />
                          </div>
                        )}
                      </div>

                      {/* Edit Button */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(habit.id);
                          }}
                          className="p-1 rounded hover:bg-gray-600 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                          title="Edit habit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Edit Habit Dialog */}
      {editDialog.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50" onClick={() => setEditDialog({ isOpen: false, habit: null })}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[4px]" aria-hidden="true" />
          <div 
            className="bg-[#1E2938] backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl w-[400px] overflow-hidden relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setEditDialog({ isOpen: false, habit: null })}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center transition-colors z-10"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="p-6 pb-4">
              <h3 className="text-xl font-bold text-white text-center">Edit Habit</h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                {editDialog.habit?.isFavorite && (
                  <Bookmark 
                    size={16} 
                    className="text-blue-400" 
                    fill="currentColor"
                  />
                )}
                <p className="text-sm text-gray-400">
                  {editDialog.habit?.name}
                </p>
              </div>
            </div>
            
            {/* Body */}
            <div className="px-6 pb-6">
              {/* Streak */}
              {editDialog.habit && editDialog.habit.streak > 0 && (
                <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-3 mb-3">
                  <div className="flex items-center justify-center gap-2">
                    <FireIcon className="w-4 h-4 text-red-500" />
                    <span className="text-white font-medium">{editDialog.habit.streak} {editDialog.habit.streak === 1 ? 'day' : 'days'} streak</span>
                    <FireIcon className="w-4 h-4 text-red-500" />
                  </div>
                </div>
              )}

              {/* Pinned status */}
              <p className="text-xs text-gray-400 text-center mb-4">
                {editDialog.habit?.isFavorite ? 'This habit is pinned to the top' : 'Pin this habit to appear at the top of your list'}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3">
                {/* Left side: Pin/Unpin and Cancel */}
                <div className="flex items-center gap-2">
                  {/* Pin / Unpin */}
                  <button
                    onClick={handlePinToggle}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-blue-300 hover:text-white border border-blue-500/30 hover:border-blue-500/60 bg-blue-500/10 hover:bg-blue-500/20 transition-colors active:scale-95"
                  >
                    <Bookmark 
                      size={14} 
                      fill={editDialog.habit?.isFavorite ? 'currentColor' : 'none'}
                    />
                    {editDialog.habit?.isFavorite ? 'Unpin' : 'Pin'}
                  </button>

                  {/* Cancel */}
                  <button
                    onClick={() => setEditDialog({ isOpen: false, habit: null })}
                    className="px-4 py-2 text-gray-300 hover:text-white bg-gray-700/40 hover:bg-gray-600/50 border border-gray-600/40 rounded-xl transition-colors active:scale-95"
                  >
                    Cancel
                  </button>
                </div>

                {/* Right side: Delete */}
                <button
                  onClick={handleDeleteFromEdit}
                  className="inline-flex items-center gap-2 px-4 py-2 text-red-300 hover:text-white border border-red-500/30 hover:border-red-500/60 bg-red-500/10 hover:bg-red-500/20 transition-colors active:scale-95"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, habit: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Habit"
        message={`Are you sure you want to delete "${deleteConfirmation.habit?.name}"? This habit has a ${deleteConfirmation.habit?.streak} day streak that will be lost.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
} 