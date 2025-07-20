import { useState, useEffect, useCallback, useMemo } from 'react';
import { timeService } from '@/services/timeService';

export interface MonthlyScore {
  score: number;
  tier: 1 | 2 | 3;
  breakdown: {
    baseEngagement: number;
    qualityMultipliers: number;
    consistencyBonuses: number;
    excellenceBonuses: number;
  };
  requirements: {
    appDays: number;
    pomodoroHours: number;
    meditationSessions: number;
    journalEntries: number;
    habitCompletionRate: number;
    goalCompletions: number;
  };
  month: string;
  userId?: string;
}

export interface MonthlyMetrics {
  activeDays: number;
  pomodoroSessions: number;
  totalFocusTime: number;
  meditationSessions: number;
  breathingExercises: number;
  journalEntries: number;
  gratitudeEntries: number;
  completedGoals: number;
  habitCompletions: number;
  totalHabits: number;
  moodEntries: number;
  tasks?: number;
  studySessions?: number;
  focusTime?: number;
}

interface UseMonthlyProductivityState {
  currentScore: MonthlyScore | null;
  metrics: MonthlyMetrics | null;
  loading: boolean;
  error: string | null;
}

interface UseMonthlyProductivityReturn extends UseMonthlyProductivityState {
  refreshCurrentMonth: () => Promise<void>;
  getCurrentMonthId: () => string;
}

export function useMonthlyProductivity(): UseMonthlyProductivityReturn {
  const [state, setState] = useState<UseMonthlyProductivityState>({
    currentScore: null,
    metrics: null,
    loading: true,
    error: null
  });

  const getCurrentMonthId = useCallback(() => {
    const date = new Date(timeService.getCurrentDate());
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Create a mock score calculator for now
  const calculateMockScore = useCallback((metrics: MonthlyMetrics): MonthlyScore => {
    // Base engagement calculation (0-50 points)
    const engagementRate = (metrics.activeDays || 0) / 30;
    let baseEngagement = 0;
    
    if (engagementRate >= 0.5) baseEngagement += 20;
    if (engagementRate >= 0.7) baseEngagement += 15;
    if (engagementRate >= 0.85) baseEngagement += 10;
    
    if (metrics.pomodoroSessions > 0) baseEngagement += 5;
    if (metrics.totalFocusTime >= 5) baseEngagement += 10;
    if (metrics.journalEntries > 0) baseEngagement += 5;
    if (metrics.moodEntries > 0) baseEngagement += 5;

    // Quality multipliers (placeholder - 0 for now)
    const qualityMultipliers = 0;

    // Consistency bonuses (0-15 points)
    let consistencyBonuses = 0;
    const habitRate = metrics.totalHabits > 0 ? metrics.habitCompletions / metrics.totalHabits : 0;
    
    if (habitRate >= 0.8) consistencyBonuses += 8;
    else if (habitRate >= 0.6) consistencyBonuses += 5;
    else if (habitRate >= 0.4) consistencyBonuses += 2;
    
    if (metrics.journalEntries >= 15) consistencyBonuses += 4;
    else if (metrics.journalEntries >= 9) consistencyBonuses += 2;
    
    if (metrics.meditationSessions >= 12) consistencyBonuses += 3;
    else if (metrics.meditationSessions >= 8) consistencyBonuses += 1;

    // Excellence bonuses (0-10 points)
    let excellenceBonuses = 0;
    
    if (metrics.totalHabits >= 3 && habitRate >= 0.85) excellenceBonuses += 3;
    if (metrics.totalFocusTime >= 15) excellenceBonuses += 3;
    if (metrics.journalEntries >= 20) excellenceBonuses += 2;
    if (metrics.meditationSessions >= 16) excellenceBonuses += 2;

    const totalScore = Math.min(100, baseEngagement + qualityMultipliers + consistencyBonuses + excellenceBonuses);
    const tier = totalScore >= 80 ? 3 : totalScore >= 50 ? 2 : 1;

    return {
      score: totalScore,
      tier: tier as 1 | 2 | 3,
      breakdown: {
        baseEngagement,
        qualityMultipliers,
        consistencyBonuses,
        excellenceBonuses
      },
      requirements: {
        appDays: metrics.activeDays,
        pomodoroHours: metrics.totalFocusTime,
        meditationSessions: metrics.meditationSessions,
        journalEntries: metrics.journalEntries,
        habitCompletionRate: habitRate,
        goalCompletions: metrics.completedGoals
      },
      month: getCurrentMonthId(),
      userId: undefined
    };
  }, [getCurrentMonthId]);

  // Mock metrics gathering
  const gatherMockMetrics = useCallback(async (): Promise<MonthlyMetrics> => {
    // This would normally gather data from all services
    // For now, return basic metrics that can be populated by the debug tools
    return {
      activeDays: 0,
      pomodoroSessions: 0,
      totalFocusTime: 0,
      meditationSessions: 0,
      breathingExercises: 0,
      journalEntries: 0,
      gratitudeEntries: 0,
      completedGoals: 0,
      habitCompletions: 0,
      totalHabits: 0,
      moodEntries: 0,
      tasks: 0,
      studySessions: 0,
      focusTime: 0
    };
  }, []);

  const loadMonthlyData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('📊 Loading monthly productivity data...');

      // Gather metrics from all sources
      const metrics = await gatherMockMetrics();
      
      // Calculate score
      const currentScore = calculateMockScore(metrics);
      
      setState({
        currentScore,
        metrics,
        loading: false,
        error: null
      });

      console.log('✅ Monthly productivity data loaded:', { score: currentScore.score, tier: currentScore.tier });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load monthly productivity data';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      console.error('❌ Failed to load monthly productivity data:', error);
    }
  }, [gatherMockMetrics, calculateMockScore]);

  const refreshCurrentMonth = useCallback(async () => {
    await loadMonthlyData();
  }, [loadMonthlyData]);

  useEffect(() => {
    loadMonthlyData();
  }, [loadMonthlyData]);

  return {
    ...state,
    refreshCurrentMonth,
    getCurrentMonthId
  };
} 