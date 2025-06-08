"use client";

import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import client, { initializeAuth } from '@/api/client';

const AuthButton = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  // Check if user is logged in on component mount
  useEffect(() => {
    const checkAuth = () => {
      // First, initialize auth from client
      initializeAuth();
      
      // Set user as logged in by default (simulating logged in state)
      // You can replace this logic later with actual authentication
      setIsLoggedIn(true);
      
      // Store a dummy token to maintain existing logic compatibility
      if (typeof window !== 'undefined' && !localStorage.getItem('REF_TOKEN')) {
        localStorage.setItem('REF_TOKEN', 'dummy-auth-token');
      }
    };
    
    checkAuth();
    
    // Also check on visibility change (user might have logged in/out in another tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleLogout = () => {
    // Clear token from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('REF_TOKEN');
    }
    
    // Remove Authorization header
    delete client.defaults.headers.common['Authorization'];
    
    // Update state - temporarily set to false, but will be reset to true on next visit
    setIsLoggedIn(false);
    
    // Show alert and auto re-login after 2 seconds (simulating automatic login)
    alert('Signed out successfully! You will be automatically signed back in.');
    setTimeout(() => {
      setIsLoggedIn(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('REF_TOKEN', 'dummy-auth-token');
      }
    }, 2000);
    
    // Optional: Navigate to home page
    router.push('/');
  };

  return (
    <div className="relative">
      {isLoggedIn ? (
        <>
          <button 
            onClick={() => router.push('/profile')}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 border-2 border-gray-600/50 hover:border-gray-500/70 transition-all duration-200 shadow-lg hover:shadow-xl"
            title="Go to Profile"
          >
            <User size={18} className="text-white" />
          </button>

        </>
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-700/50 border-2 border-gray-600/50 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default AuthButton; 