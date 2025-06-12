"use client";

import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import client, { initializeAuth } from '@/api/client';
import AuthModal from './AuthModal';

const AuthButton = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is logged in on component mount
  useEffect(() => {
    const checkAuth = () => {
      // Initialize auth from client
      initializeAuth();
      
      // Check if user has a valid token
      const token = typeof window !== 'undefined' ? localStorage.getItem('REF_TOKEN') : null;
      
      if (token && token !== 'dummy-auth-token') {
        setIsLoggedIn(true);
        client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        setIsLoggedIn(false);
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
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
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
            className="w-10 h-10 rounded-full bg-gradient-to-r from-[#2e7fd8] to-[#35bfc0] hover:from-[#3590e0] hover:to-[#30b0b1] border-2 border-[#42b9e5]/30 hover:border-[#42b9e5]/50 transition-all duration-200 shadow-[0_0_10px_rgba(66,185,229,0.3)] hover:shadow-[0_0_15px_rgba(66,185,229,0.5)] flex items-center justify-center"
            title="Go to Profile"
          >
            <User size={18} className="text-white" />
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