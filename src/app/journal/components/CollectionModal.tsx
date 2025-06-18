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
  nameExists
}) => {
  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && formData.name.trim() && !nameExists) {
      onSubmit();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" aria-hidden="true" />
      <div 
        className="bg-gray-800 text-white rounded-lg shadow-xl w-[400px] p-6 border border-gray-600 relative transition-all duration-300 transform animate-in fade-in slide-in-from-bottom-4"
        onClick={e => e.stopPropagation()}
        style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
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
              value={formData.name}
              onChange={(e) => onFormChange({ name: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="Enter collection name..."
              className={`w-full pl-3 pr-10 py-2 border rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                formData.name.trim() && nameExists
                  ? 'border-red-400 focus:ring-red-500'
                  : 'border-gray-600'
              }`}
              autoFocus
            />
            <button
              type="button"
              onClick={() => onFormChange({ isPrivate: !formData.isPrivate })}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all duration-200 transform hover:scale-110 ${
                formData.isPrivate 
                  ? 'text-blue-400 hover:text-blue-300 bg-blue-500/20'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-600/50'
              }`}
              title={formData.isPrivate ? "Private Collection" : "Public Collection"}
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
                value={formData.currentPassword}
                onChange={(e) => onFormChange({ currentPassword: e.target.value })}
                placeholder="Enter current password..."
                className="w-full pl-3 pr-4 py-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          )}

          {/* New Password Field for Private Collections */}
          {formData.isPrivate && (
            <div className="mt-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                {editingCollection ? "New Password (leave blank to keep current)" : "Password"}
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
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

          {/* Name Validation Message */}
          {formData.name.trim() && nameExists && (
            <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-red-400"></span>
              This collection name already exists
            </p>
          )}

          {/* Privacy Info */}
          <p className="mt-2 text-xs text-gray-400">
            {formData.isPrivate 
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
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 active:scale-95"
          >
            {editingCollection ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}; 