"use client";

import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import client, { initializeAuth } from '@/api/client';
import Login from './Login';
import Register from './Register';

const AuthButton = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  // Check if user is logged in on component mount
  useEffect(() => {
    const checkAuth = () => {
      // First, initialize auth from client
      initializeAuth();
      
      // Then check login status
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('REF_TOKEN');
        setIsLoggedIn(!!token);
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
    
    // Update state
    setIsLoggedIn(false);
    setShowDropdown(false);
    
    // Optional: Navigate to home page
    router.push('/');
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLogin(false);
  };

  const handleRegisterSuccess = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  return (
    <div className="relative">
      {isLoggedIn ? (
        <>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
          >
            <User size={20} className="text-gray-700" />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  router.push('/profile');
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Profile
              </button>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  router.push('/settings');
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </>
      ) : (
        <button
          onClick={() => setShowLogin(true)}
          className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          Login
        </button>
      )}

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            >
              &times;
            </button>
            <div className="p-1">
              <Login onLogin={handleLoginSuccess} />
              <div className="text-center mt-4 text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => {
                    setShowLogin(false);
                    setShowRegister(true);
                  }}
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <button
              onClick={() => setShowRegister(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            >
              &times;
            </button>
            <div className="p-1">
              <Register onRegisterSuccess={handleRegisterSuccess} />
              <div className="text-center mt-4 text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => {
                    setShowRegister(false);
                    setShowLogin(true);
                  }}
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthButton; 