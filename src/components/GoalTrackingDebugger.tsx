'use client';

import React, { useState } from 'react';
import { GoalsService } from '@/services/goalsService';
import { getCalendarEntries, clearCalendarCache } from '@/services/calendarService';
import { timeService } from '@/services/timeService';
import { 
  Goal, 
  calculateGoalProgress, 
  getGoalProgressText, 
  isGoalCompleted 
} from '@/types/goal';

interface DebugResponse {
  timestamp: string;
  action: string;
  data: any;
  error?: string;
}

// Component to display a single goal in the same format as the goals page
const GoalDisplay: React.FC<{ goal: Goal }> = ({ goal }) => {
  const progress = calculateGoalProgress(goal);
  const completed = isGoalCompleted(goal);
  const progressText = getGoalProgressText(goal);

  return (
    <div className="group relative bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
      <div className="flex justify-between items-center text-sm mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-200">{goal.name}</span>
          
          {/* Goal type badges */}
          {goal.goal_type === 'checklist' && (
            <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">
              ✅ Checklist
            </span>
          )}
          {goal.goal_type === 'counter' && (
            <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
              🔢 {goal.current_value}/{goal.target_value}
            </span>
          )}
          {goal.goal_type === 'percentage' && (
            <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded">
              📊 Percentage
            </span>
          )}
        </div>
        
        <span className="text-gray-300 text-xs">
          {progressText}
        </span>
      </div>
      
      {/* Progress bar - hide for checklists */}
      {goal.goal_type !== 'checklist' && (
        <div className="h-2 bg-gray-600/50 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              completed 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600'
            }`} 
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
      
      {/* Goal details */}
      <div className="mt-2 text-xs text-gray-400 space-y-1">
        <div>ID: {goal.id} | Type: {goal.goal_type} | Duration: {goal.duration}</div>
        <div>Progress: {progress.toFixed(1)}% | Backend %: {goal.progress_percentage || 0}%</div>
        <div>Status: {completed ? 'Completed' : 'Active'} | Created: {new Date(goal.created_at).toLocaleDateString()}</div>
      </div>
    </div>
  );
};

// Component to display calendar entries with goal activities
const CalendarEntryDisplay: React.FC<{ entry: any }> = ({ entry }) => {
  if (!entry.goalActivities || entry.goalActivities.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-200">📅 {entry.date}</h4>
        <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
          {entry.goalActivities.length} activities
        </span>
      </div>
      
      <div className="space-y-2">
        {entry.goalActivities.map((activity: any, index: number) => (
          <div key={index} className="flex items-center gap-3 p-2 bg-gray-700/30 rounded">
            <div className={`w-2 h-2 rounded-full ${
              activity.activityType === 'completed' ? 'bg-green-500' :
              activity.activityType === 'created' ? 'bg-blue-500' :
              'bg-amber-500'
            }`} />
            <div className="flex-1">
              <div className="text-sm text-gray-200">{activity.goalName}</div>
              <div className="text-xs text-gray-400">{activity.notes}</div>
            </div>
            <div className="text-xs bg-gray-600/50 text-gray-400 px-2 py-1 rounded">
              {activity.activityType}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function GoalTrackingDebugger() {
  const [responses, setResponses] = useState<DebugResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testGoalId, setTestGoalId] = useState<string>('');
  const [testProgress, setTestProgress] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const goalsService = new GoalsService();

  const addResponse = (action: string, data: any, error?: string) => {
    const response: DebugResponse = {
      timestamp: new Date().toISOString(),
      action,
      data,
      error
    };
    setResponses(prev => [response, ...prev]);
  };

  const testCreateCounterGoal = async () => {
    setIsLoading(true);
    try {
      const goal = await goalsService.createGoal({
        name: 'Test Counter Goal',
        goal_type: 'counter',
        duration: '2_week',
        target_value: 10
      });
      addResponse('CREATE_COUNTER_GOAL', goal);
    } catch (error) {
      addResponse('CREATE_COUNTER_GOAL', null, error?.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const testUpdateGoalProgress = async () => {
    if (!testGoalId || !testProgress) {
      addResponse('UPDATE_GOAL_PROGRESS', null, 'Please provide Goal ID and Progress Value');
      return;
    }

    setIsLoading(true);
    try {
      const result = await goalsService.updateGoalProgress({
        goalId: parseInt(testGoalId),
        goalType: 'counter',
        action: 'setValue',
        value: parseInt(testProgress)
      });
      addResponse('UPDATE_GOAL_PROGRESS', result);
    } catch (error) {
      addResponse('UPDATE_GOAL_PROGRESS', null, error?.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const testGetAllGoals = async () => {
    setIsLoading(true);
    try {
      const goals = await goalsService.getAllGoals();
      addResponse('GET_ALL_GOALS', goals);
    } catch (error) {
      addResponse('GET_ALL_GOALS', null, error?.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const testGetGoalsForDate = async () => {
    setIsLoading(true);
    try {
      const goals = await goalsService.getGoalsForDate(selectedDate);
      addResponse('GET_GOALS_FOR_DATE', { date: selectedDate, goals });
    } catch (error) {
      addResponse('GET_GOALS_FOR_DATE', null, error?.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const testGetGoalsWithDailyProgress = async () => {
    setIsLoading(true);
    try {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      const result = await goalsService.getGoalsWithDailyProgress(startDate, endDate);
      addResponse('GET_GOALS_WITH_DAILY_PROGRESS', result);
    } catch (error) {
      addResponse('GET_GOALS_WITH_DAILY_PROGRESS', null, error?.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const testGetCalendarEntries = async () => {
    setIsLoading(true);
    try {
      const startDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const entries = await getCalendarEntries(startDate, endDate);
      addResponse('GET_CALENDAR_ENTRIES', { startDate, endDate, entries });
    } catch (error) {
      addResponse('GET_CALENDAR_ENTRIES', null, error?.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const testTimeService = async () => {
    setIsLoading(true);
    try {
      const currentDate = timeService.getCurrentDate();
      const currentDateTime = timeService.getCurrentDateTime();
      const userTimezone = timeService.getUserTimezone();
      const isMockDate = timeService.isMockDate();
      const state = timeService.getState();
      
      addResponse('TIME_SERVICE', {
        currentDate,
        currentDateTime,
        userTimezone,
        isMockDate,
        state,
        systemDate: new Date().toISOString().split('T')[0],
        systemTime: new Date().toISOString()
      });
    } catch (error) {
      addResponse('TIME_SERVICE', null, error?.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const resetMockDate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });
      const data = await response.json();
      addResponse('RESET_MOCK_DATE', data);
    } catch (error) {
      addResponse('RESET_MOCK_DATE', null, error?.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const setTodayAsMockDate = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch('/api/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setDate', date: today })
      });
      const data = await response.json();
      addResponse('SET_TODAY_AS_MOCK', data);
    } catch (error) {
      addResponse('SET_TODAY_AS_MOCK', null, error?.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const testDateRangeAlignment = async () => {
    setIsLoading(true);
    try {
      const systemDate = new Date().toISOString().split('T')[0];
      const serviceDate = timeService.getCurrentDate();
      const serviceDateTime = timeService.getCurrentDateTime();
      const userTimezone = timeService.getUserTimezone();
      const isMockDate = timeService.isMockDate();
      
      // Test calendar entries with different date references
      const testRanges = [
        { name: 'System Date Range', start: systemDate, end: systemDate },
        { name: 'Service Date Range', start: serviceDate, end: serviceDate },
        { name: 'Week Around System', start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      ];
      
      const results = [];
      
      for (const range of testRanges) {
        try {
          const entries = await getCalendarEntries(range.start, range.end);
          const entriesWithGoals = entries.filter(e => e.goalActivities && e.goalActivities.length > 0);
          
          results.push({
            range,
            totalEntries: entries.length,
            entriesWithGoals: entriesWithGoals.length,
            goalActivities: entriesWithGoals.flatMap(e => e.goalActivities || []).length,
            sampleDates: entries.slice(0, 3).map(e => e.date)
          });
        } catch (error) {
          results.push({
            range,
            error: error?.toString()
          });
        }
      }
      
      addResponse('TEST_DATE_RANGE_ALIGNMENT', {
        systemDate,
        serviceDate,
        serviceDateTime,
        userTimezone,
        isMockDate,
        dateMatches: systemDate === serviceDate,
        results
      });
    } catch (error) {
      addResponse('TEST_DATE_RANGE_ALIGNMENT', null, error?.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = () => {
    clearCalendarCache();
    addResponse('CLEAR_CACHE', { message: 'Calendar cache cleared' });
  };

  const clearResponses = () => {
    setResponses([]);
    console.clear();
  };

  const testNineOfTenScenario = async () => {
    setIsLoading(true);
    try {
      console.log('🎯 Testing 9/10 counter goal scenario');
      
      // Step 1: Create a counter goal with target 10
      const goal = await goalsService.createGoal({
        name: '9/10 Test Goal',
        goal_type: 'counter',
        duration: '2_week',
        target_value: 10
      });
      
      console.log('✅ Created goal:', goal);
      
      // Step 2: Update progress to 9
      const updatedGoal = await goalsService.updateGoalProgress({
        goalId: goal.id,
        goalType: 'counter',
        action: 'setValue',
        value: 9
      });
      
      console.log('✅ Updated to 9/10:', updatedGoal);
      
      // Step 3: Check calendar entries to see how it displays
      const startDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const calendarEntries = await getCalendarEntries(startDate, endDate);
      
      const entryWithGoal = calendarEntries.find(entry => 
        entry.goalActivities?.some(activity => activity.goalId === goal.id)
      );
      
      addResponse('TEST_NINE_OF_TEN', {
        goal: {
          id: goal.id,
          name: goal.name,
          target_value: goal.target_value,
          initial_current_value: goal.current_value,
          initial_progress_percentage: goal.progress_percentage
        },
        afterUpdate: {
          current_value: updatedGoal.current_value,
          target_value: updatedGoal.target_value,
          progress_percentage: updatedGoal.progress_percentage,
          expectedPercentage: Math.round((9 / 10) * 100),
          calculationCorrect: updatedGoal.progress_percentage === 90
        },
        calendarDisplay: {
          foundInCalendar: !!entryWithGoal,
          calendarDate: entryWithGoal?.date,
          goalActivities: entryWithGoal?.goalActivities?.filter(a => a.goalId === goal.id) || []
        },
        issue: {
          shouldShow: "9/10 (90%)",
          actualBackendPercentage: updatedGoal.progress_percentage,
          backendCalculationCorrect: updatedGoal.progress_percentage === 90
        }
      });
      
    } catch (error) {
      addResponse('TEST_NINE_OF_TEN', null, error?.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const testProgressDisplayIssue = async () => {
    setIsLoading(true);
    try {
      console.log('📊 Testing progress display formatting');
      
      // Create multiple goals with different progress levels
      const testCases = [
        { name: 'Test 50%', target: 10, progress: 5, expected: 50 },
        { name: 'Test 90%', target: 10, progress: 9, expected: 90 },
        { name: 'Test 33%', target: 3, progress: 1, expected: 33 },
        { name: 'Test 100%', target: 5, progress: 5, expected: 100 }
      ];
      
      const results = [];
      
      for (const testCase of testCases) {
        // Create goal
        const goal = await goalsService.createGoal({
          name: testCase.name,
          goal_type: 'counter',
          duration: '2_week',
          target_value: testCase.target
        });
        
        // Update progress
        const updatedGoal = await goalsService.updateGoalProgress({
          goalId: goal.id,
          goalType: 'counter',
          action: 'setValue',
          value: testCase.progress
        });
        
        results.push({
          testCase,
          goal: {
            id: goal.id,
            current_value: updatedGoal.current_value,
            target_value: updatedGoal.target_value,
            progress_percentage: updatedGoal.progress_percentage
          },
          verification: {
            expectedPercentage: testCase.expected,
            actualPercentage: updatedGoal.progress_percentage,
            isCorrect: Math.abs(updatedGoal.progress_percentage - testCase.expected) <= 1, // Allow 1% rounding error
            displayString: `${updatedGoal.current_value}/${updatedGoal.target_value} (${Math.round(updatedGoal.progress_percentage)}%)`
          }
        });
      }
      
      addResponse('TEST_PROGRESS_DISPLAY', {
        testCases: results,
        summary: {
          total: results.length,
          correct: results.filter(r => r.verification.isCorrect).length,
          allCorrect: results.every(r => r.verification.isCorrect)
        }
      });
      
    } catch (error) {
      addResponse('TEST_PROGRESS_DISPLAY', null, error?.toString());
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to render response data in a user-friendly format
  const renderResponseData = (response: DebugResponse) => {
    if (response.error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-600">{response.error}</p>
        </div>
      );
    }

    const { action, data } = response;

    // Handle different response types with visual displays
    switch (action) {
      case 'CREATE_COUNTER_GOAL':
      case 'UPDATE_GOAL_PROGRESS':
        if (data && typeof data === 'object' && data.id) {
          return <GoalDisplay goal={data} />;
        }
        break;

      case 'GET_ALL_GOALS':
        if (Array.isArray(data)) {
          return (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-2">Found {data.length} goals:</div>
              {data.map((goal: Goal) => (
                <GoalDisplay key={goal.id} goal={goal} />
              ))}
            </div>
          );
        }
        break;

      case 'GET_GOALS_FOR_DATE':
        if (data && Array.isArray(data.goals)) {
          return (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-2">Goals for {data.date} ({data.goals.length} found):</div>
              {data.goals.map((goal: Goal) => (
                <GoalDisplay key={goal.id} goal={goal} />
              ))}
            </div>
          );
        }
        break;

      case 'GET_GOALS_WITH_DAILY_PROGRESS':
        if (data && Array.isArray(data.goals)) {
          return (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-2">Goals with daily progress ({data.goals.length} found):</div>
              {data.goals.map((goal: Goal) => (
                <GoalDisplay key={goal.id} goal={goal} />
              ))}
              {data.dailyProgress && data.dailyProgress.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <div className="text-sm font-medium text-blue-800 mb-2">Daily Progress Entries:</div>
                  <div className="text-xs text-blue-700">{data.dailyProgress.length} progress entries found</div>
                </div>
              )}
            </div>
          );
        }
        break;

      case 'GET_CALENDAR_ENTRIES':
        if (data && Array.isArray(data.entries)) {
          const entriesWithGoals = data.entries.filter((entry: any) => entry.goalActivities && entry.goalActivities.length > 0);
          return (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-2">
                Calendar entries from {data.startDate} to {data.endDate} ({entriesWithGoals.length} with goals):
              </div>
              {entriesWithGoals.map((entry: any) => (
                <CalendarEntryDisplay key={entry.date} entry={entry} />
              ))}
            </div>
          );
        }
        break;

      case 'TEST_NINE_OF_TEN':
        if (data) {
          return (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">🎯 9/10 Test Results</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-blue-700">Expected:</div>
                    <div className="text-blue-600">9/10 (90%)</div>
                  </div>
                  <div>
                    <div className="font-medium text-blue-700">Backend %:</div>
                    <div className={`${data.afterUpdate.calculationCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {data.afterUpdate.progress_percentage}%
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-blue-700">Current Value:</div>
                    <div className="text-blue-600">{data.afterUpdate.current_value}/{data.afterUpdate.target_value}</div>
                  </div>
                  <div>
                    <div className="font-medium text-blue-700">Calendar Display:</div>
                    <div className={`${data.calendarDisplay.foundInCalendar ? 'text-green-600' : 'text-red-600'}`}>
                      {data.calendarDisplay.foundInCalendar ? 'Found' : 'Not Found'}
                    </div>
                  </div>
                </div>
              </div>
              
              {data.calendarDisplay.goalActivities && data.calendarDisplay.goalActivities.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">📅 Calendar Activities</h4>
                  {data.calendarDisplay.goalActivities.map((activity: any, index: number) => (
                    <div key={index} className="text-sm text-gray-700 mb-1">
                      {activity.activityType}: {activity.notes}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }
        break;

      case 'TEST_PROGRESS_DISPLAY':
        if (data && data.testCases) {
          return (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">📊 Progress Display Test Results</h4>
                <div className="text-sm text-green-700">
                  {data.summary.correct}/{data.summary.total} tests passed 
                  ({data.summary.allCorrect ? '✅ All Correct' : '❌ Issues Found'})
                </div>
              </div>
              
              <div className="space-y-3">
                {data.testCases.map((testCase: any, index: number) => (
                  <div key={index} className={`p-3 rounded-lg ${testCase.verification.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{testCase.testCase.name}</span>
                      <span className={`text-sm ${testCase.verification.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {testCase.verification.isCorrect ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 mt-1">
                      Display: {testCase.verification.displayString}
                    </div>
                    <div className="text-sm text-gray-600">
                      Expected: {testCase.testCase.expected}% | Actual: {testCase.verification.actualPercentage}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        break;

      default:
        // For other responses, show minimal JSON without timestamps
        const cleanData = { ...data };
        if (cleanData.timestamp) delete cleanData.timestamp;
        if (cleanData.currentDateTime) delete cleanData.currentDateTime;
        if (cleanData.systemTime) delete cleanData.systemTime;
        
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(cleanData, null, 2)}
            </pre>
          </div>
        );
    }

    // Fallback to JSON display
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
        <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">🐛 Goal Tracking Debugger</h1>
        
        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Test Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Test Goal ID</label>
              <input
                type="text"
                value={testGoalId}
                onChange={(e) => setTestGoalId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter goal ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Test Progress Value</label>
              <input
                type="number"
                value={testProgress}
                onChange={(e) => setTestProgress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter progress value"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Test Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <button
              onClick={testCreateCounterGoal}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              🎯 Create Counter Goal
            </button>
            
            <button
              onClick={testUpdateGoalProgress}
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              📊 Update Progress
            </button>
            
            <button
              onClick={testGetAllGoals}
              disabled={isLoading}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              📋 Get All Goals
            </button>
            
            <button
              onClick={testGetGoalsForDate}
              disabled={isLoading}
              className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              📅 Get Goals for Date
            </button>
            
            <button
              onClick={testGetGoalsWithDailyProgress}
              disabled={isLoading}
              className="bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              📈 Get Goals with Progress
            </button>
            
            <button
              onClick={testGetCalendarEntries}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              🗓️ Get Calendar Entries
            </button>
            
            <button
              onClick={testTimeService}
              disabled={isLoading}
              className="bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              ⏰ Test Time Service
            </button>
            
            <button
              onClick={testDateRangeAlignment}
              disabled={isLoading}
              className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              🔍 Test Date Alignment
            </button>
            
            <button
              onClick={testNineOfTenScenario}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              🎯 Test "9/10" Counter Goal Issue
            </button>
            
            <button
              onClick={testProgressDisplayIssue}
              disabled={isLoading}
              className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              🔢 Test Progress Display
            </button>
          </div>
        </div>
        
        {/* Time Service Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Time Service Controls</h2>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={resetMockDate}
              disabled={isLoading}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              🔄 Reset Mock Date (Use Real Time)
            </button>
            
            <button
              onClick={setTodayAsMockDate}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              📅 Set Today as Mock Date
            </button>
          </div>
        </div>
        
        {/* Cache Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Cache Controls</h2>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={clearCache}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              🗑️ Clear Calendar Cache
            </button>
            
            <button
              onClick={clearResponses}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              🧹 Clear Responses
            </button>
          </div>
        </div>
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
              <span className="text-blue-700 font-medium">Running test...</span>
            </div>
          </div>
        )}
        
        {/* Responses */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Debug Responses</h2>
          
          <div className="space-y-4">
            {responses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No responses yet. Run a test to see results.</p>
            ) : (
              responses.map((response, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-800">{response.action}</h3>
                    <span className="text-xs text-gray-500">{new Date(response.timestamp).toLocaleDateString()}</span>
                  </div>
                  
                  {renderResponseData(response)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 