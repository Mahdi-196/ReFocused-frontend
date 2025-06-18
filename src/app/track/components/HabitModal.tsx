import React from 'react';
import { UserHabit } from '../types';

interface HabitModalProps {
  isOpen: boolean;
  habit: UserHabit | null;
  habits: UserHabit[];
  onClose: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

export default function HabitModal({ 
  isOpen, 
  habit, 
  habits, 
  onClose, 
  onDelete, 
  onToggleFavorite 
}: HabitModalProps) {
  if (!isOpen || !habit) return null;

  const currentFavoriteCount = habits.filter(h => h.isFavorite).length;
  const isAtLimit = currentFavoriteCount >= 3;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="bg-gray-800 text-white rounded-lg p-6 w-96 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Manage Habit</h3>
        <div className="mb-6">
          <p className="text-gray-300 text-center mb-2">
            What would you like to do with <span className="text-white font-medium">"{habit.name}"</span>?
          </p>
          {(() => {
            if (habit.isFavorite) {
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
            onClick={onDelete}
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
              onClick={onToggleFavorite}
              disabled={!habit.isFavorite && isAtLimit}
              className={`flex items-center gap-2 px-4 py-2 rounded-md active:scale-95 transform transition-all duration-75 disabled:opacity-50 disabled:cursor-not-allowed ${
                habit.isFavorite
                  ? 'text-blue-300 hover:text-blue-200 hover:bg-blue-900/20'
                  : 'text-gray-300 hover:text-blue-300 hover:bg-blue-900/20'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {habit.isFavorite ? 'Unpin' : 'Pin to Top'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-md active:scale-95 transform transition-transform duration-75"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 