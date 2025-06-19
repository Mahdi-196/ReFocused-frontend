'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FiMail, FiLock, FiUser, FiEye, FiEyeOff } from './icons';
import GoogleSignInButton from './GoogleSignInButton';
import client from '@/api/client';
import { AUTH } from '@/api/endpoints';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens/closes or tab changes
  useEffect(() => {
    if (isOpen) {
      setFormData({ email: '', password: '', name: '' });
      setError('');
      setShowPassword(false);
    }
  }, [isOpen, activeTab]);

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleSuccess = (token: string) => {
    setError('');
    localStorage.setItem('REF_TOKEN', token);
    onClose();
    // Use Next.js router for client-side navigation
    window.location.reload();
  };

  const handleGoogleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const endpoint = activeTab === 'login' ? AUTH.LOGIN : AUTH.REGISTER;
      const response = await client.post(endpoint, formData);
      
      const token = response.data.access_token;
      
      if (!token) {
        throw new Error('No access token received from server');
      }
      
      // Store token and set auth header
      localStorage.setItem('REF_TOKEN', token);
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Close modal and reload to update auth state
      onClose();
      window.location.reload();
    } catch (err: unknown) {
      console.error(`${activeTab} error:`, err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(`${activeTab === 'login' ? 'Login' : 'Registration'} failed. Please try again.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Swoosh animation variants
  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: -50,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 25,
        stiffness: 300,
        duration: 0.6,
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Modal */}
          <motion.div
            ref={modalRef}
            className="relative w-full max-w-md bg-gradient-to-br from-[#10182B] to-[#0c1324] rounded-2xl shadow-2xl border border-gray-600/30 overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all duration-200"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="p-8 pb-0">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] bg-clip-text text-transparent mb-2">
                  Welcome to ReFocused
                </h2>
                <p className="text-gray-400">
                  {activeTab === 'login' 
                    ? 'Sign in to continue your journey' 
                    : 'Create your account to get started'
                  }
                </p>
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-gray-800/50 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === 'login'
                      ? 'bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === 'register'
                      ? 'bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="px-8 pb-8">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#42b9e5] focus:border-transparent transition-all duration-200"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#42b9e5] focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#42b9e5] focus:border-transparent transition-all duration-200"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] text-white font-semibold rounded-lg hover:shadow-[0_0_20px_rgba(66,185,229,0.4)] transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading 
                    ? `${activeTab === 'login' ? 'Signing In...' : 'Creating Account...'}` 
                    : `${activeTab === 'login' ? 'Sign In' : 'Create Account'}`
                  }
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-gray-600/30"></div>
                <span className="px-4 text-sm text-gray-400">Or continue with</span>
                <div className="flex-1 border-t border-gray-600/30"></div>
              </div>

              {/* Google Sign In */}
              <div className="space-y-3">
                <GoogleSignInButton
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  className="w-full"
                  theme="filled_blue"
                  size="large"
                  text="continue_with"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal; 