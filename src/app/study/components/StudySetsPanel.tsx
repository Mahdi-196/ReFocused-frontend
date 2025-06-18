"use client";

import React from 'react';

type Card = {
  id: string;
  front: string;
  back: string;
};

type StudySet = {
  id: string;
  name: string;
  cards: Card[];
  user_id?: string | number;
  last_updated?: string;
};

interface StudySetsPanelProps {
  studySets: StudySet[];
  selectedSetId: string | null;
  isLoading: boolean;
  error: string | null;
  onSetSelect: (setId: string) => void;
  onNewSet: () => void;
  onEditSet: (setId: string, setName: string) => void;
}

export default function StudySetsPanel({
  studySets,
  selectedSetId,
  isLoading,
  error,
  onSetSelect,
  onNewSet,
  onEditSet
}: StudySetsPanelProps) {
  return (
    <div 
      className="rounded-lg p-4 shadow-md"
      style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Study Sets</h2>
        <button 
          onClick={onNewSet}
          className="flex items-center gap-1 px-3 py-1 border border-gray-600 rounded-lg hover:bg-gray-700 text-sm active:scale-95 transform transition-all duration-75 text-white"
          aria-label="Create New Study Set"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Set
        </button>
      </div>
      
      {/* Status Messages */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin h-5 w-5 mx-auto mb-2 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-300 text-sm">Loading study sets...</p>
        </div>
      )}
      
      {error && (
        <div className="text-red-400 bg-red-900/20 p-2 rounded mb-2 text-sm">
          {error}
        </div>
      )}
      
      {/* Study Sets List */}
      <div className="space-y-2 overflow-y-auto h-60 border border-gray-600 rounded-lg p-2">
        {!isLoading && studySets.length === 0 && (
          <p className="text-gray-300 text-center py-4">
            No study sets yet. Create your first set!
          </p>
        )}
        
        {studySets.map(set => (
          <div
            key={set.id}
            className={`group relative flex items-center justify-between w-full px-3 py-2 rounded-md ${
              selectedSetId === set.id 
                ? 'bg-blue-800/50 text-white' 
                : 'hover:bg-gray-700/50 text-gray-300'
            }`}
          >
            <div className="flex-1 flex items-center justify-between">
              <button
                onClick={() => onSetSelect(set.id)}
                className="flex-1 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white">{set.name}</span>
                  <span className="text-sm text-white">{set.cards.length} cards</span>
                </div>
              </button>
              <button
                onClick={() => onEditSet(set.id, set.name)}
                className="ml-2 p-1.5 text-gray-400 hover:text-blue-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 