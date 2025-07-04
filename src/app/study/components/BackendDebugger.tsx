"use client";

import React, { useState } from 'react';
import client from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { getStudySets, createStudySet, deleteStudySet } from '@/services/studyService';
import { useTime } from '@/contexts/TimeContext';

interface DebugResult {
  timestamp: string;
  endpoint: string;
  method: string;
  request?: unknown;
  response?: unknown;
  error?: string;
  status?: number;
}

interface AxiosError {
  response?: {
    status?: number;
  };
  message?: string;
}

export default function BackendDebugger() {
  const [isVisible, setIsVisible] = useState(false);
  const [results, setResults] = useState<DebugResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { getCurrentDateTime } = useTime();

  const addResult = (result: DebugResult) => {
    setResults(prev => [result, ...prev].slice(0, 10)); // Keep last 10 results
  };

  const clearResults = () => {
    setResults([]);
  };

  // Test GET statistics endpoint
  const testGetStatistics = async () => {
    setIsLoading(true);
    const timestamp = getCurrentDateTime();
    
    try {
      const response = await client.get('/statistics', {
        params: {
          startDate: '2025-06-20',
          endDate: '2025-06-20'
        }
      });
      
      addResult({
        timestamp,
        endpoint: '/statistics',
        method: 'GET',
        request: { startDate: '2025-06-20', endDate: '2025-06-20' },
        response: response.data,
        status: response.status
      });
    } catch (error: unknown) {
      addResult({
        timestamp,
        endpoint: '/statistics',
        method: 'GET',
        request: { startDate: '2025-06-20', endDate: '2025-06-20' },
        error: error instanceof Error ? error.message : 'Unknown error',
        status: (error as AxiosError)?.response?.status
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test POST focus endpoint
  const testPostFocus = async () => {
    setIsLoading(true);
    const timestamp = getCurrentDateTime();
    
    try {
      const response = await client.post('/statistics/focus', {
        minutes: 25
      });
      
      addResult({
        timestamp,
        endpoint: '/statistics/focus',
        method: 'POST',
        request: { minutes: 25 },
        response: response.data,
        status: response.status
      });
    } catch (error: unknown) {
      addResult({
        timestamp,
        endpoint: '/statistics/focus',
        method: 'POST',
        request: { minutes: 25 },
        error: error instanceof Error ? error.message : 'Unknown error',
        status: (error as AxiosError)?.response?.status
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test POST sessions endpoint
  const testPostSessions = async () => {
    setIsLoading(true);
    const timestamp = getCurrentDateTime();
    
    try {
      const response = await client.post('/statistics/sessions', {
        increment: 1
      });
      
      addResult({
        timestamp,
        endpoint: '/statistics/sessions',
        method: 'POST',
        request: { increment: 1 },
        response: response.data,
        status: response.status
      });
    } catch (error: unknown) {
      addResult({
        timestamp,
        endpoint: '/statistics/sessions',
        method: 'POST',
        request: { increment: 1 },
        error: error instanceof Error ? error.message : 'Unknown error',
        status: (error as AxiosError)?.response?.status
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test POST tasks endpoint
  const testPostTasks = async () => {
    setIsLoading(true);
    const timestamp = getCurrentDateTime();
    
    try {
      const response = await client.post('/statistics/tasks', {
        increment: 1
      });
      
      addResult({
        timestamp,
        endpoint: '/statistics/tasks',
        method: 'POST',
        request: { increment: 1 },
        response: response.data,
        status: response.status
      });
    } catch (error: unknown) {
      addResult({
        timestamp,
        endpoint: '/statistics/tasks',
        method: 'POST',
        request: { increment: 1 },
        error: error instanceof Error ? error.message : 'Unknown error',
        status: (error as AxiosError)?.response?.status
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test sequence: POST then GET
  const testSequence = async () => {
    console.log('🔍 [BACKEND DEBUG] Starting POST→GET sequence test...');
    
    // First, add some focus time
    await testPostFocus();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Then immediately get statistics
    await testGetStatistics();
    
    console.log('🔍 [BACKEND DEBUG] Sequence test completed. Check results below.');
  };

  // Get authentication info
  const getAuthInfo = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('REF_TOKEN') : null;
    return {
      isAuthenticated,
      userEmail: user?.email,
      userId: user?.id,
      tokenPresent: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'None'
    };
  };

  // Debug date calculations
  const testDateCalculations = () => {
    const now = new Date();
    addResult({
      timestamp: new Date().toLocaleTimeString(),
      endpoint: 'Date Calculations',
      method: 'DEBUG',
      response: {
        // User's actual calendar date (what they expect)
        userCalendarDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
        userLocalTime: now.toLocaleString(),
        
        // What backend currently uses (UTC date)
        backendUTCDate: `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`,
        backendUTCTime: now.toUTCString(),
        
        // The mismatch explanation
        mismatch: now.getDate() !== now.getUTCDate() ? 
          `User sees ${now.getDate()}, backend uses ${now.getUTCDate()}` : 
          'No date mismatch',
        
        // Frontend now uses local date
        frontendUsesLocalDate: true,
        
        // Solution
        solution: 'Frontend now queries using LOCAL date to match user expectations',
        
        // Timezone info
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: now.getTimezoneOffset(),
        
        // Backend fix needed
        backendFixNeeded: 'Backend should use server local date, not UTC date for daily statistics'
      }
    });
  };

  const testCreateStudySet = async () => {
    try {
      addResult({
        timestamp: getCurrentDateTime(),
        endpoint: '/study-sets',
        method: 'POST',
        request: {
          name: `Debug Test Set ${getCurrentDateTime()}`,
          description: 'Created by debug tool',
          flashcards: [
            {
              question: 'Test Question 1',
              answer: 'Test Answer 1'
            }
          ]
        },
        response: null,
        status: 200
      });
      
      const createdSet = await createStudySet({
        title: `Debug Test Set ${getCurrentDateTime()}`,
        cards: [
          {
            front_content: 'Test Question 1',
            back_content: 'Test Answer 1'
          }
        ]
      });
      addResult({
        timestamp: getCurrentDateTime(),
        endpoint: '/study-sets',
        method: 'POST',
        request: {
          title: `Debug Test Set ${getCurrentDateTime()}`,
          cards: [
            {
              front_content: 'Test Question 1',
              back_content: 'Test Answer 1'
            }
          ]
        },
        response: createdSet,
        status: 200
      });
      return createdSet.id;
    } catch (error) {
      addResult({
        timestamp: getCurrentDateTime(),
        endpoint: '/study-sets',
        method: 'POST',
        request: {
          title: `Debug Test Set ${getCurrentDateTime()}`,
          cards: [
            {
              front_content: 'Test Question 1',
              back_content: 'Test Answer 1'
            }
          ]
        },
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500
      });
      return null;
    }
  };

  const testGetStudySets = async () => {
    try {
      addResult({
        timestamp: getCurrentDateTime(),
        endpoint: '/study-sets',
        method: 'GET',
        request: null,
        response: null,
        status: 200
      });
      
      const studySets = await getStudySets();
      addResult({
        timestamp: getCurrentDateTime(),
        endpoint: '/study-sets',
        method: 'GET',
        request: null,
        response: studySets,
        status: 200
      });
      
      return studySets;
    } catch (error) {
      addResult({
        timestamp: getCurrentDateTime(),
        endpoint: '/study-sets',
        method: 'GET',
        request: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500
      });
      return [];
    }
  };

  const testDeleteStudySet = async (setId: number) => {
    try {
      addResult({
        timestamp: getCurrentDateTime(),
        endpoint: `/study-sets/${setId}`,
        method: 'DELETE',
        request: null,
        response: null,
        status: 200
      });
      
      await deleteStudySet(setId.toString());
      addResult({
        timestamp: getCurrentDateTime(),
        endpoint: `/study-sets/${setId}`,
        method: 'DELETE',
        request: null,
        response: null,
        status: 200
      });
      
      return true;
    } catch (error) {
      addResult({
        timestamp: getCurrentDateTime(),
        endpoint: `/study-sets/${setId}`,
        method: 'DELETE',
        request: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500
      });
      return false;
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-16 right-4 bg-red-600 text-white px-3 py-2 rounded-lg text-sm z-50 animate-pulse"
      >
        🔧 Backend Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-[600px] max-h-[600px] overflow-auto bg-gray-900 text-white p-4 rounded-lg shadow-lg z-50 text-xs">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm">🔧 Backend API Debugger</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      {/* Auth Info */}
      <div className="mb-4 p-2 bg-gray-800 rounded">
        <h4 className="font-semibold mb-1">🔐 Authentication Status</h4>
        <pre className="text-xs">{JSON.stringify(getAuthInfo(), null, 2)}</pre>
      </div>
      
      {/* Test Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={testGetStatistics}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs disabled:opacity-50"
        >
          GET Statistics
        </button>
        
        <button
          onClick={testPostFocus}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs disabled:opacity-50"
        >
          POST Focus (+25m)
        </button>
        
        <button
          onClick={testPostSessions}
          disabled={isLoading}
          className="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-xs disabled:opacity-50"
        >
          POST Sessions (+1)
        </button>
        
        <button
          onClick={testPostTasks}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs disabled:opacity-50"
        >
          POST Tasks (+1)
        </button>
      </div>
      
      {/* Special Tests */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={testSequence}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs disabled:opacity-50"
        >
          🔍 Test POST→GET Sequence
        </button>
        
        <button
          onClick={testDateCalculations}
          className="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-xs"
        >
          🕐 Debug Dates
        </button>
        
        <button
          onClick={clearResults}
          className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs"
        >
          Clear Results
        </button>
      </div>
      
      {/* Loading */}
      {isLoading && (
        <div className="text-center py-2">
          <div className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2">Testing...</span>
        </div>
      )}
      
      {/* Results */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        <h4 className="font-semibold">📊 API Test Results:</h4>
        {results.length === 0 ? (
          <p className="text-gray-400">No results yet. Click buttons above to test.</p>
        ) : (
          results.map((result, index) => (
            <div key={index} className="bg-gray-800 rounded p-2 border-l-4 border-blue-500">
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono text-xs">
                  {result.method} {result.endpoint}
                </span>
                <span className={`text-xs px-1 rounded ${
                  result.status === 200 ? 'bg-green-600' : 
                  result.error ? 'bg-red-600' : 'bg-gray-600'
                }`}>
                  {result.status || 'ERROR'}
                </span>
              </div>
              
              <div className="text-xs text-gray-300 mb-1">
                {new Date(result.timestamp).toLocaleTimeString()}
              </div>
              
              {result.request != null && (
                <div className="mb-1">
                  <span className="text-yellow-400">Request:</span>
                  <pre className="text-xs text-gray-300 ml-2">{JSON.stringify(result.request, null, 2)}</pre>
                </div>
              )}
              
              {result.response != null && (
                <div className="mb-1">
                  <span className="text-green-400">Response:</span>
                  <pre className="text-xs text-gray-300 ml-2">{JSON.stringify(result.response, null, 2)}</pre>
                </div>
              )}
              
              {result.error && (
                <div>
                  <span className="text-red-400">Error:</span>
                  <pre className="text-xs text-red-300 ml-2">{result.error}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 