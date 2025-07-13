"use client";

import React from "react";
import { Plus, Edit, Lock, FileText } from "lucide-react";
import type { Collection, DropdownState } from "../types";

interface CollectionTabsProps {
  collections: Collection[];
  selectedCollectionId: string | null;
  onCollectionSelect: (collectionId: string) => void;
  onAddCollection: () => void;
  onOpenDropdown: (dropdownState: DropdownState | null) => void;
  openDropdown: DropdownState | null;
  isLoading?: boolean;
}

/**
 * Collection navigation tabs with add/edit functionality
 * Displays collection tabs with privacy indicators and edit controls
 */
export const CollectionTabs: React.FC<CollectionTabsProps> = ({
  collections,
  selectedCollectionId,
  onCollectionSelect,
  onAddCollection,
  onOpenDropdown,
  openDropdown,
  isLoading = false
}) => {
  const handleEditClick = (e: React.MouseEvent, collection: Collection) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const nextState = openDropdown?.id === collection.id.toString() ? null : { 
      type: 'collection' as const, 
      id: collection.id.toString(), 
      rect: rect, 
      collection: collection 
    };
    onOpenDropdown(nextState);
  };

  return (
    <div 
      className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between mb-6 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
      style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
    >
      <div className="flex items-center space-x-2 border border-gray-600 rounded-lg p-2 bg-gray-700/50 overflow-x-auto mb-4 lg:mb-0 lg:mr-4 flex-1">
        {collections.map(collection => (
          <button
            key={collection.id}
            className={`relative flex items-center justify-between px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
              selectedCollectionId === collection.id.toString()
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
            onClick={() => onCollectionSelect(collection.id.toString())}
          >
            <div className="flex items-center gap-2 pointer-events-none">
              {collection.isPrivate ? <Lock size={18} /> : <FileText size={18} />}
              <span className="truncate max-w-[180px]">{collection.name}</span>
            </div>
            {collection.name !== "My Notes" && (
              <div className="ml-2">
                <button
                  onClick={(e) => handleEditClick(e, collection)}
                  className="text-gray-400 hover:text-blue-400 transition-all duration-200 p-1 rounded-full hover:bg-gray-600/50 transform hover:scale-110"
                  title="Edit Collection"
                  aria-label={`Edit ${collection.name} collection`}
                >
                  <Edit size={16} />
                </button>
              </div>
            )}
          </button>
        ))}
        {collections.length === 0 && (
          <span className="px-5 py-2.5 text-base text-gray-400 italic">No collections yet.</span>
        )}
      </div>

      <button
        onClick={onAddCollection}
        className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 border-2 border-dashed border-gray-500 rounded-lg text-gray-300 hover:border-gray-400 hover:text-white transition-all duration-200 ease-in-out transform hover:scale-105"
        title="Add New Collection"
        aria-label="Add a new collection"
      >
        <Plus size={18} /> Add a Collection
      </button>
    </div>
  );
}; 