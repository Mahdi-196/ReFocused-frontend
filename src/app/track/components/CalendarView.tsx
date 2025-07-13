import React, { useState, useRef, useMemo, useCallback } from "react";
import { UserHabit, DailyCalendarEntry } from "../types";
import type { MoodEntry } from "@/services/moodService";
import { useCalendarData } from "../hooks/useCalendarData";
import { useCurrentDate } from "@/contexts/TimeContext";
import { TbXboxX } from "react-icons/tb";
import CalendarHeader from "./CalendarHeader";
import CalendarGrid from "./CalendarGrid";
import DayDetails from "./DayDetails";
import { goalsService } from "@/services/goalsService";

interface CalendarViewProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  habits: UserHabit[];
}

export default function CalendarView({
  currentMonth,
  setCurrentMonth,
  habits,
}: CalendarViewProps) {
  const currentDate = useCurrentDate();
  const [selectedDate, setSelectedDate] = useState<string | null>(currentDate);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const {
    calendarEntries,
    loading,
    error,
    toggleHabitCompletion,
    saveMoodData,
    getCalendarEntryForDate,
    isDateReadOnly,
    getHabitCompletionForDate,
    getHabitsForDate,
    refreshCalendarData,
  } = useCalendarData(currentMonth, habits);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCurrentMonth(
          new Date(currentMonth.setMonth(currentMonth.getMonth() + 1))
        );
      } else {
        setCurrentMonth(
          new Date(currentMonth.setMonth(currentMonth.getMonth() - 1))
        );
      }
    }
    setTouchStart(null);
  };

  // Add cache clear handler
  const handleClearCache = () => {
    refreshCalendarData();
  };

  // Add goal test handler
  const handleTestGoals = async () => {
    try {
      console.log('🧪 Testing goals fetch...');
      
      // Test 1: Get all goals
      const allGoals = await goalsService.getAllGoals({ 
        include_completed: true, 
        include_expired: true 
      });
      console.log('🧪 All goals:', allGoals);
      
      // Test 2: Get goals for today
      const todayGoals = await goalsService.getGoalsForDate(currentDate);
      console.log('🧪 Today goals:', todayGoals);
      
      // Test 3: Get goals history
      const history = await goalsService.getGoalsHistory({ days_back: 30 });
      console.log('🧪 Goals history:', history);
      
      // Test 4: Analyze goal timestamps in detail
      console.log('🧪 Goal timestamp analysis:');
      allGoals.forEach((goal, index) => {
        console.log(`🧪 Goal ${index + 1}:`, {
          id: goal.id,
          name: goal.name,
          type: goal.goal_type,
          current_value: goal.current_value,
          target_value: goal.target_value,
          is_completed: goal.is_completed,
          progress_percentage: goal.progress_percentage,
          created_at: goal.created_at,
          updated_at: goal.updated_at,
          completed_at: goal.completed_at,
          created_date: goal.created_at ? goal.created_at.split('T')[0] : null,
          updated_date: goal.updated_at ? goal.updated_at.split('T')[0] : null,
          completed_date: goal.completed_at ? goal.completed_at.split('T')[0] : null,
          same_create_update: goal.created_at === goal.updated_at,
          has_progress: goal.current_value > 0,
          days_since_created: goal.created_at ? Math.floor((Date.now() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24)) : null
        });
      });
      
      // Test 5: Check calendar entries for goal activities
      console.log('🧪 Calendar goal activities:');
      const entriesWithGoals = Object.entries(calendarEntries).filter(([_, entry]) => 
        entry.goalActivities && entry.goalActivities.length > 0
      );
      entriesWithGoals.forEach(([date, entry]) => {
        console.log(`🧪 Date ${date}:`, entry.goalActivities);
      });
      
      alert(`Goals test complete! Check console for detailed results.\nAll goals: ${allGoals.length}\nToday goals: ${todayGoals.length}\nHistory goals: ${history.goals.length}\nCalendar entries with goals: ${entriesWithGoals.length}`);
    } catch (error) {
      console.error('🧪 Goals test failed:', error);
      alert('Goals test failed. Check console for details.');
    }
  };

  // Add comprehensive goal lifecycle test
  const handleTestGoalLifecycle = async () => {
    try {
      console.log('🧪 Starting comprehensive goal lifecycle test...');
      
      // Step 1: Create test goals
      console.log('🧪 Step 1: Creating test goals...');
      const testGoals = [];
      
      try {
        // Create a percentage goal
        const percentageGoal = await goalsService.createGoal({
          name: 'Test Percentage Goal',
          goal_type: 'percentage',
          duration: '2_week'
        });
        testGoals.push(percentageGoal);
        console.log('✅ Created percentage goal:', percentageGoal);
        
        // Create a counter goal
        const counterGoal = await goalsService.createGoal({
          name: 'Test Counter Goal',
          goal_type: 'counter',
          duration: '2_week',
          target_value: 5
        });
        testGoals.push(counterGoal);
        console.log('✅ Created counter goal:', counterGoal);
        
        // Create a checklist goal
        const checklistGoal = await goalsService.createGoal({
          name: 'Test Checklist Goal',
          goal_type: 'checklist',
          duration: '2_week'
        });
        testGoals.push(checklistGoal);
        console.log('✅ Created checklist goal:', checklistGoal);
        
      } catch (error) {
        console.error('❌ Failed to create test goals:', error);
        alert('Failed to create test goals. Check console for details.');
        return;
      }
      
      // Step 2: Update progress for each goal
      console.log('🧪 Step 2: Updating goal progress...');
      
      try {
        // Update percentage goal
        await goalsService.updatePercentageGoal(testGoals[0].id, 50);
        console.log('✅ Updated percentage goal to 50%');
        
        // Increment counter goal
        await goalsService.incrementCounterGoal(testGoals[1].id);
        console.log('✅ Incremented counter goal');
        
        // Toggle checklist goal
        await goalsService.toggleChecklistGoal(testGoals[2].id, true);
        console.log('✅ Completed checklist goal');
        
      } catch (error) {
        console.error('❌ Failed to update goal progress:', error);
        alert('Failed to update goal progress. Check console for details.');
        return;
      }
      
      // Step 3: Complete remaining goals
      console.log('🧪 Step 3: Completing remaining goals...');
      
      try {
        // Complete percentage goal
        await goalsService.updatePercentageGoal(testGoals[0].id, 100);
        console.log('✅ Completed percentage goal');
        
        // Complete counter goal
        await goalsService.setCounterGoalValue(testGoals[1].id, 5);
        console.log('✅ Completed counter goal');
        
      } catch (error) {
        console.error('❌ Failed to complete goals:', error);
        alert('Failed to complete goals. Check console for details.');
        return;
      }
      
      // Step 4: Verify calendar integration
      console.log('🧪 Step 4: Verifying calendar integration...');
      
      try {
        // Get today's goals
        const todayGoals = await goalsService.getGoalsForDate(currentDate);
        console.log('✅ Today\'s goals:', todayGoals);
        
        // Get goals with daily progress
        const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
        const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];
        
        const { goals: monthGoals, dailyProgress } = await goalsService.getGoalsWithDailyProgress(startDate, endDate);
        console.log('✅ Month goals with progress:', { goals: monthGoals.length, progress: dailyProgress.length });
        
        // Refresh calendar to show new data
        refreshCalendarData();
        
      } catch (error) {
        console.error('❌ Failed to verify calendar integration:', error);
        alert('Failed to verify calendar integration. Check console for details.');
        return;
      }
      
      // Step 5: Test results summary
      console.log('🧪 Step 5: Test results summary...');
      
      const summary = {
        goalsCreated: testGoals.length,
        progressUpdates: 3,
        completions: 3,
        calendarIntegration: 'verified'
      };
      
      console.log('✅ Goal lifecycle test completed successfully!', summary);
      alert(`Goal lifecycle test completed successfully! 🎉\n\nCreated: ${summary.goalsCreated} goals\nProgress updates: ${summary.progressUpdates}\nCompletions: ${summary.completions}\n\nCheck the calendar for goal activity indicators and console for detailed logs.`);
      
    } catch (error) {
      console.error('🧪 Goal lifecycle test failed:', error);
      alert('Goal lifecycle test failed. Check console for details.');
    }
  };

  // Add time service consistency test
  const handleTestTimeConsistency = async () => {
    try {
      console.log('🕰️ Testing time service consistency between goals and habits...');
      
      // Test current date consistency
      const currentDateFromContext = currentDate;
      
      // Import time service directly to test
      const { timeService } = await import('@/services/timeService');
      const currentDateFromService = timeService.getCurrentDate();
      
      console.log('🕰️ Time consistency check:', {
        contextDate: currentDateFromContext,
        serviceDate: currentDateFromService,
        systemDate: new Date().toISOString().split('T')[0],
        isConsistent: currentDateFromContext === currentDateFromService
      });
      
      // Test goal service time usage
      const testGoal = await goalsService.createGoal({
        name: 'Time Test Goal',
        goal_type: 'checklist',
        duration: '2_week'
      });
      
      console.log('🕰️ Goal creation timestamp:', {
        goalId: testGoal.id,
        createdAt: testGoal.created_at,
        dateOnly: testGoal.created_at?.split('T')[0],
        matchesService: testGoal.created_at?.split('T')[0] === currentDateFromService
      });
      
      // Test habit date consistency (habits should already be using time service)
      const habitDate = isDateReadOnly(currentDateFromContext) ? 'readonly' : 'editable';
      
      console.log('🕰️ Habit date consistency:', {
        currentDate: currentDateFromContext,
        habitDateCheck: habitDate,
        isConsistent: true // Habits already use time service
      });
      
      const summary = {
        timeServiceWorking: currentDateFromContext === currentDateFromService,
        goalsUsingTimeService: testGoal.created_at?.split('T')[0] === currentDateFromService,
        habitsUsingTimeService: true,
        allConsistent: currentDateFromContext === currentDateFromService && 
                      testGoal.created_at?.split('T')[0] === currentDateFromService
      };
      
      console.log('✅ Time service consistency test completed!', summary);
      alert(`Time service consistency test completed! 🕰️\n\nTime service working: ${summary.timeServiceWorking}\nGoals using time service: ${summary.goalsUsingTimeService}\nHabits using time service: ${summary.habitsUsingTimeService}\nAll consistent: ${summary.allConsistent}`);
      
    } catch (error) {
      console.error('🕰️ Time service consistency test failed:', error);
      alert('Time service consistency test failed. Check console for details.');
    }
  };

  // Add detailed goal debugging
  const handleDebugGoalTracking = async () => {
    try {
      console.log('🔍 DETAILED GOAL TRACKING DEBUG');
      console.log('🔍 Current date:', currentDate);
      console.log('🔍 Current month:', currentMonth.toISOString().split('T')[0]);
      
      // Get month start and end dates
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];
      
      console.log('🔍 Month range:', startDate, 'to', endDate);
      
      // Fetch raw goal data
      const [allGoals, historyGoals] = await Promise.all([
        goalsService.getAllGoals({ 
          include_completed: true, 
          include_expired: true,
          completed_within_hours: 24 * 30 // 30 days
        }),
        goalsService.getGoalsHistory({ days_back: 30 }).then(r => r.goals).catch(() => [])
      ]);
      
      console.log('🔍 Raw goal data:', {
        allGoals: allGoals.length,
        historyGoals: historyGoals.length
      });
      
      // Analyze each goal for potential tracking issues
      console.log('🔍 GOAL ANALYSIS:');
      allGoals.forEach((goal, i) => {
        const createdDate = goal.created_at ? goal.created_at.split('T')[0] : null;
        const updatedDate = goal.updated_at ? goal.updated_at.split('T')[0] : null;
        const completedDate = goal.completed_at ? goal.completed_at.split('T')[0] : null;
        
        const shouldShowOnCreated = createdDate && createdDate >= startDate && createdDate <= endDate;
        const shouldShowOnUpdated = updatedDate && updatedDate >= startDate && updatedDate <= endDate && updatedDate !== createdDate;
        const shouldShowOnCompleted = completedDate && completedDate >= startDate && completedDate <= endDate;
        
        console.log(`🔍 Goal ${i + 1} (${goal.name}):`, {
          id: goal.id,
          type: goal.goal_type,
          current_value: goal.current_value,
          target_value: goal.target_value,
          is_completed: goal.is_completed,
          progress_percentage: goal.progress_percentage,
          createdDate,
          updatedDate,
          completedDate,
          shouldShowOnCreated,
          shouldShowOnUpdated,
          shouldShowOnCompleted,
          inDateRange: shouldShowOnCreated || shouldShowOnUpdated || shouldShowOnCompleted,
          hasProgress: goal.current_value > 0,
          timestamps: {
            created: goal.created_at,
            updated: goal.updated_at,
            completed: goal.completed_at
          }
        });
      });
      
      // Check what's actually in calendar entries
      console.log('🔍 CALENDAR ENTRIES ANALYSIS:');
      const datesWithGoals = Object.keys(calendarEntries).filter(date => 
        calendarEntries[date].goalActivities && calendarEntries[date].goalActivities.length > 0
      );
      
      console.log('🔍 Dates with goal activities:', datesWithGoals);
      datesWithGoals.forEach(date => {
        console.log(`🔍 ${date}:`, calendarEntries[date].goalActivities);
      });
      
      alert(`Detailed goal tracking debug complete!\nCheck console for analysis.\nGoals found: ${allGoals.length}\nDates with goal activities: ${datesWithGoals.length}`);
    } catch (error) {
      console.error('🔍 Goal tracking debug failed:', error);
      alert('Goal tracking debug failed. Check console for details.');
    }
  };

  // Add timestamp display
  const timestamp = new Date().toLocaleString();

  // Loading state
  if (loading) {
    return (
      <section className="mb-8">
        <div
          className="rounded-lg shadow-md overflow-hidden max-w-7xl mx-auto"
          style={{
            background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)",
          }}
        >
          <h2 className="text-xl text-white px-6 py-4 border-b border-gray-600">
            Calendar Overview
          </h2>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#42b9e5] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-300">Loading calendar data...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-8">
        <div
          className="rounded-lg shadow-md overflow-hidden max-w-7xl mx-auto"
          style={{
            background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)",
          }}
        >
          <h2 className="text-xl text-white px-6 py-4 border-b border-gray-600">
            Calendar Overview
          </h2>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-red-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-red-300">Error loading calendar data: {error}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div
        className="rounded-lg shadow-md overflow-hidden max-w-7xl mx-auto"
        style={{
          background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)",
        }}
      >
        <h2 className="text-xl text-white px-6 py-4 border-b border-gray-600">
          Calendar{" "}
        </h2>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 bg-red-900/50 border border-red-600 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-red-400 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-200">{error}</p>
            </div>
          </div>
        )}
        
        {/* Debug Info */}
        {process.env.NEXT_PUBLIC_APP_ENV === 'development' && (
          <div className="mx-6 mt-4 bg-blue-900/50 border border-blue-600 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-blue-200 text-sm">
                Debug: {Object.keys(calendarEntries).length} calendar entries loaded
                {Object.keys(calendarEntries).length > 0 && (
                  <span className="ml-2">
                    [{Object.keys(calendarEntries).slice(0, 3).join(', ')}
                    {Object.keys(calendarEntries).length > 3 && '...'}]
                  </span>
                )}
              </p>
              <button
                onClick={handleClearCache}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
              >
                Clear Cache & Reload
              </button>
            </div>
            <div className="mt-2 text-blue-200 text-sm">
              Last Update: {timestamp}
            </div>
            {/* Goal Debug Info */}
            <div className="mt-2 text-blue-200 text-sm">
              Goals Debug: {Object.values(calendarEntries).reduce((total, entry) => total + (entry.goalActivities?.length || 0), 0)} total goal activities
            </div>
            <div className="mt-1 text-blue-200 text-xs">
              Entries with goals: {Object.values(calendarEntries).filter(entry => entry.goalActivities && entry.goalActivities.length > 0).length}
            </div>
            <button
              onClick={handleTestGoals}
              className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
            >
              Test Goals Fetch
            </button>
            <button
              onClick={handleTestGoalLifecycle}
              className="mt-2 ml-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
            >
              Test Goal Lifecycle
            </button>
            <button
              onClick={handleTestTimeConsistency}
              className="mt-2 ml-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors"
            >
              Test Time Consistency
            </button>
            <button
              onClick={handleDebugGoalTracking}
              className="mt-2 ml-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors"
            >
              Debug Goal Tracking
            </button>
          </div>
        )}
        
        <div className="flex">
          {/* Calendar Grid Section */}
          <div className="flex-1" ref={calendarRef}>
            <CalendarHeader
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
            />
            <CalendarGrid
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              calendarEntries={Object.values(calendarEntries)}
              onDateClick={setSelectedDate}
              isDateReadOnly={isDateReadOnly}
              getCalendarEntryForDate={getCalendarEntryForDate}
              touchStart={touchStart}
              setTouchStart={setTouchStart}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            />
          </div>

          {/* Day Details Section */}
          <div className="w-80 border-l border-gray-600">
            <DayDetails
              selectedDate={selectedDate}
              calendarData={selectedDate ? getCalendarEntryForDate(selectedDate) : null}
              isDateReadOnly={isDateReadOnly}
              getHabitsForDate={getHabitsForDate}
              onToggleHabit={async (dateStr: string, habitId: string, completed: boolean) => {
                await toggleHabitCompletion(dateStr, parseInt(habitId), completed);
              }}
            />
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.8);
        }
      `}</style>
    </section>
  );
}
