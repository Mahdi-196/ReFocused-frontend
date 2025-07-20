import { MonthlyMetrics } from '@/types/monthlyProductivity';
import { ActivityLogEntry } from '@/types/activityLogging';
import { QualityMetric } from '@/types/qualityMetrics';
import { activityLogger } from '@/services/logging/activityLogger';
import { qualityMetricsLogger } from '@/services/logging/qualityMetricsLogger';
import { statisticsService } from '@/services/statisticsService';
import { getHabits, getHabitCompletions } from '@/services/habitsService';
import { goalsService } from '@/services/goalsService';

import journalService from '@/api/services/journalService';
import { DateHelpers } from '@/utils/dateHelpers';
import { logger } from '@/utils/logger';

export interface ServiceIntegrationConfig {
  enableAutoLogging: boolean;
  enableQualityTracking: boolean;
  enableEventDispatching: boolean;
  logLevel: 'minimal' | 'standard' | 'detailed';
}

export class ServiceIntegration {
  private static instance: ServiceIntegration;
  private config: ServiceIntegrationConfig;
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor() {
    this.config = this.loadConfig();
    this.setupEventListeners();
  }

  static getInstance(): ServiceIntegration {
    if (!ServiceIntegration.instance) {
      ServiceIntegration.instance = new ServiceIntegration();
    }
    return ServiceIntegration.instance;
  }

  async integrateWithHabitsService(): Promise<void> {
    try {
      logger.info('Integrating with habits service', {}, 'SERVICE_INTEGRATION');
      
      this.interceptHabitCompletion();
      this.interceptHabitCreation();
      this.interceptHabitUpdate();
      
      logger.info('Habits service integration completed', {}, 'SERVICE_INTEGRATION');
    } catch (error) {
      logger.error('Failed to integrate with habits service', error, 'SERVICE_INTEGRATION');
    }
  }

  async integrateWithGoalsService(): Promise<void> {
    try {
      logger.info('Integrating with goals service', {}, 'SERVICE_INTEGRATION');
      
      this.interceptGoalCompletion();
      this.interceptGoalCreation();
      this.interceptGoalUpdate();
      
      logger.info('Goals service integration completed', {}, 'SERVICE_INTEGRATION');
    } catch (error) {
      logger.error('Failed to integrate with goals service', error, 'SERVICE_INTEGRATION');
    }
  }

  async integrateWithJournalService(): Promise<void> {
    try {
      logger.info('Integrating with journal service', {}, 'SERVICE_INTEGRATION');
      
      this.interceptJournalEntryCreation();
      this.interceptJournalEntryUpdate();
      
      logger.info('Journal service integration completed', {}, 'SERVICE_INTEGRATION');
    } catch (error) {
      logger.error('Failed to integrate with journal service', error, 'SERVICE_INTEGRATION');
    }
  }

  async integrateWithMoodService(): Promise<void> {
    try {
      logger.info('Integrating with mood service', {}, 'SERVICE_INTEGRATION');
      
      this.interceptMoodEntry();
      
      logger.info('Mood service integration completed', {}, 'SERVICE_INTEGRATION');
    } catch (error) {
      logger.error('Failed to integrate with mood service', error, 'SERVICE_INTEGRATION');
    }
  }

  async integrateWithStatisticsService(): Promise<void> {
    try {
      logger.info('Integrating with statistics service', {}, 'SERVICE_INTEGRATION');
      
      this.interceptPomodoroSession();
      this.interceptFocusTime();
      this.interceptTaskCompletion();
      
      logger.info('Statistics service integration completed', {}, 'SERVICE_INTEGRATION');
    } catch (error) {
      logger.error('Failed to integrate with statistics service', error, 'SERVICE_INTEGRATION');
    }
  }

  async gatherIntegratedMetrics(
    startDate: string,
    endDate: string
  ): Promise<MonthlyMetrics> {
    try {
      logger.info('Gathering integrated metrics', { startDate, endDate }, 'SERVICE_INTEGRATION');
      
      const [
        statistics,
        habits,
        goals,
        moodEntries,
        journalStats,
        activityLogs
      ] = await Promise.all([
        this.getStatisticsMetrics(startDate, endDate),
        this.getHabitsMetrics(startDate, endDate),
        this.getGoalsMetrics(startDate, endDate),
        this.getMoodMetrics(startDate, endDate),
        this.getJournalMetrics(startDate, endDate),
        this.getActivityMetrics(startDate, endDate)
      ]);

      const metrics: MonthlyMetrics = {
        activeDays: activityLogs.uniqueDays,
        pomodoroSessions: statistics.sessions,
        totalFocusTime: statistics.focusTime,
        meditationSessions: activityLogs.meditationCount,
        breathingExercises: activityLogs.breathingCount,
        journalEntries: journalStats.entries,
        gratitudeEntries: journalStats.gratitudeEntries,
        completedGoals: goals.completedCount,
        habitCompletions: habits.completions,
        totalHabits: habits.totalHabits,
        moodEntries: moodEntries.count
      };

      logger.info('Integrated metrics gathered successfully', metrics, 'SERVICE_INTEGRATION');
      return metrics;
    } catch (error) {
      logger.error('Failed to gather integrated metrics', error, 'SERVICE_INTEGRATION');
      throw error;
    }
  }

