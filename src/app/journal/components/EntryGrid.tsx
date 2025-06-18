"use client";

import React from "react";
import { Calendar, Edit } from "lucide-react";
import type { Entry, Collection, DropdownState } from "../types";
import { getTimeAgo, formatEntryDate, getPreviewText } from "../utils";

interface EntryGridProps {
  entries: Entry[];
  selectedCollection: Collection | null;
  searchQuery: string;
  selectedCollectionId: string | null;
  onEditEntry: (entryId: string) => void;
  onOpenDropdown: (dropdownState: DropdownState | null) => void;
  openDropdown: DropdownState | null;
  collections: Collection[];
}

/**
 * Grid component for displaying journal entries with search and edit functionality
 * Shows entry previews with dates and provides quick access to editing
 */
export const EntryGrid: React.FC<EntryGridProps> = ({
  entries,
  selectedCollection,
  searchQuery,
  selectedCollectionId,
  onEditEntry,
  onOpenDropdown,
  openDropdown,
  collections
}) => {
  const handleEntryEditClick = (e: React.MouseEvent, entry: Entry) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const nextState = openDropdown?.id === entry.id ? null : { 
      type: 'entry' as const, 
      id: entry.id, 
      rect: rect, 
      collection: selectedCollection, 
      entry: entry 
    };
    onOpenDropdown(nextState);
  };

  // Show appropriate empty states
  if (selectedCollectionId && entries.length === 0) {
    return (
      <div 
        className="col-span-full text-center text-gray-300 py-20 rounded-xl shadow-lg border border-gray-600 transition-all duration-300 hover:shadow-xl"
        style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
      >
        <p className="text-xl mb-3">This collection is empty{searchQuery ? ' for your current search' : ''}.</p>
        <p className="text-base">Click "New Entry" to add a note!</p>
      </div>
    );
  }

  if (!selectedCollectionId && collections.length > 0) {
    return (
      <div 
        className="col-span-full text-center text-gray-300 py-20 rounded-xl shadow-lg border border-gray-600 transition-all duration-300 hover:shadow-xl"
        style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
      >
        <p className="text-xl mb-3">Select a collection from the tabs above to view entries.</p>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div 
        className="col-span-full text-center text-gray-300 py-20 rounded-xl shadow-lg border border-gray-600 transition-all duration-300 hover:shadow-xl"
        style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
      >
        <p className="text-xl mb-3">You don't have any collections yet.</p>
        <p className="text-base">Click "Add a Collection" to get started!</p>
      </div>
    );
  }

  return (
    <>
      {entries.map((entry) => {
        const previewText = getPreviewText(entry.content, 100);
        const entryDate = formatEntryDate(entry.createdAt);

        return (
          <div 
            key={entry.id} 
            className="p-6 rounded-xl shadow-lg border border-gray-600 flex flex-col justify-between transition-all duration-300 hover:shadow-xl transform hover:scale-105 cursor-pointer min-h-[200px]"
            style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
            onClick={() => onEditEntry(entry.id)}
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-white break-words">
                  {entry.title || "Untitled"}
                </h3>
                <div className="relative">
                  <button
                    onClick={(e) => handleEntryEditClick(e, entry)}
                    className="text-gray-400 hover:text-blue-400 transition-all duration-200 ease-in-out transform hover:scale-110"
                    title="Entry Options"
                    aria-label={`Options for ${entry.title || 'untitled entry'}`}
                  >
                    <Edit size={18} />
                  </button>
                </div>
              </div>
              <p className="text-base text-gray-300 mb-4 break-words leading-relaxed">
                {previewText}
              </p>
            </div>
            <div className="flex items-center text-sm text-gray-400 mt-auto pt-4 border-t border-gray-600">
              <Calendar size={16} className="mr-2 flex-shrink-0" />
              <span>{entryDate}</span>
              <span className="ml-auto text-sm text-gray-500">
                {getTimeAgo(entry.lastSavedAt)}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}; 