"use client";

import React from "react";
import { X, Lock } from "lucide-react";
import type { Collection, CollectionFormData } from "../types";

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  formData: CollectionFormData;
  onFormChange: (updates: Partial<CollectionFormData>) => void;
  editingCollection?: Collection | null;
  passwordError?: string;
  nameExists?: boolean;
  isLoading?: boolean;
}

/**
 * Modal component for creating and editing journal collections
 * Handles both public and private collection creation with password protection
 */
export const CollectionModal: React.FC<CollectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  formData,
  onFormChange,
  editingCollection,
  passwordError,
  nameExists,
  isLoading
}) => {
  if (!isOpen) return null;

  // ✅ Defensive programming: ensure formData has required properties
  const safeFormData: CollectionFormData = {
    name: formData?.name || "",
    isPrivate: formData?.isPrivate || false,
    password: formData?.password || "",
    currentPassword: formData?.currentPassword || ""
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // ✅ Safe trim check
    if (e.key === 'Enter' && safeFormData.name.trim() && !nameExists) {
      onSubmit();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[6px]" aria-hidden="true" />
      <div 
        className="relative w-[400px] rounded-2xl shadow-2xl overflow-hidden p-6 text-white transition-all duration-300 transform animate-in fade-in slide-in-from-bottom-4 border border-gray-700/50"
        style={{ backgroundColor: '#1E2938' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors transform hover:scale-110"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <label htmlFor="collectionName" className="block text-sm font-medium text-gray-300 mb-2">
            Collection Name
          </label>
          <div className="relative">
            <input
              type="text"
              id="collectionName"
              value={safeFormData.name}
              onChange={(e) => onFormChange({ name: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="Enter collection name..."
              disabled={editingCollection?.name === "My Notes"}
              className={`w-full pl-3 pr-10 py-2 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                editingCollection?.name === "My Notes"
                  ? 'bg-gray-600 border-gray-500 cursor-not-allowed opacity-75'
                  : 'bg-gray-700'
              } ${
                safeFormData.name.trim() && nameExists
                  ? 'border-red-400 focus:ring-red-500'
                  : 'border-gray-600'
              }`}
              autoFocus={editingCollection?.name !== "My Notes"}
            />
            <button
              type="button"
              onClick={() => onFormChange({ isPrivate: !safeFormData.isPrivate })}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all duration-200 transform hover:scale-110 ${
                safeFormData.isPrivate 
                  ? 'text-blue-400 hover:text-blue-300 bg-blue-500/20'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-600/50'
              }`}
              title={safeFormData.isPrivate ? "Private Collection" : "Public Collection"}
            >
              <Lock size={16} />
            </button>
          </div>

          {/* Current Password Field for Editing Private Collections */}
          {editingCollection?.isPrivate && (
            <div className="mt-4">
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={safeFormData.currentPassword}
                onChange={(e) => onFormChange({ currentPassword: e.target.value })}
                placeholder="Enter current password..."
                className="w-full pl-3 pr-4 py-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          )}

          {/* New Password Field for Private Collections */}
          {safeFormData.isPrivate && (
            <div className="mt-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                {editingCollection ? "New Password (leave blank to keep current)" : "Password"}
              </label>
              <input
                type="password"
                id="password"
                value={safeFormData.password}
                onChange={(e) => onFormChange({ password: e.target.value })}
                placeholder={editingCollection ? "Enter new password..." : "Enter password..."}
                className="w-full pl-3 pr-4 py-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          )}

          {/* Error Messages */}
          {passwordError && (
            <p className="mt-2 text-sm text-red-400">
              {passwordError}
            </p>
          )}

          {/* Default Collection Info */}
          {editingCollection?.name === "My Notes" && (
            <p className="mt-2 text-sm text-blue-400 flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-blue-400"></span>
              This is your default collection and cannot be renamed or deleted
            </p>
          )}

          {/* Name Validation Message */}
          {safeFormData.name.trim() && nameExists && (
            <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-red-400"></span>
              This collection name already exists
            </p>
          )}

          {/* Privacy Info */}
          <p className="mt-2 text-xs text-gray-400">
            {safeFormData.isPrivate 
              ? "This collection will be private and password protected (letters and numbers only)"
              : "This collection will be visible to everyone"}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 rounded-md transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!safeFormData.name.trim() || nameExists || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 active:scale-95 disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {editingCollection ? "Updating..." : "Creating..."}
              </div>
            ) : (
              editingCollection ? "Update" : "Create"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 