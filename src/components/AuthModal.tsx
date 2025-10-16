'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FiMail, FiLock, FiUser, FiEye, FiEyeOff } from './icons';
import GoogleSignInButton from './GoogleSignInButton';
import { avatarService } from '@/api/services/avatarService';
import client from '@/api/client';
import { AUTH } from '@/api/endpoints';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/api/services/authService';
import LegalModal from './LegalModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const MIN_PASSWORD_LENGTH = 5;

  // Reset form when modal opens - but not on tab changes to prevent jerky animation
  useEffect(() => {
    if (isOpen) {
      setFormData({ email: '', password: '', name: '' });
      setError('');
      setShowPassword(false);
    } else {
      // Close legal modal when auth modal closes
      setIsLegalModalOpen(false);
    }
  }, [isOpen]); // Removed activeTab dependency to prevent re-renders during animation

  // Reset form data when switching tabs (but not error/password visibility to avoid jerky animation)
  useEffect(() => {
    setFormData(prev => ({ ...prev, email: '', password: '', name: '' }));
  }, [activeTab]);

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
    setIsLoading(false); // Reset loading state on success
    localStorage.setItem('REF_TOKEN', token);
    try {
      const userRaw = localStorage.getItem('REF_USER');
      const user = userRaw ? JSON.parse(userRaw) : null;
      const scope = String(user?.id || user?.email || 'user');
      const seenKey = `REF_TUTORIAL_GOOGLE_SEEN:${scope}`;
      if (localStorage.getItem(seenKey) !== 'true') {
        localStorage.setItem('REF_TUTORIAL_TRIGGER', 'google');
      }
    } catch {}
    onClose();
    // Use Next.js router for client-side navigation
    window.location.reload();
  };

  const handleGoogleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false); // Reset loading state on error
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (activeTab === 'register' && formData.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }
    if (!acceptedTerms) {
      setError('Please accept the Terms of Service to continue.');
      return;
    }
    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        await login(formData.email, formData.password);
      } else {
        await register(formData.email, formData.password, formData.name);
      }
      
      // Set a default Open Peeps avatar for new accounts
      if (activeTab === 'register') {
        try {
          const seed = (formData.name || formData.email).trim();
          await avatarService.updateAvatar({
            style: 'open-peeps',
            seed,
            options: { backgroundColor: 'transparent' }
          });
        } catch {}
        
        // Mark that we should show the tutorial right after signup
        try {
          localStorage.setItem('REF_TUTORIAL_TRIGGER', 'signup');
        } catch {}
      }

      // Close modal - the AuthContext will handle the redirect
      onClose();
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

  // Ultra-smooth animation variants that override global transitions
  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.96,
      y: 8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 30,
        stiffness: 400,
        mass: 0.8,
        duration: 0.3,
      }
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      y: -8,
      transition: {
        type: "tween" as const,
        ease: "easeIn" as const,
        duration: 0.2,
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        type: "tween" as const,
        ease: "easeOut" as const,
        duration: 0.3
      }
    },
    exit: { 
      opacity: 0,
      transition: { 
        type: "tween" as const,
        ease: "easeIn" as const,
        duration: 0.2
      }
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
            style={{
              // Override any global CSS transitions
              transition: 'none !important',
              willChange: 'transform, opacity',
            }}
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
                <motion.div
                  initial={false}
                  animate={{ height: activeTab === 'register' ? 'auto' : 0, opacity: activeTab === 'register' ? 1 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  style={{ overflow: activeTab === 'register' ? 'visible' : 'hidden' }}
                >
                  {activeTab === 'register' && (
                    <div className="pb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2 relative z-30">
                        Full Name
                      </label>
                      <div className="relative z-10">
                        <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-20" size={18} />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          autoComplete="name"
                          className="w-full pl-10 pr-16 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#42b9e5] focus:border-transparent transition-all duration-200 relative z-10"
                          style={{ backgroundImage: 'none' }}
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                    </div>
                  )}
                </motion.div>

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
                      autoComplete="email"
                      className="w-full pl-10 pr-16 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#42b9e5] focus:border-transparent transition-all duration-200"
                      style={{ backgroundImage: 'none' }}
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
                    {activeTab === 'login' ? (
                      <input
                        key="login-pw"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        autoComplete="current-password"
                        className="w-full pl-10 pr-16 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#42b9e5] focus:border-transparent transition-all duration-200"
                        style={{ backgroundImage: 'none' }}
                        placeholder="Enter your password"
                        required
                      />
                    ) : (
                      <input
                        key="register-pw"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        autoComplete="new-password"
                        minLength={MIN_PASSWORD_LENGTH}
                        className={`w-full pl-10 pr-16 py-3 bg-gray-800/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${formData.password && formData.password.length < MIN_PASSWORD_LENGTH ? 'border-red-500/60 focus:ring-red-500 border' : 'border border-gray-600/50 focus:ring-[#42b9e5] focus:border-transparent'}`}
                        style={{ backgroundImage: 'none' }}
                        placeholder="Enter your password"
                        required
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>
                {activeTab === 'register' && formData.password && formData.password.length < MIN_PASSWORD_LENGTH && (
                  <div className="mt-1 text-xs text-red-400">Minimum {MIN_PASSWORD_LENGTH} characters.</div>
                )}

                <div className="flex items-center justify-between">
                  <label className="inline-flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => { setAcceptedTerms(e.target.checked); setRememberMe(e.target.checked); }}
                      className="peer sr-only"
                      aria-label="Accept Terms of Service and Privacy Policy"
                    />
                    <span className="flex h-5 w-5 items-center justify-center rounded-sm border-2 border-gray-600/60 bg-gray-800/60 transition-all duration-200 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[#42b9e5] peer-checked:border-transparent peer-checked:bg-gradient-to-r peer-checked:from-[#42b9e5] peer-checked:to-[#4f83ed] peer-checked:[&>svg]:opacity-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                      <svg
                        className="h-4 w-4 text-white opacity-0 transition-all duration-150"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                    <span className="text-sm text-gray-300 hover:text-white transition-colors">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setIsLegalModalOpen(true); }}
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        Terms of Service
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setIsLegalModalOpen(true); }}
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        Privacy Policy
                      </button>, and I want to stay signed in.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !acceptedTerms || (activeTab === 'register' && formData.password.length < MIN_PASSWORD_LENGTH)}
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

              {/* Google Sign-In Help */}
              {error && (error.includes('not available') || error.includes('cancelled')) && (
                <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs">
                  <div className="font-medium mb-1">Google Sign-In Help:</div>
                  <div>Try refreshing the page or clearing your browser cache. If the issue persists, try using a different browser.</div>
                </div>
              )}

              {/* Google Sign In */}
              <div className="space-y-3">
                <GoogleSignInButton
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  className="w-full"
                  disabled={!acceptedTerms}
                />
              </div>

              {/* Development-only simplified auth buttons */}
              {process.env.NODE_ENV === 'development' && (
                <>
                  <div className="my-6 flex items-center">
                    <div className="flex-1 border-t border-yellow-600/30"></div>
                    <span className="px-4 text-sm text-yellow-400">Development Only</span>
                    <div className="flex-1 border-t border-yellow-600/30"></div>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!acceptedTerms) {
                          setError('Please accept the Terms of Service to continue.');
                          return;
                        }
                        setError('');
                        setIsLoading(true);
                        try {
                          const response = await authService.registerSimple();
                          authService.saveAuthData(response);

                          // Set a default avatar for new accounts
                          try {
                            await avatarService.updateAvatar({
                              style: 'open-peeps',
                              seed: 'test-user',
                              options: { backgroundColor: 'transparent' }
                            });
                          } catch {}

                          // Mark that we should show the tutorial
                          try {
                            localStorage.setItem('REF_TUTORIAL_TRIGGER', 'signup');
                          } catch {}

                          onClose();
                          window.location.reload();
                        } catch (err: unknown) {
                          console.error('Dev register error:', err);
                          if (err instanceof Error) {
                            setError(err.message);
                          } else {
                            setError('Development registration failed. Please try again.');
                          }
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading || !acceptedTerms}
                      className="w-full py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-semibold rounded-lg hover:shadow-[0_0_20px_rgba(255,165,0,0.4)] transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Creating Dev Account...' : '🚀 Quick Register (Dev)'}
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (!acceptedTerms) {
                          setError('Please accept the Terms of Service to continue.');
                          return;
                        }
                        setError('');
                        setIsLoading(true);
                        try {
                          const response = await authService.loginSimple();
                          authService.saveAuthData(response);
                          onClose();
                          window.location.reload();
                        } catch (err: unknown) {
                          console.error('Dev login error:', err);
                          if (err instanceof Error) {
                            setError(err.message);
                          } else {
                            setError('Development login failed. Please try again.');
                          }
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading || !acceptedTerms}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Signing In...' : '⚡ Quick Login (Dev)'}
                    </button>

                    <div className="text-xs text-yellow-400/70 text-center">
                      No validation required • Rate limiting disabled • ~0.003s response time
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Legal Modal */}
          <LegalModal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal; 