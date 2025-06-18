"use client";

import React from "react";
import { X } from "lucide-react";
import type { PasswordPrompt } from "../types";

interface PasswordPromptModalProps {
  passwordPrompt: PasswordPrompt | null;
  enteredPassword: string;
  onPasswordChange: (password: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

/**
 * Modal component for entering passwords to access private collections
 * Provides secure password entry with keyboard navigation support
 */
export const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({
  passwordPrompt,
  enteredPassword,
  onPasswordChange,
  onSubmit,
  onClose
}) => {
  if (!passwordPrompt) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
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
          <h3 className="text-lg font-semibold text-white">
            Enter Password for {passwordPrompt.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors transform hover:scale-110"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <label htmlFor="collectionPassword" className="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <input
            type="password"
            id="collectionPassword"
            value={enteredPassword}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Enter password..."
            className="w-full pl-3 pr-4 py-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            onKeyDown={handleKeyDown}
            autoFocus
          />
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
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
}; 