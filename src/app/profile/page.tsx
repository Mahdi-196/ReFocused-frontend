"use client";

import React, { useState, useEffect, useRef, startTransition, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { User, Settings, LogOut, MessageSquare, X, Star, Camera, Volume2, VolumeX, Bell, Wind } from 'lucide-react';
import { GiVote } from "react-icons/gi";
import PageTransition from '@/components/PageTransition';
import { useSettings } from '@/hooks/useSettings';
import client, { initializeAuth } from '@/api/client';
import { useRouter } from 'next/navigation';
import { authService } from '@/api/services/authService';
import { USER, AUTH } from '@/api/endpoints';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { emailSubscriptionService } from '@/api/services/emailSubscriptionService';
import { votingService, type PredefinedFeatureKey } from '@/api/services';
import { useToast } from '@/contexts/ToastContext';

// Priority 1: Critical components (immediate load)
import AvatarSelector from '@/components/AvatarSelector';

// Priority 2: Tab-based components (lazy load on demand)
const DeleteAccountModal = dynamic(() => import('@/components/profile/DeleteAccountModal').then(mod => ({ default: mod.DeleteAccountModal })), { ssr: false });
const ExportDataModal = dynamic(() => import('@/components/profile/ExportDataModal').then(mod => ({ default: mod.ExportDataModal })), { ssr: false });
const ClearActivityModal = dynamic(() => import('@/components/profile/ClearActivityModal').then(mod => ({ default: mod.ClearActivityModal })), { ssr: false });
const AudioSettings = dynamic(() => import('@/components/profile/AudioSettings').then(mod => ({ default: mod.AudioSettings })), { 
  ssr: false,
  loading: () => (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-gray-700 rounded w-32 mb-4"></div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
            <div className="h-4 bg-gray-700 rounded w-24"></div>
            <div className="h-6 bg-gray-700 rounded w-12"></div>
          </div>
        ))}
      </div>
    </div>
  ),
});

interface FeedbackData {
  rating: number;
  category: string;
  message: string;
  contact: string;
}

interface UserData {
  id: number;
  email: string;
  name: string;
  username?: string;
  createdAt?: string;
  created_at?: string;
  member_since?: string;
  avatar?: string;
  profile_picture?: string;
}

interface UserStats {
  goals_total: number;
  goals_completed: number;
  habits_total: number;
  mood_entries_count: number;
  study_sets_count: number;
  trackings_count: number;
  journal_collections_count: number;
  account_age_days: number;
}

