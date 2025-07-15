"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, CheckSquare, Target, BarChart3 } from 'lucide-react';
import { GoalType, CreateGoalRequest, validateGoalInput, sanitizeGoalName, getDurationDisplayName } from '@/types/goal';

interface GoalCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGoal: (data: CreateGoalRequest) => void;
  duration?: '2_week' | 'long_term'; // Allow parent to specify duration
}

const GoalCreationModal: React.FC<GoalCreationModalProps> = ({
  isOpen,
  onClose,
  onCreateGoal,
  duration = '2_week' // Default to 2-week goals
}) => {
  const [goalName, setGoalName] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('percentage');
  const [targetValue, setTargetValue] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Ensure goalName is a string
    const goalNameStr = typeof goalName === 'string' ? goalName : '';
    
    // Client-side validation
    const sanitizedName = sanitizeGoalName(goalNameStr);
    const validationError = validateGoalInput(sanitizedName, goalType, duration, targetValue);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const data: CreateGoalRequest = {
        name: sanitizedName,
        goal_type: goalType,
        duration: duration, // Use the prop or default value
        target_value: goalType === 'counter' ? targetValue : undefined
      };

      await onCreateGoal(data);
      handleClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setGoalName('');
    setGoalType('percentage');
    setTargetValue(10);
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleGoalTypeChange = (type: GoalType) => {
    setGoalType(type);
    setError(null); // Clear any existing errors
    
    // Set default target values based on type
    switch (type) {
      case 'percentage':
        // Percentage goals don't need a target value (always 100)
        setTargetValue(100);
        break;
      case 'counter':
        setTargetValue(10);
        break;
      case 'checklist':
        // Checklist goals don't need a target value (always 1)
        setTargetValue(1);
        break;
    }
  };

  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4" onClick={handleClose}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[4px]" aria-hidden="true" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-[70%] max-w-md bg-gradient-to-br from-gray-900/95 to-slate-900/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-300" />
            </button>

            {/* Header */}
            <div className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Create New Goal
                </h2>
                <p className="text-gray-400 text-sm">
                  Creating a {getDurationDisplayName(duration).toLowerCase()} goal
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Display */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-600/20 border border-red-500/30 rounded-xl"
                  >
                    <p className="text-red-300 text-xs">{error}</p>
                  </motion.div>
                )}

                {/* Goal Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    value={goalName}
                    onChange={(e) => {
                      // Ensure we always set a string value
                      const value = typeof e.target.value === 'string' ? e.target.value : '';
                      setGoalName(value);
                      setError(null);
                    }}
                    placeholder="Enter your goal name..."
                    className="w-full p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    required
                    disabled={isSubmitting}
                    maxLength={100}
                  />
                </div>

                {/* Goal Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Goal Type
                  </label>
                  <div className="space-y-2">
                    {/* Checklist Goal */}
                    <div
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        goalType === 'checklist'
                          ? 'border-blue-500/50 bg-blue-500/10 shadow-md shadow-blue-500/20'
                          : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600/50 hover:bg-gray-800/50'
                      }`}
                      onClick={() => !isSubmitting && handleGoalTypeChange('checklist')}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          value="checklist"
                          checked={goalType === 'checklist'}
                          onChange={() => handleGoalTypeChange('checklist')}
                          className="mr-3 accent-blue-500"
                          disabled={isSubmitting}
                        />
                                                  <div>
                            <div className="text-white text-sm font-medium flex items-center gap-2">
                              <CheckSquare className="w-4 h-4 text-green-400" />
                              Checklist
                            </div>
                            <div className="text-xs text-gray-400">Simple task - either done or not done</div>
                          </div>
                      </div>
                    </div>

                    {/* Counter Goal */}
                    <div
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        goalType === 'counter'
                          ? 'border-blue-500/50 bg-blue-500/10 shadow-md shadow-blue-500/20'
                          : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600/50 hover:bg-gray-800/50'
                      }`}
                      onClick={() => !isSubmitting && handleGoalTypeChange('counter')}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          value="counter"
                          checked={goalType === 'counter'}
                          onChange={() => handleGoalTypeChange('counter')}
                          className="mr-3 accent-blue-500"
                          disabled={isSubmitting}
                        />
                                                  <div>
                            <div className="text-white text-sm font-medium flex items-center gap-2">
                              <Target className="w-4 h-4 text-blue-400" />
                              Counter
                            </div>
                            <div className="text-xs text-gray-400">Set a target number and count up to it</div>
                          </div>
                      </div>
                    </div>

                    {/* Percentage Goal */}
                    <div
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        goalType === 'percentage'
                          ? 'border-blue-500/50 bg-blue-500/10 shadow-md shadow-blue-500/20'
                          : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600/50 hover:bg-gray-800/50'
                      }`}
                      onClick={() => !isSubmitting && handleGoalTypeChange('percentage')}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          value="percentage"
                          checked={goalType === 'percentage'}
                          onChange={() => handleGoalTypeChange('percentage')}
                          className="mr-3 accent-blue-500"
                          disabled={isSubmitting}
                        />
                                                  <div>
                            <div className="text-white text-sm font-medium flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-purple-400" />
                              Percentage
                            </div>
                            <div className="text-xs text-gray-400">Track progress from 0% to 100%</div>
                          </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Target Value Input (for counter goals) */}
                {goalType === 'counter' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Target Number
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="999"
                      step="1"
                      value={targetValue}
                      onChange={(e) => {
                        setTargetValue(parseInt(e.target.value) || 2);
                        setError(null);
                      }}
                      className="w-full p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      required
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Set your target number (2-999). You'll count up to this value.
                    </p>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-6 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-600/50 hover:text-white disabled:bg-gray-700/30 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!goalName || typeof goalName !== 'string' || !goalName.trim() || isSubmitting}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium shadow-lg shadow-blue-500/20"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <span>🎯</span>
                        Create Goal
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default GoalCreationModal; 