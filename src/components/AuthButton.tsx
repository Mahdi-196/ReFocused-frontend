"use client";

import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { initializeAuth } from '@/api/client';
import { authService } from '@/api/services/authService';
import AuthModal from './AuthModal';

const AuthButton = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const router = useRouter();

  // Check if user is logged in on component mount
  useEffect(() => {
    const checkAuth = async () => {
      // Initialize auth from client
      initializeAuth();
      
      // Check if user has a valid token
      const token = typeof window !== 'undefined' ? localStorage.getItem('REF_TOKEN') : null;
      
      if (token && token !== 'dummy-auth-token') {
        setIsLoggedIn(true);
        
        // First try to get cached user data or localStorage data
        let userData = authService.getCachedUser();
        
        // If no cached data, try localStorage
        if (!userData) {
          const storedUser = localStorage.getItem('REF_USER');
          if (storedUser) {
            try {
              userData = JSON.parse(storedUser);
            } catch (parseError) {
              console.error('Failed to parse stored user data:', parseError);
            }
          }
        }
        
        if (userData) {
          console.log('👤 Using cached/stored user data in AuthButton');
          // Prioritize profile_picture over avatar field
          const avatarUrl = userData.profile_picture || userData.avatar || 
            `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(userData.name || userData.email)}&backgroundColor=transparent`;
          
          // Preload the avatar image to ensure it's cached
          if (avatarUrl) {
            const img = new Image();
            img.src = avatarUrl;
            img.onload = () => {
              console.log('👤 Avatar preloaded and cached:', avatarUrl);
            };
          }
          
          setUserAvatar(avatarUrl);
          setUserName(userData.name || userData.email || 'User');
        } else {
          // Only fetch from API if no cached/stored data exists
          try {
            const freshUserData = await authService.getCurrentUser();
            
            // Set avatar from user data or generate one
            const avatarUrl = freshUserData.profile_picture || freshUserData.avatar || 
              `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(freshUserData.name || freshUserData.email)}&backgroundColor=transparent`;
            setUserAvatar(avatarUrl);
            setUserName(freshUserData.name || freshUserData.email || 'User');
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
            setUserAvatar(null);
            setUserName('User');
          }
        }
      } else {
        setIsLoggedIn(false);
        setUserAvatar(null);
        setUserName('');
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
    
    // Also check on visibility change (user might have logged in/out in another tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };
    
    // Listen for storage changes (login/logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'REF_TOKEN') {
        checkAuth();
      } else if (e.key === 'REF_USER') {
        // Update avatar when user data changes
        try {
          const userData = e.newValue ? JSON.parse(e.newValue) : null;
          if (userData) {
            // Prioritize profile_picture over avatar field
            const avatarUrl = userData.profile_picture || userData.avatar;
            if (avatarUrl) {
              // Preload the updated avatar
              const img = new Image();
              img.src = avatarUrl;
              img.onload = () => {
                console.log('👤 Updated avatar preloaded and cached:', avatarUrl);
              };
              setUserAvatar(avatarUrl);
            }
            setUserName(userData.name || userData.email || 'User');
          }
        } catch (error) {
          console.error('Failed to parse updated user data:', error);
        }
      }
    };
    
    // Listen for custom avatar update events
    const handleAvatarUpdate = (event: CustomEvent) => {
      const { avatarUrl, userData } = event.detail;
      
      // Preload the new avatar to ensure it's cached
      if (avatarUrl) {
        const img = new Image();
        img.src = avatarUrl;
        img.onload = () => {
          console.log('👤 Custom event avatar preloaded and cached:', avatarUrl);
        };
      }
      
      setUserAvatar(avatarUrl);
      setUserName(userData.name || userData.email || 'User');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
    };
  }, []);

  const openAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="w-10 h-10 rounded-full bg-[#10182B]/80 border-2 border-[#42b9e5]/30 flex items-center justify-center shadow-[0_0_10px_rgba(66,185,229,0.3)]">
        <div className="w-4 h-4 border-2 border-[#42b9e5] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        {isLoggedIn ? (
          <button 
            onClick={() => router.push('/profile')}
            className="w-10 h-10 rounded-full border-2 border-[#42b9e5]/30 hover:border-[#42b9e5]/50 transition-all duration-200 shadow-[0_0_10px_rgba(66,185,229,0.3)] hover:shadow-[0_0_15px_rgba(66,185,229,0.5)] flex items-center justify-center overflow-hidden"
            title={`Go to Profile - ${userName}`}
          >
            {userAvatar ? (
              <img 
                src={userAvatar} 
                alt={`${userName}'s avatar`}
                className="w-full h-full object-cover"
                onError={() => setUserAvatar(null)} // Fallback to icon if image fails
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#2e7fd8] to-[#35bfc0] hover:from-[#3590e0] hover:to-[#30b0b1] flex items-center justify-center">
                <User size={18} className="text-white" />
              </div>
            )}
          </button>
        ) : (
          <button
            onClick={openAuthModal}
            className="px-4 py-2 bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] text-white font-medium rounded-lg hover:shadow-[0_0_15px_rgba(66,185,229,0.4)] transition-all duration-300 transform hover:scale-105 text-sm"
          >
            Sign In
          </button>
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab="login"
      />
    </>
  );
};

export default AuthButton; 