  private interceptHabitCompletion(): void {
    const originalCompletion = this.wrapHabitCompletion();
    
    if (typeof window !== 'undefined') {
      window.addEventListener('habitCompleted', async (event: any) => {
        if (!this.config.enableAutoLogging) return;
        
        const { habitId, habitName, streak, completed } = event.detail;
        
        await activityLogger.logHabitActivity(
          completed ? 'complete' : 'cancel',
          {
            habitId: habitId?.toString(),
            habitName,
            streak,
            difficulty: 5
          }
        );

        if (this.config.enableQualityTracking && completed) {
          await qualityMetricsLogger.logQualityMetric(
            'habit',
            Math.min(10, 7 + (streak / 10)),
            1.0
          );
        }

        if (this.config.enableEventDispatching) {
          this.dispatchEvent('monthlyScoreUpdated', { source: 'habit', habitId });
        }
      });
    }
  }

  private interceptHabitCreation(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('habitCreated', async (event: any) => {
        if (!this.config.enableAutoLogging) return;
        
        const { habitId, habitName } = event.detail;
        
        await activityLogger.logHabitActivity('start', {
          habitId: habitId?.toString(),
          habitName,
          streak: 0,
          difficulty: 5
        });
      });
    }
  }

  private interceptHabitUpdate(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('habitUpdated', async (event: any) => {
        if (!this.config.enableAutoLogging) return;
        
        const { habitId, habitName, changes } = event.detail;
        
        await activityLogger.logActivity(
          'habit',
          'pause',
          {
            habitCompletion: {
              habitId: habitId?.toString(),
              habitName,
              streak: 0,
              difficulty: 5
            }
          }
        );
      });
    }
  }

  private interceptGoalCompletion(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('goalCompleted', async (event: any) => {
        if (!this.config.enableAutoLogging) return;
        
        const { goalId, goalName, progress, category } = event.detail;
        
        await activityLogger.logGoalActivity('complete', {
          goalId: goalId?.toString(),
          goalName,
          progress,
          category
        });

        if (this.config.enableQualityTracking) {
          await qualityMetricsLogger.logQualityMetric(
            'goal',
            Math.min(10, 5 + (progress * 5)),
            1.0
          );
        }

        if (this.config.enableEventDispatching) {
          this.dispatchEvent('monthlyScoreUpdated', { source: 'goal', goalId });
        }
      });
    }
  }

  private interceptGoalCreation(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('goalCreated', async (event: any) => {
        if (!this.config.enableAutoLogging) return;
        
        const { goalId, goalName, category } = event.detail;
        
        await activityLogger.logGoalActivity('start', {
          goalId: goalId?.toString(),
          goalName,
          progress: 0,
          category
        });
      });
    }
  }

  private interceptGoalUpdate(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('goalUpdated', async (event: any) => {
        if (!this.config.enableAutoLogging) return;
        
        const { goalId, goalName, progress, category } = event.detail;
        
        await activityLogger.logGoalActivity('pause', {
          goalId: goalId?.toString(),
          goalName,
          progress,
          category
        });
      });
    }
  }

  private interceptJournalEntryCreation(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('journalEntryCreated', async (event: any) => {
        if (!this.config.enableAutoLogging) return;
        
        const { entryId, wordCount, moodBefore, moodAfter, categories } = event.detail;
        
        await activityLogger.logJournalActivity('complete', {
          wordCount,
          moodBefore,
          moodAfter,
          categories
        });

        if (this.config.enableQualityTracking) {
          const quality = Math.min(10, 5 + (wordCount / 200));
          await qualityMetricsLogger.logQualityMetric(
            'journal',
            quality,
            1.0
          );
        }

        if (this.config.enableEventDispatching) {
          this.dispatchEvent('monthlyScoreUpdated', { source: 'journal', entryId });
        }
      });
    }
  }

  private interceptJournalEntryUpdate(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('journalEntryUpdated', async (event: any) => {
        if (!this.config.enableAutoLogging) return;
        
        const { entryId, wordCount, categories } = event.detail;
        
        await activityLogger.logJournalActivity('pause', {
          wordCount,
          categories
        });
      });
    }
  }

  private interceptMoodEntry(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('moodEntryCreated', async (event: any) => {
        if (!this.config.enableAutoLogging) return;
        
        const { moodValue, notes } = event.detail;
        
        await activityLogger.logActivity(
          'journal',
          'complete',
          {
            journalEntry: {
              wordCount: notes?.length || 0,
              moodBefore: moodValue,
              moodAfter: moodValue,
              categories: ['mood']
            }
          }
        );

        if (this.config.enableEventDispatching) {
          this.dispatchEvent('monthlyScoreUpdated', { source: 'mood', moodValue });
        }
      });
    }
  }

  private interceptPomodoroSession(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('pomodoroSessionCompleted', async (event: any) => {
        if (!this.config.enableAutoLogging) return;
        
        const { duration, focusQuality, interruptions } = event.detail;
        
        await activityLogger.logPomodoroActivity('complete', {
          plannedDuration: duration,
          actualDuration: duration,
          interruptions,
          focusQuality
        });

        if (this.config.enableQualityTracking) {
          await qualityMetricsLogger.logQualityMetric(
            'pomodoro',
            focusQuality,
            1.0,
            duration
          );
        }

        if (this.config.enableEventDispatching) {
          this.dispatchEvent('monthlyScoreUpdated', { source: 'pomodoro', duration });
        }
      });
    }
  }

  private interceptFocusTime(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('focusTimeAdded', async (event: any) => {
        if (!this.config.enableAutoLogging) return;
        
        const { minutes, quality } = event.detail;
        
        await activityLogger.logPomodoroActivity('complete', {
          actualDuration: minutes,
          focusQuality: quality || 7
        });
      });
    }
  }

  private interceptTaskCompletion(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('taskCompleted', async (event: any) => {
        if (!this.config.enableAutoLogging) return;
        
        const { taskName, duration, quality } = event.detail;
        
        await activityLogger.logActivity(
          'pomodoro',
          'complete',
          {
            pomodoroSession: {
              plannedDuration: duration || 25,
              actualDuration: duration || 25,
              interruptions: 0,
              focusQuality: quality || 7
            }
          }
        );
      });
    }
  }

  private async getStatisticsMetrics(startDate: string, endDate: string): Promise<{
    focusTime: number;
    sessions: number;
    tasks: number;
  }> {
    try {
      const stats = await statisticsService.getStatistics(startDate, endDate);
      return {
        focusTime: stats.focusTime || 0,
        sessions: stats.sessions || 0,
        tasks: stats.tasksDone || 0
      };
    } catch (error) {
      logger.error('Failed to get statistics metrics', error, 'SERVICE_INTEGRATION');
      return { focusTime: 0, sessions: 0, tasks: 0 };
    }
  }

  private async getHabitsMetrics(startDate: string, endDate: string): Promise<{
    completions: number;
    totalHabits: number;
    completionRate: number;
  }> {
    try {
      const [habits, completions] = await Promise.all([
        getHabits(),
        getHabitCompletions(startDate, endDate)
      ]);

      const completionCount = completions.filter(c => c.completed).length;
      const totalHabits = habits.length;
      const completionRate = totalHabits > 0 ? completionCount / totalHabits : 0;

      return {
        completions: completionCount,
        totalHabits,
        completionRate
      };
    } catch (error) {
      logger.error('Failed to get habits metrics', error, 'SERVICE_INTEGRATION');
      return { completions: 0, totalHabits: 0, completionRate: 0 };
    }
  }

  private async getGoalsMetrics(startDate: string, endDate: string): Promise<{
    completedCount: number;
    totalCount: number;
    completionRate: number;
  }> {
    try {
      const goals = await goalsService.getGoalsHistory({ startDate, endDate });
      const completedCount = goals.filter(g => g.completed).length;
      const totalCount = goals.length;
      const completionRate = totalCount > 0 ? completedCount / totalCount : 0;

      return {
        completedCount,
        totalCount,
        completionRate
      };
    } catch (error) {
      logger.error('Failed to get goals metrics', error, 'SERVICE_INTEGRATION');
      return { completedCount: 0, totalCount: 0, completionRate: 0 };
    }
  }

  private async getMoodMetrics(startDate: string, endDate: string): Promise<{
    count: number;
    averageMood: number;
  }> {
    try {
      const { getMoodEntries } = await import('@/services/moodService');
      const moodEntries = await getMoodEntries(startDate, endDate);
      const count = moodEntries.length;
      const averageMood = count > 0 ? 
        moodEntries.reduce((sum, entry) => sum + entry.mood, 0) / count : 0;

      return {
        count,
        averageMood
      };
    } catch (error) {
      logger.error('Failed to get mood metrics', error, 'SERVICE_INTEGRATION');
      return { count: 0, averageMood: 0 };
    }
  }

  private async getJournalMetrics(startDate: string, endDate: string): Promise<{
    entries: number;
    gratitudeEntries: number;
    averageWordCount: number;
  }> {
    try {
      const stats = await journalService.getStatsForPeriod(startDate, endDate);
      return {
        entries: stats.totalEntries || 0,
        gratitudeEntries: stats.gratitudeEntries || 0,
        averageWordCount: stats.averageWordCount || 0
      };
    } catch (error) {
      logger.error('Failed to get journal metrics', error, 'SERVICE_INTEGRATION');
      return { entries: 0, gratitudeEntries: 0, averageWordCount: 0 };
    }
  }

  private async getActivityMetrics(startDate: string, endDate: string): Promise<{
    uniqueDays: number;
    meditationCount: number;
    breathingCount: number;
    totalActivities: number;
  }> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const logs = await activityLogger.getActivityLogs(start, end);
      
      const uniqueDays = new Set(logs.map(log => 
        DateHelpers.formatDateString(log.timestamp)
      )).size;
      
      const meditationCount = logs.filter(log => 
        log.activityType === 'meditation' && log.action === 'complete'
      ).length;
      
      const breathingCount = logs.filter(log => 
        log.activityType === 'breathing' && log.action === 'complete'
      ).length;

      return {
        uniqueDays,
        meditationCount,
        breathingCount,
        totalActivities: logs.length
      };
    } catch (error) {
      logger.error('Failed to get activity metrics', error, 'SERVICE_INTEGRATION');
      return { uniqueDays: 0, meditationCount: 0, breathingCount: 0, totalActivities: 0 };
    }
  }

  private wrapHabitCompletion(): Function {
    return function(originalFunction: Function) {
      return async function(...args: any[]) {
        const result = await originalFunction.apply(this, args);
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('habitCompleted', {
            detail: { habitId: args[0], completed: args[2] }
          }));
        }
        
        return result;
      };
    };
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    const events = [
      'habitCompleted',
      'habitCreated',
      'habitUpdated',
      'goalCompleted',
      'goalCreated',
      'goalUpdated',
      'journalEntryCreated',
      'journalEntryUpdated',
      'moodEntryCreated',
      'pomodoroSessionCompleted',
      'focusTimeAdded',
      'taskCompleted'
    ];

    events.forEach(eventName => {
      const listeners = this.eventListeners.get(eventName) || [];
      this.eventListeners.set(eventName, listeners);
    });
  }

  private dispatchEvent(eventName: string, detail: any): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
  }

  private loadConfig(): ServiceIntegrationConfig {
    try {
      const stored = localStorage.getItem('service_integration_config');
      if (stored) {
        return { ...this.getDefaultConfig(), ...JSON.parse(stored) };
      }
    } catch (error) {
      logger.error('Failed to load service integration config', error, 'SERVICE_INTEGRATION');
    }
    return this.getDefaultConfig();
  }

  private getDefaultConfig(): ServiceIntegrationConfig {
    return {
      enableAutoLogging: true,
      enableQualityTracking: true,
      enableEventDispatching: true,
      logLevel: 'standard'
    };
  }

  updateConfig(newConfig: Partial<ServiceIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('service_integration_config', JSON.stringify(this.config));
    logger.info('Service integration config updated', this.config, 'SERVICE_INTEGRATION');
  }

  getConfig(): ServiceIntegrationConfig {
    return { ...this.config };
  }

  async initializeIntegrations(): Promise<void> {
    try {
      await Promise.all([
        this.integrateWithHabitsService(),
        this.integrateWithGoalsService(),
        this.integrateWithJournalService(),
        this.integrateWithMoodService(),
        this.integrateWithStatisticsService()
      ]);
      
      logger.info('All service integrations initialized successfully', {}, 'SERVICE_INTEGRATION');
    } catch (error) {
      logger.error('Failed to initialize service integrations', error, 'SERVICE_INTEGRATION');
      throw error;
    }
  }
}

export const serviceIntegration = ServiceIntegration.getInstance();