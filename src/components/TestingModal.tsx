"use client";

import { useState } from 'react';
import { X, TestTube, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  response?: any;
  error?: string;
  duration?: number;
}

interface TestCase {
  id: string;
  name: string;
  endpoint: string;
  method: string;
  payload?: any;
  description: string;
}

interface TestingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TEST_CASES: TestCase[] = [
  {
    id: 'mind-fuel',
    name: 'Mind Fuel Generation',
    endpoint: `/api/mind-fuel`,
    method: 'POST',
    description: 'Tests weekly focus, tips, productivity hacks, brain boost, and mindfulness moments'
  },
  {
    id: 'quote-of-day',
    name: 'Quote of the Day',
    endpoint: `/api/quote-of-day`,
    method: 'POST',
    description: 'Tests inspirational quote generation with author attribution'
  },
  {
    id: 'word-of-day',
    name: 'Word of the Day',
    endpoint: `/api/word-of-day`,
    method: 'POST',
    description: 'Tests vocabulary word with pronunciation, definition, and example'
  },
  {
    id: 'ai-assistance-books',
    name: 'AI Book Recommendations',
    endpoint: `/api/ai-chat`,
    method: 'POST',
    payload: {
      message: "Recommend 3 books about mindfulness, meditation, or personal growth that would help me develop a better meditation practice and reduce daily stress."
    },
    description: 'Tests AI assistance for book recommendations via backend'
  },
  {
    id: 'ai-assistance-affirmations',
    name: 'AI Daily Affirmations',
    endpoint: `/api/ai-chat`,
    method: 'POST',
    payload: {
      message: "Create 5 personalized daily affirmations that will help me stay calm, focused, and positive throughout my day, especially during stressful moments."
    },
    description: 'Tests AI assistance for daily affirmations via backend'
  },
  {
    id: 'ai-assistance-meditation',
    name: 'AI Meditation Guidance',
    endpoint: `/api/ai-chat`,
    method: 'POST',
    payload: {
      message: "Guide me through a personalized 10-minute meditation session based on my current stress level and what I'm hoping to achieve from today's practice."
    },
    description: 'Tests AI assistance for meditation guidance via backend'
  },
  {
    id: 'ai-assistance-stress-relief',
    name: 'AI Stress Relief',
    endpoint: `/api/ai-chat`,
    method: 'POST',
    payload: {
      message: "Suggest 5 quick stress relief techniques I can use during work breaks, including breathing exercises and mindfulness practices under 5 minutes."
    },
    description: 'Tests AI assistance for stress relief techniques via backend'
  },
  {
    id: 'data-population-journal',
    name: 'Data Population - Journal Prompts',
    endpoint: `/api/populate-data`,
    method: 'POST',
    payload: {
      dataType: 'journal-prompts',
      count: 3
    },
    description: 'Tests AI data population for journal writing prompts'
  },
  {
    id: 'data-population-goals',
    name: 'Data Population - Goals',
    endpoint: `/api/populate-data`,
    method: 'POST',
    payload: {
      dataType: 'goals',
      count: 2
    },
    description: 'Tests AI data population for personal development goals'
  },
  {
    id: 'data-population-affirmations',
    name: 'Data Population - Affirmations',
    endpoint: `/api/populate-data`,
    method: 'POST',
    payload: {
      dataType: 'affirmations',
      count: 3
    },
    description: 'Tests AI data population for daily affirmations'
  },
  {
    id: 'data-population-habits',
    name: 'Data Population - Habits',
    endpoint: `/api/populate-data`,
    method: 'POST',
    payload: {
      dataType: 'habits',
      count: 2
    },
    description: 'Tests AI data population for healthy daily habits'
  },
  {
    id: 'data-population-meditation',
    name: 'Data Population - Meditation Sessions',
    endpoint: `/api/populate-data`,
    method: 'POST',
    payload: {
      dataType: 'meditation-sessions',
      count: 2
    },
    description: 'Tests AI data population for guided meditation sessions'
  }
];

