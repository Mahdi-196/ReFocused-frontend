"use client";

import React from "react";
import { Lightbulb, Heart, BarChart3, Plus, Loader2, AlertCircle } from "lucide-react";
import type { GratitudeEntry } from "../types";
import { WRITING_PROMPTS } from "../utils";

interface SidebarProps {
  gratitudes: GratitudeEntry[];
  onAddGratitude: (text: string) => Promise<boolean>;
  totalEntries: number;
  totalGratitudes: number;
  isLoadingGratitudes?: boolean;
  gratitudeError?: string | null;
  onClearGratitudeError?: () => void;
}

/**
 * Sidebar component containing writing prompts, gratitude log, and journal statistics
 * Provides inspiration and tracking features for journaling with backend integration
 */
export const Sidebar: React.FC<SidebarProps> = ({
  gratitudes,
  onAddGratitude,
  totalEntries,
  totalGratitudes,
  isLoadingGratitudes = false,
  gratitudeError = null,
  onClearGratitudeError
}) => {
  const [isAddingGratitude, setIsAddingGratitude] = React.useState(false);
  const [newGratitude, setNewGratitude] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const handleAddGratitude = async () => {
    if (!newGratitude.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const success = await onAddGratitude(newGratitude.trim());
      if (success) {
        setNewGratitude("");
        setIsAddingGratitude(false);
      }
    } catch (error) {
      console.error("Failed to add gratitude:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsAddingGratitude(false);
    setNewGratitude("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAddGratitude();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="flex-1 xl:max-w-sm space-y-8">
      {/* Writing Prompts Section */}
      <div 
        className="p-6 rounded-xl shadow-lg border border-gray-600 transition-all duration-300 hover:shadow-xl"
        style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Lightbulb className="text-yellow-400" size={24} />
          <h2 className="text-xl font-semibold text-white">Writing Prompts</h2>
        </div>
        <div className="space-y-4">
          {WRITING_PROMPTS.map((prompt, index) => (
            <div 
              key={index} 
              className="text-base text-gray-300 hover:text-white transition-colors cursor-pointer py-3 px-4 rounded-lg hover:bg-gray-700/50 border border-transparent hover:border-gray-600"
            >
              {prompt}
            </div>
          ))}
        </div>
      </div>

      {/* Gratitude Log Section */}
      <div 
        className="p-6 rounded-xl shadow-lg border border-gray-600 transition-all duration-300 hover:shadow-xl"
        style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Heart className="text-red-400" size={24} />
          <h2 className="text-xl font-semibold text-white">Gratitude Log</h2>
        </div>

        {/* Error Display */}
        {gratitudeError && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-red-400 mr-2" />
              <span className="text-red-200 text-sm">{gratitudeError}</span>
              {onClearGratitudeError && (
                <button
                  onClick={onClearGratitudeError}
                  className="ml-auto text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoadingGratitudes ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-400">Loading gratitudes...</span>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {gratitudes.length > 0 ? (
                gratitudes.slice(0, 4).map((gratitude) => (
                  <div key={gratitude.id} className="bg-gray-700/30 p-4 rounded-lg border border-gray-600/50">
                    <p className="text-base text-gray-300 mb-2 leading-relaxed">{gratitude.text}</p>
                    <span className="text-sm text-gray-500">
                      {gratitude.date || new Date(gratitude.createdAt || '').toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Heart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No gratitudes yet</p>
                  <p className="text-sm text-gray-500">Start by adding what you're grateful for</p>
                </div>
              )}
            </div>
          </>
        )}
        
        {isAddingGratitude ? (
          <div className="space-y-3">
            <textarea
              value={newGratitude}
              onChange={(e) => setNewGratitude(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="What are you grateful for?"
              className="w-full p-4 text-base bg-gray-700 text-white placeholder-gray-400 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              autoFocus
              disabled={isSaving}
            />
            <div className="flex gap-3">
              <button
                onClick={handleAddGratitude}
                disabled={!newGratitude.trim() || isSaving}
                className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Add'
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-gray-500">Tip: Press Cmd/Ctrl+Enter to save, Esc to cancel</p>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingGratitude(true)}
            disabled={isLoadingGratitudes}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            aria-label="Add new gratitude entry"
          >
            <Plus size={18} />
            Add Gratitude
          </button>
        )}
      </div>

      {/* Journal Stats Section */}
      <div 
        className="p-6 rounded-xl shadow-lg border border-gray-600 transition-all duration-300 hover:shadow-xl"
        style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="text-green-400" size={24} />
          <h2 className="text-xl font-semibold text-white">Journal Stats</h2>
        </div>
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">15</div>
            <div className="text-base text-gray-400">Day Streak</div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{totalEntries}</div>
              <div className="text-sm text-gray-400">Total Entries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{totalGratitudes}</div>
              <div className="text-sm text-gray-400">Gratitudes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 