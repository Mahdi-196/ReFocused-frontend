"use client";

import React from "react";
import { Lightbulb, Heart, BarChart3, Plus, Loader2, AlertCircle, Edit } from "lucide-react";
import type { GratitudeEntry } from "../types";
import { WRITING_PROMPTS } from "../utils";

interface SidebarProps {
  gratitudes: GratitudeEntry[];
  onAddGratitude: (text: string) => Promise<boolean>;
  onEditGratitude?: (id: number, text: string) => Promise<boolean>;
  totalEntries: number;
  totalGratitudes: number;
  isLoadingGratitudes?: boolean;
  gratitudeError?: string | null;
  onClearGratitudeError?: () => void;
}

/**
 * Sidebar component containing writing prompts, gratitude, and journal statistics
 * Provides inspiration and tracking features for journaling with backend integration
 */
export const Sidebar: React.FC<SidebarProps> = ({
  gratitudes,
  onAddGratitude,
  onEditGratitude,
  totalEntries,
  totalGratitudes,
  isLoadingGratitudes = false,
  gratitudeError = null,
  onClearGratitudeError
}) => {
  const [isAddingGratitude, setIsAddingGratitude] = React.useState(false);
  const [newGratitude, setNewGratitude] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [editingGratitudeId, setEditingGratitudeId] = React.useState<number | null>(null);
  const [editingText, setEditingText] = React.useState("");
  const [autoSaveTimeout, setAutoSaveTimeout] = React.useState<NodeJS.Timeout | null>(null);
  const [isAutoSaving, setIsAutoSaving] = React.useState(false);

  const handleAddGratitude = async () => {
    if (!newGratitude.trim() || isSaving) return;

    // Check if already at maximum of 3 gratitudes
    if (gratitudes.length >= 3) {
      alert("You can only have up to 3 gratitude entries. Please delete one before adding a new one.");
      return;
    }

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

  const handleEditGratitude = (gratitude: GratitudeEntry) => {
    setEditingGratitudeId(gratitude.id);
    setEditingText(gratitude.text);
  };

  const handleSaveEdit = async () => {
    if (!editingGratitudeId || isSaving || !onEditGratitude) return;

    setIsSaving(true);
    setIsAutoSaving(true);
    try {
      const success = await onEditGratitude(editingGratitudeId, editingText.trim());
      // Don't close editing mode, just save the changes
    } catch (error) {
      console.error("Failed to edit gratitude:", error);
    } finally {
      setIsSaving(false);
      setIsAutoSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingGratitudeId(null);
    setEditingText("");
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
      setAutoSaveTimeout(null);
    }
  };

  const handleTextChange = (newText: string) => {
    setEditingText(newText);
    
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Set new timeout for 2 seconds
    const timeout = setTimeout(() => {
      handleSaveEdit();
    }, 2000);
    
    setAutoSaveTimeout(timeout);
  };

  const handleBlur = () => {
    // Close editing mode when user clicks outside
    if (editingText.trim()) {
      handleSaveEdit();
    }
    handleCancelEdit();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAddGratitude();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

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

      {/* Gratitude Section */}
      <div 
        className="p-6 rounded-xl shadow-lg border border-gray-600 transition-all duration-300 hover:shadow-xl"
        style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Heart className="text-red-400" size={24} />
          <h2 className="text-xl font-semibold text-white">Gratitude</h2>
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
                    {editingGratitudeId === gratitude.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => handleTextChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          onBlur={handleBlur}
                          placeholder="Edit your gratitude..."
                          className="w-full p-3 text-base bg-gray-600 text-white placeholder-gray-400 rounded-lg border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={2}
                          maxLength={125}
                          autoFocus
                        />
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">Maximum 125 characters</span>
                          <span className={`${editingText.length > 110 ? 'text-yellow-400' : 'text-gray-400'}`}>
                            {editingText.length}/125
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => handleEditGratitude(gratitude)}
                        className="cursor-pointer hover:bg-gray-600/30 transition-colors rounded p-2 -m-2"
                      >
                        <p className="text-base text-gray-300 leading-relaxed break-words overflow-hidden">{gratitude.text}</p>
                      </div>
                    )}
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
              maxLength={125}
              autoFocus
              disabled={isSaving}
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Maximum 125 characters</span>
              <span className={`${newGratitude.length > 110 ? 'text-yellow-400' : 'text-gray-400'}`}>
                {newGratitude.length}/125
              </span>
            </div>
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
            disabled={isLoadingGratitudes || gratitudes.length >= 3}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            aria-label="Add new gratitude entry"
          >
            <Plus size={18} />
            {gratitudes.length >= 3 ? "Maximum 3 gratitude entries" : "Add Gratitude"}
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