export default function TestingModal({ isOpen, onClose }: TestingModalProps) {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningAll, setIsRunningAll] = useState(false);

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const runSingleTest = async (testCase: TestCase) => {
    const startTime = Date.now();
    const testResult: TestResult = {
      id: testCase.id,
      name: testCase.name,
      status: 'running'
    };

    setTestResults(prev => {
      const existing = prev.find(r => r.id === testCase.id);
      if (existing) {
        return prev.map(r => r.id === testCase.id ? testResult : r);
      }
      return [...prev, testResult];
    });

    try {
      const response = await fetch(testCase.endpoint, {
        method: testCase.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: testCase.payload ? JSON.stringify(testCase.payload) : undefined,
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      if (response.ok) {
        setTestResults(prev => prev.map(r => 
          r.id === testCase.id 
            ? { ...r, status: 'success', response: data, duration }
            : r
        ));
      } else {
        throw new Error(`HTTP ${response.status}: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResults(prev => prev.map(r => 
        r.id === testCase.id 
          ? { ...r, status: 'error', error: error instanceof Error ? error.message : 'Unknown error', duration }
          : r
      ));
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    setTestResults([]);

    for (const testCase of TEST_CASES) {
      await runSingleTest(testCase);
      // Add small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunningAll(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-[#10182B] to-[#0c1324] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-600/30"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-600/30">
            <div className="flex items-center gap-3">
              <TestTube className="w-6 h-6 text-[#42b9e5]" />
              <h2 className="text-xl font-semibold text-white">API Testing Suite</h2>
              <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-md font-medium">
                DEV ONLY
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Controls */}
          <div className="p-6 border-b border-gray-600/30 bg-gray-800/20">
            <div className="flex items-center gap-4">
              <button
                onClick={runAllTests}
                disabled={isRunningAll}
                className="px-4 py-2 bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] hover:shadow-[0_0_20px_rgba(66,185,229,0.4)] disabled:opacity-50 text-white rounded-lg transition-all duration-300 flex items-center gap-2 font-medium"
              >
                {isRunningAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run All Tests
                  </>
                )}
              </button>
              <button
                onClick={clearResults}
                className="px-4 py-2 bg-gray-800/50 border border-gray-600/50 hover:bg-gray-700/50 text-white rounded-lg transition-colors font-medium"
              >
                Clear Results
              </button>
              <div className="ml-auto text-sm text-gray-400">
                {testResults.length > 0 && (
                  <span>
                    {testResults.filter(r => r.status === 'success').length} passed, {' '}
                    {testResults.filter(r => r.status === 'error').length} failed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Test Cases */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
              {TEST_CASES.map(testCase => {
                const result = testResults.find(r => r.id === testCase.id);
                
                return (
                  <motion.div
                    key={testCase.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/30 rounded-lg border border-gray-600/40 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(result?.status || 'pending')}
                          <h3 className="text-lg font-medium text-white">{testCase.name}</h3>
                          {result?.duration && (
                            <span className="text-xs text-gray-400">
                              ({result.duration}ms)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs bg-gray-800/50 text-gray-300 rounded font-mono">
                            {testCase.method}
                          </span>
                          <button
                            onClick={() => runSingleTest(testCase)}
                            disabled={result?.status === 'running'}
                            className="px-3 py-1 bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] hover:shadow-[0_0_15px_rgba(66,185,229,0.3)] disabled:opacity-50 text-white text-xs rounded transition-all duration-200"
                          >
                            Test
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-2">{testCase.description}</p>
                      <p className="text-xs text-gray-500 font-mono">{testCase.endpoint}</p>

                      {result?.error && (
                        <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-md">
                          <p className="text-sm text-red-400 font-medium">Error:</p>
                          <p className="text-xs text-red-300 mt-1 font-mono">{result.error}</p>
                        </div>
                      )}

                      {result?.response && result.status === 'success' && (
                        <div className="mt-3 p-3 bg-green-900/20 border border-green-500/30 rounded-md">
                          <p className="text-sm text-green-400 font-medium mb-2">Response:</p>
                          <pre className="text-xs text-green-300 font-mono overflow-x-auto max-h-32 overflow-y-auto">
                            {JSON.stringify(result.response, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}