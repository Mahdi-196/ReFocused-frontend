"use client";

import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import Login from './Login';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent background scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogin = () => {
    // Close modal and redirect to app
    onClose();
    if (onLoginSuccess) {
      onLoginSuccess();
    } else {
      // Default behavior: redirect to app
      window.location.href = '/app';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-10 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition-colors"
          aria-label="Close modal"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Modal content */}
        <div className="bg-[#1a2332] rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-[#42b9e5]/10 to-[#4f83ed]/10 border-b border-gray-700/50">
            <h2 className="text-2xl font-bold text-white text-center">
              Welcome to <span className="bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] bg-clip-text text-transparent">ReFocused</span>
            </h2>
            <p className="text-slate-300 text-center mt-2">Sign in to start your productivity journey</p>
          </div>

          {/* Login component with dark styling */}
          <div className="p-6">
            <div className="w-full max-w-md mx-auto">
              <Login onLogin={handleLogin} darkMode={true} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700/50 text-center">
            <p className="text-slate-400 text-sm">
              Don't have an account?{' '}
              <button 
                onClick={() => {
                  // You can add registration modal logic here later
                  onClose();
                  window.location.href = '/app'; // For now, redirect to app
                }}
                className="text-[#42b9e5] hover:text-[#4f83ed] transition-colors"
              >
                Sign up here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 