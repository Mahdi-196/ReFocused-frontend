"use client";

import React, { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import client from '../api/client';
import { timeService } from '../services/timeService';
import { useAuth } from '@/contexts/AuthContext';
import TimeTravel from './devTools/TimeTravel';
import DailyCacheStatus from './DailyCacheStatus';
import ConsoleControlPanel from './ConsoleControlPanel';

const DevTools: React.FC = () => {
  const toast = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [timeSystemStatus, setTimeSystemStatus] = useState({
    lastSync: null as string | null,
    syncStatus: 'Unknown' as string,
    timezone: null as string | null,
    isMock: false as boolean,
    backendTime: null as string | null,
  });
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    loadTimeSystemStatus();
  }, []);

  // Load time system status
  const loadTimeSystemStatus = async () => {
    try {
      const currentDate = await timeService.getCurrentDate();
      const timezone = await timeService.getUserTimezone();
      const isMock = await timeService.isMockDate();
      
      setTimeSystemStatus({
        lastSync: new Date().toLocaleTimeString(),
        syncStatus: 'Connected',
        timezone: timezone,
        isMock: isMock,
        backendTime: currentDate
      });
    } catch {
      setTimeSystemStatus({
        lastSync: null,
        syncStatus: 'Error',
        timezone: null,
        isMock: false,
        backendTime: null
      });
    }
  };

  // Time system testing
  const handleTestTimeSystem = async () => {
    try {
      console.log('🕰️ Testing Time System endpoints...');
      
      const timeEndpoints = [
        { name: 'GET /time/current', method: 'GET', url: '/time/current' },
        { name: 'POST /time/detect', method: 'POST', url: '/time/detect', data: { timezone: 'America/New_York' } },
        { name: 'GET /time/timezones', method: 'GET', url: '/time/timezones' },
        { name: 'GET /time/week-info', method: 'GET', url: '/time/week-info' },
        { name: 'POST /time/sync-check', method: 'POST', url: '/time/sync-check', data: { lastSync: Date.now() } },
        { name: 'POST /time/debug/change-day', method: 'POST', url: '/time/debug/change-day?direction=1' },
        { name: 'POST /time/debug/reset-date', method: 'POST', url: '/time/debug/reset-date' }
      ];

      const results = [];
      let passed = 0;
      let failed = 0;

      for (const endpoint of timeEndpoints) {
        try {
          let response;
          if (endpoint.method === 'GET') {
            response = await client.get(endpoint.url);
          } else if (endpoint.method === 'POST') {
            response = await client.post(endpoint.url, endpoint.data || {});
          }

          const result = `✅ ${endpoint.name}: Success!`;
          results.push(result);
          console.log(`✅ ${endpoint.name}:`, response?.data);
          passed++;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const result = `❌ ${endpoint.name}: Network Error - ${errorMessage}`;
          results.push(result);
          console.error(`❌ ${endpoint.name}:`, error);
          failed++;
        }
      }

      // Update time system status after testing
      await loadTimeSystemStatus();

      toast.showInfo(`Time system test complete: ${passed} passed, ${failed} failed`);

    } catch (error) {
      console.error('❌ Time system test failed:', error);
      toast.showError('Time system test failed. Check console for details.');
    }
  };

  // Clear test results
  const handleClearTestResults = () => {
    // setTestResults([]); // Function not implemented
  };

  // Quick endpoint testing
  const handleQuickEndpointTest = async (endpoint: string) => {
    let result = '';
    
    try {
      switch (endpoint) {
        case 'GET /time/current': {
          const response = await client.get('/time/current');
          result = `✅ GET /time/current: Success! Date: ${response.data.date}, Mock: ${response.data.isMockDate}`;
          console.log('Quick test - Time data:', response.data);
          break;
        }
          
        case 'POST /time/detect': {
          const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const response = await client.post('/time/detect', { timezone: clientTimezone });
          result = `✅ POST /time/detect: Success! Detected: ${response.data.detectedTimezone}, Updated: ${response.data.updated}`;
          console.log('Quick test - Timezone detection:', response.data);
          break;
        }
          
        case 'GET /time/timezones': {
          const response = await client.get('/time/timezones');
          result = `✅ GET /time/timezones: Success! Available: ${response.data.length} timezones`;
          console.log('Quick test - Timezones:', response.data);
          break;
        }
          
        case 'GET /time/week-info': {
          const response = await client.get('/time/week-info');
          result = `✅ GET /time/week-info: Success! Week start: ${response.data.weekStart}, Week end: ${response.data.weekEnd}, Week number: ${response.data.weekNumber}`;
          console.log('Quick test - Week info:', response.data);
          break;
        }
          
        case 'POST /time/debug/change-day': {
          const response = await client.post('/time/debug/change-day?direction=1', null, {
            headers: { 'Content-Type': 'text/plain' }
          });
          result = `✅ POST /time/debug/change-day: Success! New date: ${response.data.newDate}, Previous date: ${response.data.previousDate}, Direction: ${response.data.direction > 0 ? 'Forward' : 'Backward'}`;
          console.log('Quick test - Date change:', response.data);
          break;
        }
          
        case 'POST /time/debug/reset-date': {
          const response = await client.post('/time/debug/reset-date', null, {
            headers: { 'Content-Type': 'text/plain' }
          });
          result = `✅ POST /time/debug/reset-date: Success! New date: ${response.data.currentDate}, Time: ${response.data.currentDateTime}, Timezone: ${response.data.timezone}`;
          console.log('Quick test - Date reset:', response.data);
          break;
        }
          
        default:
          result = `❌ Unknown endpoint: ${endpoint}`;
      }
      
      await loadTimeSystemStatus();
      
    } catch (error) {
      result = `❌ ${endpoint}: Failed - ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`Quick test failed for ${endpoint}:`, error);
    }
    
    toast.showInfo(result);
  };

  // Enhanced date manipulation functions
  const handleChangeDayForward = async () => {
    try {
      console.log('🚀 Moving date forward by 1 day...');
      const response = await client.post('/time/debug/change-day?direction=1', null, {
        headers: { 'Content-Type': 'text/plain' }
      });
      
      console.log('📅 Date change response:', response.data);
      
      // Update time system status
      await loadTimeSystemStatus();
      
      toast.showSuccess('Date moved forward by 1 day');
      
    } catch (error) {
      console.error('❌ Failed to move date forward:', error);
      toast.showError('Failed to move date forward. Check console for details.');
    }
  };

  const handleChangeDayBackward = async () => {
    try {
      console.log('⏪ Moving date backward by 1 day...');
      const response = await client.post('/time/debug/change-day?direction=-1', null, {
        headers: { 'Content-Type': 'text/plain' }
      });
      
      console.log('📅 Date change response:', response.data);
      
      // Update time system status
      await loadTimeSystemStatus();
      
      toast.showSuccess('Date moved backward by 1 day');
      
    } catch (error) {
      console.error('❌ Failed to move date backward:', error);
      toast.showError('Failed to move date backward. Check console for details.');
    }
  };

  const handleResetToRealDate = async () => {
    try {
      console.log('🔄 Resetting to real current date...');
      const response = await client.post('/time/debug/reset-date', null, {
        headers: { 'Content-Type': 'text/plain' }
      });
      
      console.log('📅 Date reset response:', response.data);
      
      // Update time system status
      await loadTimeSystemStatus();
      
      toast.showSuccess('Reset to real time');
      
    } catch (error) {
      console.error('❌ Failed to reset date:', error);
      toast.showError('Failed to reset date. Check console for details.');
    }
  };

  // === DEVELOPMENT ONLY - Hide in production ===
  if (process.env.NEXT_PUBLIC_APP_ENV !== 'development') {
    return null;
  }

  // Get auth token from localStorage for debugging
  const token = typeof window !== 'undefined' ? localStorage.getItem('REF_TOKEN') : null;
  
  // Decode JWT to check expiration
  const getTokenInfo = () => {
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      const isExpired = payload.exp < now;
      
      return {
        userId: payload.sub,
        exp: payload.exp,
        expDate: new Date(payload.exp * 1000).toLocaleString(),
        isExpired,
        timeUntilExpiry: isExpired ? 'EXPIRED' : `${Math.round((payload.exp - now) / 60)} minutes`
      };
    } catch (error) {
      return { error: 'Invalid token format' };
    }
  };
  
  const tokenInfo = getTokenInfo();

  // Clear local storage function
  const handleClearLocalStorage = () => {
    if (process.env.NEXT_PUBLIC_APP_ENV !== 'development') return;
    const shouldProceed = window.confirm('⚠️ Clear all local storage?\n\nThis will:\n• Log you out\n• Clear all cached data\n• Reset user preferences\n• Clear any saved settings\n\nThis action cannot be undone.');
    if (shouldProceed) {
      // Get all keys before clearing
      const keys = Object.keys(localStorage);
      
      // Clear all local storage
      localStorage.clear();
      
      // Dispatch logout event to notify other components
      window.dispatchEvent(new CustomEvent('userLoggedOut'));
      
      // Show confirmation with what was cleared
      toast.showSuccess(`Local storage cleared (${keys.length} items). Reloading...`);
      
      // Reload page to reset application state
      window.location.reload();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium shadow-lg hover:bg-blue-700 transition-colors"
      >
        🔧 Dev Tools
      </button>
      
      {isVisible && (
        <div className="mt-2 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl max-w-2xl max-h-[80vh] overflow-auto">
          {/* Time Travel Section - Available to all users for testing */}
          <div className="mb-6">
            <TimeTravel />
          </div>
          
          {/* Storage Management Section */}
          <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-gray-900 dark:text-white font-bold mb-3 text-sm">🗄️ Storage Management</h3>
            
            <div className="space-y-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Current storage items: {typeof window !== 'undefined' ? Object.keys(localStorage).length : 0}
              </div>
              
              {typeof window !== 'undefined' && Object.keys(localStorage).length > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <details className="cursor-pointer">
                    <summary className="hover:text-gray-900 dark:hover:text-gray-200">View stored items</summary>
                    <div className="mt-2 ml-2 space-y-1 font-mono">
                      {Object.keys(localStorage).map(key => (
                        <div key={key} className="text-gray-500 dark:text-gray-500">
                          • {key}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
              
              <button
                onClick={handleClearLocalStorage}
                className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors font-medium"
              >
                🗑️ Clear All Local Storage
              </button>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                ⚠️ This will log you out and clear all cached data
              </div>
            </div>
          </div>

          {/* Daily Cache Status (inline) */}
          <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-gray-900 dark:text-white font-bold mb-3 text-sm">📋 Daily Cache Status</h3>
            <DailyCacheStatus />
          </div>

          {/* Console Control (inline) */}
          <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-gray-900 dark:text-white font-bold mb-3 text-sm">🖥️ Console Control</h3>
            <ConsoleControlPanel inline />
          </div>
          
          {/* Authentication Debug Section */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-gray-900 dark:text-white font-bold mb-3 text-sm">🔧 Authentication Debug</h3>
            
            <div className="space-y-2 text-xs font-mono">
              <div className="text-gray-700 dark:text-gray-300">
                <span className="text-yellow-600 dark:text-yellow-400">Loading:</span> {isLoading ? '⏳ Yes' : '✅ No'}
              </div>
              
              <div className="text-gray-700 dark:text-gray-300">
                <span className="text-yellow-600 dark:text-yellow-400">Authenticated:</span> {isAuthenticated ? '✅ Yes' : '❌ No'}
              </div>
              
              <div className="text-gray-700 dark:text-gray-300">
                <span className="text-yellow-600 dark:text-yellow-400">Token Present:</span> {token ? '✅ Yes' : '❌ No'}
              </div>
              
              {token && (
                <div className="text-gray-700 dark:text-gray-300">
                  <span className="text-yellow-600 dark:text-yellow-400">Token Preview:</span> {token.substring(0, 20)}...
                </div>
              )}
              
              {tokenInfo && !tokenInfo.error && (
                <>
                  <div className="text-gray-700 dark:text-gray-300">
                    <span className="text-yellow-600 dark:text-yellow-400">Token User ID:</span> {tokenInfo.userId}
                  </div>
                  
                  <div className="text-gray-700 dark:text-gray-300">
                    <span className="text-yellow-600 dark:text-yellow-400">Token Status:</span> 
                    <span className={tokenInfo.isExpired ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                      {tokenInfo.isExpired ? '❌ EXPIRED' : '✅ Valid'}
                    </span>
                  </div>
                  
                  <div className="text-gray-700 dark:text-gray-300">
                    <span className="text-yellow-600 dark:text-yellow-400">Expires:</span> {tokenInfo.expDate}
                  </div>
                  
                  <div className="text-gray-700 dark:text-gray-300">
                    <span className="text-yellow-600 dark:text-yellow-400">Time Left:</span> 
                    <span className={tokenInfo.isExpired ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                      {tokenInfo.timeUntilExpiry}
                    </span>
                  </div>
                </>
              )}
              
              {tokenInfo?.error && (
                <div className="text-gray-700 dark:text-gray-300">
                  <span className="text-red-500 dark:text-red-400">Token Error:</span> {tokenInfo.error}
                </div>
              )}
              
              <div className="text-gray-700 dark:text-gray-300">
                <span className="text-yellow-600 dark:text-yellow-400">User ID:</span> {user?.id || '❌ None'}
              </div>
              
              <div className="text-gray-700 dark:text-gray-300">
                <span className="text-yellow-600 dark:text-yellow-400">User Email:</span> {user?.email || '❌ None'}
              </div>
              
              {!isAuthenticated && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-600">
                  <div className="text-red-700 dark:text-red-300 font-bold">❌ Authentication Required</div>
                  <div className="text-red-600 dark:text-red-200 text-xs mt-1">
                    User must log in to access API endpoints.
                    Current API requests will fail with 401/500 errors.
                  </div>
                </div>
              )}
              
              {tokenInfo?.isExpired && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-600">
                  <div className="text-red-700 dark:text-red-300 font-bold">🕐 Token Expired</div>
                  <div className="text-red-600 dark:text-red-200 text-xs mt-1">
                    JWT token expired on {tokenInfo.expDate}.
                    Please log in again to get a fresh token.
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem('REF_TOKEN');
                      localStorage.removeItem('REF_USER');
                      // Dispatch custom event to notify other components
                      window.dispatchEvent(new CustomEvent('userLoggedOut'));
                      window.location.href = '/';
                    }}
                    className="mt-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                  >
                    Clear & Redirect to Login
                  </button>
                </div>
              )}
              
              {isAuthenticated && tokenInfo && !tokenInfo.isExpired && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 rounded border border-green-200 dark:border-green-600">
                  <div className="text-green-700 dark:text-green-300 font-bold">✅ Authentication Active</div>
                  <div className="text-green-600 dark:text-green-200 text-xs mt-1">
                    API requests should include Bearer token.
                    Token valid for {tokenInfo.timeUntilExpiry}.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevTools;
