"use client";

import React from "react";
import { Search, Plus } from "lucide-react";
import type { Collection } from "../types";

interface SearchAndActionsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCollection: Collection | null;
  onAddNewEntry: () => void;
  selectedCollectionId: string | null;
  isLoading?: boolean;
}

/**
 * Search bar and action buttons for journal entries
 * Provides entry search functionality and quick access to create new entries
 */
export const SearchAndActions: React.FC<SearchAndActionsProps> = ({
  searchQuery,
  onSearchChange,
  selectedCollection,
  onAddNewEntry,
  selectedCollectionId,
  isLoading = false
}) => {
  return (
    <div 
      className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
      style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
    >
      <div className="relative flex-1 max-w-md">
        <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder={`Search in ${selectedCollection?.name || 'all notes'}...`}
          className="w-full pl-12 pr-5 py-3 border border-gray-600 bg-gray-700/50 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base transition-all duration-200 ease-in-out"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={!selectedCollection}
          aria-label="Search journal entries"
        />
      </div>

      <button
        onClick={onAddNewEntry}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-base font-medium"
        title="Add New Entry"
        aria-label="Create a new journal entry"
        disabled={!selectedCollectionId}
      >
        <Plus size={20} /> New Entry
      </button>
    </div>
  );
}; 