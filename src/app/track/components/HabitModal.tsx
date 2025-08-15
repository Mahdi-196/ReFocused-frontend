"use client";

import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Pin, PinOff, Trash2 } from 'lucide-react';
import { FireIcon } from '@/components/icons';
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
  if (!isOpen || !habit || typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[4px]" aria-hidden="true" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-gradient-to-br from-gray-900/95 to-slate-900/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center transition-colors z-10"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-300" />
            </button>

            {/* Header */}
            <div className="p-6 pb-4">
              <h3 className="text-xl font-bold text-white text-center">Edit Habit</h3>
              <p className="text-sm text-gray-400 text-center mt-1">
                {`\"${habit.name}\"`}
              </p>
            </div>

            {/* Body */}
            <div className="px-6 pb-6">
              {/* Streak */}
              <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-3 mb-3">
                <div className="flex items-center justify-center gap-2">
                  {habit.streak > 0 ? (
                    <>
                      <FireIcon className="w-4 h-4 text-red-500" />
                      <span className="text-white font-medium">{habit.streak} {habit.streak === 1 ? 'day' : 'days'} streak</span>
                      <FireIcon className="w-4 h-4 text-red-500" />
                    </>
                  ) : (
                    <span className="text-gray-400">No current streak</span>
                  )}
                </div>
              </div>

              {/* Pinned status */}
              <p className="text-xs text-gray-400 text-center mb-4">
                {habit.isFavorite ? 'This habit is pinned to the top' : 'Pin this habit to appear at the top of your list'}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3">
                {/* Left side: Pin/Unpin and Cancel */}
                <div className="flex items-center gap-2">
                  {/* Pin / Unpin */}
                  <button
                    onClick={onToggleFavorite}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-blue-300 hover:text-white border border-blue-500/30 hover:border-blue-500/60 bg-blue-500/10 hover:bg-blue-500/20 transition-colors active:scale-95"
                  >
                    {habit.isFavorite ? (
                      <>
                        <PinOff className="w-4 h-4" />
                        Unpin
                      </>
                    ) : (
                      <>
                        <Pin className="w-4 h-4" />
                        Pin
                      </>
                    )}
                  </button>

                  {/* Cancel */}
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-300 hover:text-white bg-gray-700/40 hover:bg-gray-600/50 border border-gray-600/40 rounded-xl transition-colors active:scale-95"
                  >
                    Cancel
                  </button>
                </div>

                {/* Right side: Delete */}
                <button
                  onClick={onDelete}
                  className="inline-flex items-center gap-2 px-4 py-2 text-red-300 hover:text-white border border-red-500/30 hover:border-red-500/60 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}