// Move FeedbackModal outside of Profile component to prevent recreation
const FeedbackModal = memo(({ 
  isOpen, 
  onClose, 
  feedbackData, 
  setFeedbackData, 
  onSubmit,
  isSubmitting,
  cooldownSeconds,
  submittedToday,
  inlineError,
}: {
  isOpen: boolean;
  onClose: () => void;
  feedbackData: FeedbackData;
  setFeedbackData: React.Dispatch<React.SetStateAction<FeedbackData>>;
  onSubmit: () => void;
  isSubmitting: boolean;
  cooldownSeconds: number;
  submittedToday: boolean;
  inlineError?: string;
}) => {
  // Prevent background scroll when modal is open (call hook unconditionally)
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-gray-900/95 to-slate-900/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center transition-colors"
          aria-label="Close feedback modal"
        >
          <X className="w-5 h-5 text-gray-300" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Share Your Feedback</h2>
          <p className="text-gray-300 text-sm">Help us improve ReFocused by sharing your thoughts and suggestions</p>
        </div>

        {submittedToday ? (
          <div className="mb-2 p-4 bg-green-900/30 border border-green-800/50 rounded-lg text-green-300 text-center">
            Thank you! You can submit feedback once per day.
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Overall Experience
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => startTransition(() => setFeedbackData(prev => ({ ...prev, rating: star })))}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-150 ease-out hover:scale-105 active:scale-95 ${
                      star <= feedbackData.rating
                        ? 'bg-yellow-500 text-white shadow'
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                    }`}
                  >
                    <Star className={`w-5 h-5 ${star <= feedbackData.rating ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Feedback Category
              </label>
              <select
                value={feedbackData.category}
                onChange={(e) => setFeedbackData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Select a category...</option>
                {feedbackCategories.map((category) => (
                  <option key={category} value={category} className="bg-gray-800">
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Your Message
              </label>
              <textarea
                value={feedbackData.message}
                onChange={(e) => setFeedbackData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Tell us what you think, report a bug, or suggest a new feature..."
                rows={5}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>

            {/* Hide inline error message per request */}

            {cooldownSeconds > 0 && (
              <div className="mb-4 p-3 bg-amber-900/30 border border-amber-800/50 rounded-lg text-amber-300 text-sm text-center">
                You can submit feedback once every 24 hours.
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting || cooldownSeconds > 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
});

const feedbackCategories = [
  'General Feedback',
  'Bug Report',
  'Feature Request',
  'User Experience',
  'Performance Issues',
  'Content Suggestions'
];

const Profile = () => {
  const router = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackData>({
    rating: 0,
    category: '',
    message: '',
    contact: ''
  });
  // Voting section state
  const [showVotingOptions, setShowVotingOptions] = useState(false);
  const [selectedVotingOption, setSelectedVotingOption] = useState<string | null>(null);
  const [customVote, setCustomVote] = useState("");
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [voteSuccessMessage, setVoteSuccessMessage] = useState('');
  const [voteErrorMessage, setVoteErrorMessage] = useState('');
  const [voteCooldownSeconds, setVoteCooldownSeconds] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  // Removed unused state: appSettingsActiveSection
  
  // User data state
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [showAvatarSuccess, setShowAvatarSuccess] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(true);
  const [avatarLoadTimeout, setAvatarLoadTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Tab-based loading states
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['profile']));
  
  // Avatar cache to store loaded images
  const avatarCache = useRef<Map<string, HTMLImageElement>>(new Map());
  
  // Data management state
  
  // Modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Name change state
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isChangingName, setIsChangingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');
  
  // Settings hook
  const { settings, updateSettings } = useSettings();

  // Optimized tab change handler with progressive loading
  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    
    // Load tab content on demand
    if (!loadedTabs.has(tabName)) {
      setLoadedTabs(prev => new Set([...prev, tabName]));
    }

    // When opening voting, pre-check if user has already voted
    if (tabName === 'voting') {
      (async () => {
        try {
          const voted = await votingService.hasVoted();
          setHasVoted(Boolean(voted));
        } catch {}
      })();
    }
  };

  // Function to preload and cache avatar
  const preloadAvatar = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if already cached
      if (avatarCache.current.has(url)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        avatarCache.current.set(url, img);
        resolve();
      };
      img.onerror = reject;
      img.src = url;
    });
  };
  
  // Add authentication check for this page
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
  
  // Update current avatar when user data changes
  useEffect(() => {
    if (userData?.profile_picture || userData?.avatar) {
      const newAvatar = userData.profile_picture || userData.avatar;
      if (newAvatar && newAvatar !== currentAvatar) {
        setAvatarLoading(true);
        
        // Try to load from cache first, then preload if not cached
        preloadAvatar(newAvatar)
          .then(() => {
            setCurrentAvatar(newAvatar);
            setAvatarLoading(false);
            setAvatarLoadTimeout(prev => {
              if (prev) clearTimeout(prev);
              return null;
            });
          })
          .catch(() => {
            // If preload fails, still set the avatar and let the img onError handle it
            setCurrentAvatar(newAvatar);
            
            // Fallback timeout to hide spinner after 5 seconds
            const timeout = setTimeout(() => setAvatarLoading(false), 5000);
            setAvatarLoadTimeout(prev => {
              if (prev) clearTimeout(prev);
              return timeout;
            });
          });
      }
    }
  }, [userData?.profile_picture, userData?.avatar, currentAvatar]);
  
  useEffect(() => {
    const checkPageAuth = () => {
      const token = localStorage.getItem('REF_TOKEN');
      if (!token || token.startsWith('dummy-') || token === 'test-token') {
        router.push('/');
        return;
      }
      setIsAuthenticatedUser(true);
    };
    
    checkPageAuth();
  }, [router]);

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Check subscription status for the provided email on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        if (userData?.email) {
          const res = await emailSubscriptionService.status(userData.email);
          if (typeof res?.isSubscribed === 'boolean') {
            setIsSubscribed(res.isSubscribed);
          }
        }
      } catch (e) {
        // Ignore status errors silently here
      }
    };
    if (userData?.email) {
      checkStatus();
    }
  }, [userData?.email]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (avatarLoadTimeout) {
        clearTimeout(avatarLoadTimeout);
      }
    };
  }, [avatarLoadTimeout]);

  // Voting cooldown countdown
  useEffect(() => {
    if (voteCooldownSeconds <= 0) return;
    const t = setInterval(() => {
      setVoteCooldownSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [voteCooldownSeconds]);

  // Voting helpers
  const mapOptionToSlug = (option: string): PredefinedFeatureKey | null => {
    const lower = option.toLowerCase();
    if (lower.startsWith('develop the ai')) return 'develop-ai';
    if (lower.includes('collaboration')) return 'collaboration';
    if (lower.includes('gamification system')) return 'gamification-system';
    return null;
  };

  const handleVotingOptionChange = (option: string) => {
    setSelectedVotingOption(option);
    if (customVote) setCustomVote('');
    setVoteSuccessMessage('');
    setVoteErrorMessage('');
  };

  const handleCustomVoteChange = (value: string) => {
    const next = value.slice(0, 500);
    setCustomVote(next);
    if (next.trim().length > 0) setSelectedVotingOption(null);
    setVoteSuccessMessage('');
    setVoteErrorMessage('');
  };

  const canSubmitVote = () => {
    if (isSubmittingVote || voteCooldownSeconds > 0) return false;
    const text = customVote.trim();
    if (text.length > 0) return text.length <= 500;
    return selectedVotingOption !== null;
  };

  const handleSubmitVote = async () => {
    if (!canSubmitVote()) {
      setVoteErrorMessage('Select a feature or enter a suggestion (1–500 chars).');
      return;
    }
    setIsSubmittingVote(true);
    setVoteSuccessMessage('');
    setVoteErrorMessage('');

    try {
      const text = customVote.trim();
      if (text.length > 0) {
        await votingService.submitVote({ custom: text });
      } else if (selectedVotingOption) {
        const slug = mapOptionToSlug(selectedVotingOption);
        if (!slug) throw new Error('Invalid selection');
        await votingService.submitVote({ feature: slug });
      }
      setVoteSuccessMessage('Thanks for your vote!');
      setCustomVote('');
      setSelectedVotingOption(null);
      setHasVoted(true);
    } catch (err: any) {
      console.error('Voting error:', err);
      const status = (err?.status as number | undefined) ?? err?.response?.status;
      if (status === 429) {
        const retryAfterHeader = err?.response?.headers?.['retry-after'] ?? err?.response?.headers?.['Retry-After'] ?? err?.headers?.['retry-after'] ?? err?.headers?.['Retry-After'];
        const retryAfter = Number.parseInt(retryAfterHeader ?? '60', 10);
        setVoteCooldownSeconds(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60);
        setVoteErrorMessage('Too many votes. Please try again later.');
      } else if (status === 409) {
        // Already voted for this account
        setHasVoted(true);
        setVoteSuccessMessage('');
        setVoteErrorMessage('');
      } else {
        setVoteErrorMessage('Voting is temporarily unavailable. Please try again soon.');
      }
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Initialize auth headers
      initializeAuth();
      
      // Load user profile data (bypass cache to get fresh data)
      const response = await client.get(AUTH.ME);
      const userData = response.data;
      if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
        console.log('User data received:', userData);
      }
      setUserData(userData);
      
      // Clear any cached user data to ensure fresh data loads
      authService.clearUserCache();
      
      // Set avatar from user data (prioritize profile_picture over avatar) or generate one
      const avatarUrl = userData.profile_picture || userData.avatar ||
        `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(userData.name || userData.email)}&backgroundColor=transparent`;
      
      // Preload and cache the avatar
      preloadAvatar(avatarUrl)
        .then(() => {
          setCurrentAvatar(avatarUrl);
          setAvatarLoading(false);
          setAvatarLoadTimeout(prev => {
            if (prev) clearTimeout(prev);
            return null;
          });
        })
        .catch(() => {
          // If preload fails, still set the avatar and let the img onError handle it
          setCurrentAvatar(avatarUrl);
          
          // Fallback timeout to hide spinner after 5 seconds
          const timeout = setTimeout(() => setAvatarLoading(false), 5000);
          setAvatarLoadTimeout(prev => {
            if (prev) clearTimeout(prev);
            return timeout;
          });
        });
      
      // Load user statistics
      try {
        const statsResponse = await client.get(USER.STATS);
        setUserStats(statsResponse.data);
      } catch {
        // If stats endpoint doesn't exist, create mock stats
        if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
          console.log('Stats endpoint not available, using mock data');
        }
        setUserStats({
          goals_total: 0,
          goals_completed: 0,
          habits_total: 0,
          mood_entries_count: 0,
          study_sets_count: 0,
          trackings_count: 0,
          journal_collections_count: 0,
          account_age_days: 0
        });
      }
      
    } catch (err) {
      console.error('Failed to load user data:', err);
      setError('Failed to load profile data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Use auth service to clear everything (this also dispatches the custom event)
    authService.logout();
    
    // Redirect to landing page
    router.push('/');
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    setEmailWarning(null);
    try {
      if (userData?.email) {
        await emailSubscriptionService.subscribe(userData.email);
      } else {
        throw new Error('Email is required for subscription');
      }
      setIsSubscribed(true);
    } catch (error: any) {
      const status = (error?.status as number | undefined) ?? error?.response?.status;
      if (status === 429) {
        setEmailWarning('Daily limit reached.');
      } else {
        setEmailWarning('Subscription service is temporarily unavailable.');
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsSubscribing(true);
    setEmailWarning(null);
    try {
      if (userData?.email) {
        await emailSubscriptionService.unsubscribe(userData.email);
      } else {
        throw new Error('Email is required for unsubscription');
      }
      setIsSubscribed(false);
    } catch (error: any) {
      const status = (error?.status as number | undefined) ?? error?.response?.status;
      if (status === 429) {
        setEmailWarning('Daily limit reached.');
      } else {
        setEmailWarning('Subscription service is temporarily unavailable.');
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleAvatarSelect = async (avatarUrl: string) => {
    setAvatarSaving(true);
    try {
      // Update local state with caching
      setAvatarLoading(true);
      
      // Preload and cache the new avatar
      preloadAvatar(avatarUrl)
        .then(() => {
          setCurrentAvatar(avatarUrl);
          setAvatarLoading(false);
          setAvatarLoadTimeout(prev => {
            if (prev) clearTimeout(prev);
            return null;
          });
        })
        .catch(() => {
          // If preload fails, still set the avatar
          setCurrentAvatar(avatarUrl);
          
          // Fallback timeout to hide spinner after 5 seconds
          const timeout = setTimeout(() => setAvatarLoading(false), 5000);
          setAvatarLoadTimeout(prev => {
            if (prev) clearTimeout(prev);
            return timeout;
          });
        });

      // Initialize auth headers
      initializeAuth();

      // Save avatar to both endpoints for consistency
      await Promise.all([
        client.patch(USER.PROFILE, {
          avatar: avatarUrl,
          profile_picture: avatarUrl
        }),
        // This is already handled by AvatarSelector, but included for robustness
        // client.put(USER.AVATAR, { avatar_config: { style: 'custom', seed: 'user-selected', url: avatarUrl } })
      ]);

      // Clear user cache to ensure fresh data on next load
      authService.clearUserCache();

      // Update userData state
      if (userData) {
        const updatedUserData = { ...userData, avatar: avatarUrl, profile_picture: avatarUrl };
        setUserData(updatedUserData);
        
        // Update localStorage to sync with header
        localStorage.setItem('REF_USER', JSON.stringify(updatedUserData));
        
        // Trigger a custom event to notify other components (like AuthButton) about the avatar change
        window.dispatchEvent(new CustomEvent('avatarUpdated', { 
          detail: { avatarUrl, userData: updatedUserData } 
        }));
      }

      if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
        console.log('Avatar updated successfully');
      }
    } catch (error: unknown) {
      console.error('Failed to update avatar:', error);
      
      // Check if it's an authentication error
      if (error instanceof Error && 'response' in error && (error as {response?: {status?: number; data?: {error?: string}}}).response?.status === 401) {
        // Show specific auth error message
        toast.showError('Session expired. Please login again to save your avatar.');
        
        // Only logout if it's actually an auth issue, not a temporary token problem
        if ((error as {response?: {data?: {error?: string}}}).response?.data?.error?.includes('expired') || 
            (error as {response?: {data?: {error?: string}}}).response?.data?.error?.includes('invalid')) {
          // Clear local storage and redirect
          localStorage.removeItem('REF_TOKEN');
          localStorage.removeItem('REF_USER');
          delete client.defaults.headers.common['Authorization'];
          router.push('/');
          return;
        }
      } else {
        // Show user-friendly error message for other errors
        toast.showError('Failed to save avatar. Please try again.');
      }
      
      // Revert to previous avatar if the API call failed
      if (userData?.avatar) {
        setCurrentAvatar(userData.avatar);
      }
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleDataExport = async () => {
    initializeAuth();
    const response = await client.post(USER.EXPORT);
    return response.data;
  };

  const handleCheckExportStatus = async (taskId: string) => {
    initializeAuth();
    const response = await client.get(USER.EXPORT_STATUS(taskId));
    return response.data;
  };

  const handleClearActivity = async () => {
  if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
    console.log('🗑️ [PROFILE] Starting activity data clearing...');
  }
    const result = await authService.clearActivityData();
  if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
    console.log('✅ [PROFILE] Successfully cleared data:', result);
  }
    return result;
  };

  const handleDeleteAccount = async () => {
    initializeAuth();
    await client.delete(USER.DELETE_ACCOUNT);
    localStorage.clear();
    sessionStorage.clear();
    toast.showSuccess('Account deleted successfully');
    router.push('/');
  };

  const validatePassword = (password: string) => {
    return {
      length: password.length >= 8 && password.length <= 128,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validatePassword(newPassword);
    const isValidPassword = Object.values(validation).every(Boolean);
    const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }
    
    if (!isValidPassword) {
      setPasswordError('New password does not meet security requirements');
      return;
    }
    
    if (!passwordsMatch) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      await authService.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully');
      
      setTimeout(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSuccess('');
      }, 3000);
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangeName = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newName.trim()) {
      setNameError('Name cannot be empty');
      return;
    }

    if (newName.trim().length > 25) {
      setNameError('Name is too long (maximum 25 characters)');
      return;
    }

    if (newName.trim() === userData?.name) {
      setIsEditingName(false);
      return;
    }

    setIsChangingName(true);
    setNameError('');
    setNameSuccess('');

    try {
      const result = await authService.changeAccountName(newName.trim());
      
      // Update local user data
      if (userData) {
        const updatedUserData = { ...userData, name: result.name };
        setUserData(updatedUserData);
        
        // Trigger event for other components
        window.dispatchEvent(new CustomEvent('userDataUpdated', { 
          detail: { userData: updatedUserData } 
        }));
      }

      setIsEditingName(false);
    } catch (error: any) {
      setNameError(error.message || 'Failed to change name');
    } finally {
      setIsChangingName(false);
    }
  };

  const startEditingName = () => {
    setNewName(userData?.name || '');
    setIsEditingName(true);
    setNameError('');
    setNameSuccess('');
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setNewName('');
    setNameError('');
    setNameSuccess('');
  };

  const menuItems = [
    { id: 'profile', icon: <User size={18} />, label: 'Profile' },
    { id: 'settings', icon: <Settings size={18} />, label: 'Account Settings' },
    { id: 'app-settings', icon: <Volume2 size={18} />, label: 'Audio' },
  ];

  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackCooldown, setFeedbackCooldown] = useState(0);
  const [feedbackSubmittedToday, setFeedbackSubmittedToday] = useState(false);
  const [feedbackInlineError, setFeedbackInlineError] = useState<string | undefined>(undefined);
  const handleFeedbackSubmit = async () => {
    if (feedbackData.rating < 1 || feedbackData.rating > 5 || !feedbackData.category || !feedbackData.message.trim()) {
      setFeedbackInlineError('Please provide rating (1-5), category, and message.');
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      await (await import('@/api/services')).feedbackService.submit({
        rating: feedbackData.rating,
        category: feedbackData.category,
        message: feedbackData.message,
        email: userData?.email || undefined,
      });
      setFeedbackData({ rating: 0, category: '', message: '', contact: '' });
      setFeedbackSubmittedToday(true);
      setFeedbackInlineError(undefined);
    } catch (err: any) {
      console.error('Feedback error:', err);
      const status = (err?.status as number | undefined) ?? err?.response?.status;
      if (status === 429) {
        const seconds = err?.retryAfter ?? 60;
        setFeedbackCooldown(Number.isFinite(seconds) ? seconds : 60);
        setFeedbackInlineError(undefined);
      } else {
        setFeedbackInlineError('Feedback is temporarily unavailable. Please try again later.');
      }
    } finally {
      setIsSubmittingFeedback(false);
    }
  };


  const renderAppSettings = () => {
    return <AudioSettings />;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-gray-800/90 to-slate-800/90 backdrop-blur-lg border border-gray-700/60 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-blue-600/20 rounded-xl">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Profile Information</h3>
                  <p className="text-gray-400 text-sm">Manage your personal details and preferences</p>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/40">
                  <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
                    <div className="flex flex-col items-center space-y-4">
                      <div 
                        className="relative group cursor-pointer"
                        onClick={() => !avatarSaving && setIsAvatarSelectorOpen(true)}
                      >
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700/50 border-2 border-gray-600/50 group-hover:border-blue-500/50 transition-colors relative">
                          {(avatarLoading || !currentAvatar) && (
                            <div className="absolute inset-0 bg-gray-700/50 flex items-center justify-center z-10">
                              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                          {currentAvatar && (
                            <img 
                              key={currentAvatar}
                              src={currentAvatar} 
                              alt="Profile Avatar" 
                              className={`w-full h-full object-cover transition-opacity duration-300 ${avatarLoading ? 'opacity-0' : 'opacity-100'}`}
                              onLoad={() => {
                                setAvatarLoadTimeout(prev => {
                                  if (prev) clearTimeout(prev);
                                  return null;
                                });
                                setAvatarLoading(false);
                              }}
                              onError={() => {
                                setAvatarLoadTimeout(prev => {
                                  if (prev) clearTimeout(prev);
                                  return null;
                                });
                                setAvatarLoading(false);
                              }}
                            />
                          )}
                        </div>
                        {avatarSaving ? (
                          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setIsAvatarSelectorOpen(true)}
                        disabled={avatarSaving}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-sm rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                      >
                        {avatarSaving ? (
                          <>
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          'Change Avatar'
                        )}
                      </button>
                    </div>

                    <div className="flex-1 space-y-6 w-full lg:w-auto">
                      {loading ? (
                        <div className="animate-pulse space-y-4">
                          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
                          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                        </div>
                      ) : error ? (
                        <div className="text-red-400 text-sm">{error}</div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            {isEditingName ? (
                              <form onSubmit={handleChangeName} className="space-y-3">
                                <input
                                  type="text"
                                  value={newName}
                                  onChange={(e) => setNewName(e.target.value)}
                                  maxLength={25}
                                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  disabled={isChangingName}
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="submit"
                                    disabled={isChangingName || !newName.trim()}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                  >
                                    {isChangingName ? (
                                      <>
                                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                        Saving...
                                      </>
                                    ) : (
                                      'Save'
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditingName}
                                    disabled={isChangingName}
                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div className="flex items-center space-x-3">
                                <h4 className="text-xl font-semibold text-white truncate">
                                  {userData?.name || userData?.username || 'User'}
                                </h4>
                                <button
                                  type="button"
                                  onClick={startEditingName}
                                  className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                                  title="Edit name"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                              </div>
                            )}
                            
                            {nameError && (
                              <div className="text-xs text-red-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {nameError}
                              </div>
                            )}
                            
                            {nameSuccess && (
                              <div className="text-xs text-green-400 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                {nameSuccess}
                              </div>
                            )}

                            <p className="text-gray-300 text-sm">{userData?.email}</p>

                            <p className="text-gray-400 text-sm">
                              Member since {(() => {
                                const memberDate = userData?.member_since || userData?.created_at || userData?.createdAt;
                                if (memberDate) {
                                  try {
                                    const date = new Date(memberDate);
                                    const month = date.getMonth() + 1;
                                    const day = date.getDate();
                                    const year = date.getFullYear().toString().slice(-2);
                                    return `${month}/${day}/${year}`;
                                  } catch (error) {
                                    console.error('Error parsing member date:', error);
                                    return 'Unknown';
                                  }
                                }
                                return 'Unknown';
                              })()}
                            </p>
                          </div>
                          

                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-blue-400" />
                Account Security
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                      disabled={isChangingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      disabled={isChangingPassword}
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        disabled={isChangingPassword}
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className={`w-full px-4 py-2 bg-gray-700/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:border-transparent pr-12 ${
                          confirmPassword && newPassword !== confirmPassword
                            ? 'border-red-500/50 focus:ring-red-500'
                            : 'border-gray-600/50 focus:ring-blue-500'
                        }`}
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        disabled={isChangingPassword}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
                
                {newPassword && (
                  <div className="mt-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/40">
                    <p className="text-xs text-gray-400 mb-2">Password Requirements:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                      {(() => {
                        const validation = validatePassword(newPassword);
                        return [
                          { key: 'length', label: '8-128 characters', valid: validation.length },
                          { key: 'uppercase', label: 'One uppercase letter', valid: validation.uppercase },
                          { key: 'lowercase', label: 'One lowercase letter', valid: validation.lowercase },
                          { key: 'number', label: 'One number', valid: validation.number },
                          { key: 'special', label: 'One special character', valid: validation.special }
                        ].map((req) => (
                          <div key={req.key} className={`flex items-center gap-2 ${req.valid ? 'text-green-400' : 'text-gray-400'}`}>
                            {req.valid ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-gray-400" />}
                            {req.label}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {confirmPassword && newPassword !== confirmPassword && (
                  <div className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Passwords do not match
                  </div>
                )}

                {confirmPassword && newPassword === confirmPassword && confirmPassword !== '' && (
                  <div className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Passwords match
                  </div>
                )}

                {passwordError && (
                  <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 bg-green-900/30 border border-green-700/50 rounded-lg text-green-400 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    {passwordSuccess}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isChangingPassword}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isChangingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating Password...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </form>
            </div>



            <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Email Subscription</h3>
              <div className="space-y-6">
                <div className={`p-4 rounded-lg ${isSubscribed ? 'bg-green-900/20 border border-green-800/50' : 'bg-red-900/20 border border-red-800/50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-medium mb-1 ${isSubscribed ? 'text-green-400' : 'text-red-400'}`}>
                        Subscription Status
                      </h4>
                      <p className="text-sm text-gray-300">
                        {isSubscribed ? 'You are currently subscribed to our newsletter' : 'You are not subscribed to our newsletter'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{userData?.email || 'No email available'}</p>
                      {emailWarning && (
                        <div className="mt-2 text-xs text-amber-300 bg-amber-900/30 border border-amber-800/50 rounded px-2 py-1 inline-block">
                          {emailWarning}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
                      disabled={isSubscribing}
                      className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
                        isSubscribed 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      } ${isSubscribing ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {isSubscribed ? (isSubscribing ? 'Unsubscribing...' : 'Unsubscribe') : (isSubscribing ? 'Subscribing...' : 'Subscribe')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Data Management</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                  <h4 className="text-blue-400 font-medium mb-2">Export Your Data</h4>
                  <p className="text-sm text-gray-300 mb-3">Download all your personal data including journal entries, goals, and settings.</p>
                  <button 
                    type="button"
                    onClick={() => setShowExportModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Request Data Export
                  </button>
                </div>
                <div className="p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
                  <h4 className="text-yellow-400 font-medium mb-2">Clear Activity Data</h4>
                  <p className="text-sm text-gray-300 mb-3">Remove all your activity history while keeping your account active.</p>
                  <button 
                    type="button"
                    onClick={() => setShowClearModal(true)}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Clear Data
                  </button>
                </div>
                <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
                  <h4 className="text-red-400 font-medium mb-2">Delete Account</h4>
                  <p className="text-sm text-gray-300 mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>
                  <button 
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'app-settings':
        return loadedTabs.has('app-settings') ? renderAppSettings() : (
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <div className="h-4 bg-gray-700 rounded w-24"></div>
                  <div className="h-6 bg-gray-700 rounded w-12"></div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'voting':
        return loadedTabs.has('voting') ? (
          <div className="space-y-8">
            <div className="relative bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-blue-300 mb-4">Feature Voting</h3>
              <p className="text-gray-400 text-sm mb-6">Vote on upcoming features or suggest your own!</p>
              
              <div className="flex flex-col gap-3 mb-6">
                {[
                  "Develop the AI (add previous chat history, increase token context, and enhance AI capabilities)",
                  "Collaboration (work with other users, shared notebooks, and real-time co-editing)",
                  "Gamification System (achievements, complex monthly scoring, user levels, and progress rewards)"
                ].map((option) => (
                  <label key={option} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-700/30 transition-colors">
                    <div className="relative mt-0.5">
                      <input
                        type="radio"
                        name="votingOption"
                        value={option}
                        checked={selectedVotingOption === option}
                        onChange={() => handleVotingOptionChange(option)}
                        className="sr-only peer"
                      />
                      <div className="w-4 h-4 rounded-full border-2 border-gray-500 bg-transparent peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all duration-200"></div>
                      <div className="pointer-events-none absolute inset-0 rounded-full peer-checked:ring-2 peer-checked:ring-blue-500 peer-checked:ring-offset-[3px] peer-checked:ring-offset-gray-800"></div>
                    </div>
                    <span className="text-sm text-gray-200 leading-relaxed">{option}</span>
                  </label>
                ))}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Your Own Suggestion</label>
                <textarea
                  className="w-full px-4 py-3 rounded-lg bg-gray-700/50 border border-gray-600/50 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Send your own suggestion (max 500 chars)"
                  maxLength={500}
                  value={customVote}
                  onChange={e => handleCustomVoteChange(e.target.value)}
                  rows={4}
                />
                <div className="text-xs text-gray-400 text-right">{customVote.length}/500</div>
              </div>
              
              <button
                type="button"
                className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                onClick={handleSubmitVote}
                disabled={isSubmittingVote || voteCooldownSeconds > 0 || hasVoted}
              >
                {isSubmittingVote ? 'Submitting...' : 'Submit Vote'}
              </button>
              {(voteSuccessMessage || voteErrorMessage) && (
                <div className="mt-4 text-sm">
                  {voteSuccessMessage && <div className="text-green-400">{voteSuccessMessage}</div>}
                  {voteErrorMessage && voteCooldownSeconds <= 0 && (
                    <div className="text-red-400">{voteErrorMessage}</div>
                  )}
                </div>
              )}
              {hasVoted && (
                <div className="absolute inset-0 rounded-xl overflow-hidden z-20">
                  <div className="absolute inset-0 backdrop-blur-md bg-slate-900/40" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="-rotate-12">
                      <div className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl ring-1 ring-white/20">
                        <GiVote className="w-5 h-5" />
                        <span className="font-semibold tracking-wide">Thank you for your vote</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-pulse">
            <div className="bg-gray-800/30 rounded-xl p-6">
              <div className="h-6 bg-gray-700 rounded w-32 mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-64 mb-6"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Section Coming Soon</h3>
            <p className="text-gray-400">This section is currently under development.</p>
          </div>
        );
    }
  };

  // Don't render until authenticated
  if (!isAuthenticatedUser) {
    return (
      <div className="min-h-screen bg-[#1A2537] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#42b9e5] mx-auto mb-4"></div>
          <p className="text-slate-300">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div 
        className="min-h-screen py-8"
        style={{ backgroundColor: "#1A2537" }}
      >
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
            <p className="text-gray-400">Manage your account settings and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 sticky top-8">
                <div className="text-center mb-6 pb-6 border-b border-gray-700/50">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700/50 border-2 border-gray-600/50 mx-auto mb-3 relative">
                    {(avatarLoading || !currentAvatar) && (
                      <div className="absolute inset-0 bg-gray-700/50 flex items-center justify-center z-10">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {currentAvatar && (
                      <img 
                        key={currentAvatar}
                        src={currentAvatar} 
                        alt="Profile Avatar" 
                        className={`w-full h-full object-cover transition-opacity duration-300 ${avatarLoading ? 'opacity-0' : 'opacity-100'}`}
                        onLoad={() => {
                          setAvatarLoadTimeout(prev => {
                            if (prev) clearTimeout(prev);
                            return null;
                          });
                          setAvatarLoading(false);
                        }}
                        onError={() => {
                          setAvatarLoadTimeout(prev => {
                            if (prev) clearTimeout(prev);
                            return null;
                          });
                          setAvatarLoading(false);
                        }}
                      />
                    )}
                  </div>
                  {loading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-24 mx-auto"></div>
                      <div className="h-3 bg-gray-700 rounded w-32 mx-auto"></div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-white truncate">
                        {userData?.name || userData?.username || 'User'}
                      </h3>
                      <p className="text-sm text-gray-400">{userData?.email}</p>
                    </>
                  )}
                </div>

                <nav className="space-y-2">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left focus:outline-none focus:ring-0 focus:border-transparent outline-none border-0 ${
                        activeTab === item.id
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => handleTabChange('voting')}
                    className={`w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left border-t border-gray-700/50 mt-4 pt-4 focus:outline-none focus:ring-0 focus:border-transparent outline-none ${
                      activeTab === 'voting'
                        ? 'bg-blue-500/20 border border-blue-500/30'
                        : 'hover:bg-gray-700/50'
                    }`}
                    style={{
                      color: '#8EC5FF'
                    }}
                  >
                    <GiVote size={18} style={{ color: '#8EC5FF' }} />
                    <span className="text-sm font-medium">Feature Voting</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFeedbackModalOpen(true)}
                    className="w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left text-gray-300 hover:text-white hover:bg-gray-700/50 focus:outline-none focus:ring-0 focus:border-transparent outline-none"
                  >
                    <MessageSquare size={18} />
                    <span className="text-sm font-medium">Give Feedback</span>
                  </button>

                  {/* Divider before logout */}
                  <div className="border-t border-gray-700/50 my-2 w-full" />

                  <button 
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left text-red-400 hover:text-red-300 hover:bg-red-900/20 focus:outline-none focus:ring-0 focus:border-transparent outline-none"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </nav>
              </div>
            </div>

            <div className="lg:col-span-3 max-h-[calc(100vh-12rem)] overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    duration: 0.2,
                    ease: "easeInOut"
                  }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          feedbackData={feedbackData}
          setFeedbackData={setFeedbackData}
          onSubmit={handleFeedbackSubmit}
          isSubmitting={isSubmittingFeedback}
          cooldownSeconds={feedbackCooldown}
          submittedToday={feedbackSubmittedToday}
          inlineError={feedbackInlineError}
        />
        
        <AvatarSelector
          isOpen={isAvatarSelectorOpen}
          onClose={() => setIsAvatarSelectorOpen(false)}
          onSelect={handleAvatarSelect}
          currentAvatar={currentAvatar}
          userName={userData?.name || userData?.username || 'User'}
        />

        <ExportDataModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onRequestExport={handleDataExport}
          onCheckStatus={handleCheckExportStatus}
          userEmail={userData?.email || ''}
        />

        <ClearActivityModal
          isOpen={showClearModal}
          onClose={() => setShowClearModal(false)}
          onClearActivity={handleClearActivity}
          userEmail={userData?.email || ''}
        />

        <DeleteAccountModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDeleteAccount={handleDeleteAccount}
          userEmail={userData?.email || ''}
        />

      </div>
      
      <style jsx>{`
        button:focus,
        button:focus-visible,
        button:active {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #1E40AF;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #1E40AF;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-track {
          background: transparent;
        }
      `}</style>
    </PageTransition>
  );
};

export default Profile;