import { 
  MonthlyScore, 
  MonthlyMetrics, 
  MonthlyAnalytics,
  ScoreHistory,
  formatMonthId
} from '@/types/monthlyProductivity';
import { QualityMetric } from '@/types/qualityMetrics';
import { ActivityLogEntry } from '@/types/activityLogging';
import { MonthlyScoreCalculator } from '@/utils/monthlyCalculations';
import { DateHelpers } from '@/utils/dateHelpers';
import { activityLogger } from '@/services/logging/activityLogger';
import { qualityMetricsLogger } from '@/services/logging/qualityMetricsLogger';
import { scoreCalculationLogger } from '@/services/logging/scoreCalculationLogger';
import { cacheService } from '@/services/cacheService';
import { monthlyProductivityCache } from '@/services/caching/monthlyProductivityCache';
import { timeService } from '@/services/timeService';
import { statisticsService } from '@/services/statisticsService';
import { goalsService } from '@/services/goalsService';
import { getHabits, getHabitCompletions } from '@/services/habitsService';
import { getMoodEntries } from '@/services/moodService';
import journalService from '@/api/services/journalService';
import { logger } from '@/utils/logger';
import { ScoreValidator } from '@/utils/scoreValidation';

export class MonthlyProductivityService {
  private static instance: MonthlyProductivityService;
  private scoreCache: Map<string, MonthlyScore> = new Map();
  private metricsCache: Map<string, MonthlyMetrics> = new Map();

  private constructor() {}

  static getInstance(): MonthlyProductivityService {
    if (!MonthlyProductivityService.instance) {
      MonthlyProductivityService.instance = new MonthlyProductivityService();
    }
    return MonthlyProductivityService.instance;
  }

  async calculateMonthlyScore(
    monthId: string,
    userId?: string,
    forceRecalculate: boolean = false
  ): Promise<MonthlyScore> {
    if (!forceRecalculate) {
      const cachedScore = await monthlyProductivityCache.getCachedMonthlyScore(monthId, userId);
      if (cachedScore) {
        return cachedScore;
      }
    }

    try {
      const startTime = performance.now();
      
      logger.info(`Calculating monthly score for ${monthId}`, { userId, forceRecalculate }, 'MONTHLY_PRODUCTIVITY_SERVICE');

      const metrics = await this.gatherMonthlyMetrics(monthId, userId);
      const qualityMetrics = await this.gatherQualityMetrics(monthId, userId);
      
      const calculationSteps = [];
      
      const baseEngagementStep = await scoreCalculationLogger.logBaseEngagementCalculation(
        metrics.activeDays,
        DateHelpers.getMonthInfo(DateHelpers.parseMonthId(monthId).year, DateHelpers.parseMonthId(monthId).month).daysInMonth,
        metrics.pomodoroSessions,
        metrics.totalFocusTime,
        metrics.journalEntries,
        metrics.moodEntries,
        this.calculateBaseEngagement(metrics)
      );
      calculationSteps.push(baseEngagementStep);

      const qualityMultiplierStep = await scoreCalculationLogger.logQualityMultiplierCalculation(
        qualityMetrics,
        this.calculateQualityWeights(qualityMetrics),
        this.calculateQualityMultipliers(qualityMetrics)
      );
      calculationSteps.push(qualityMultiplierStep);

      const consistencyStep = await scoreCalculationLogger.logConsistencyBonusCalculation(
        metrics.habitCompletions,
        metrics.totalHabits,
        metrics.journalEntries,
        metrics.meditationSessions,
        this.calculateConsistencyBonuses(metrics)
      );
      calculationSteps.push(consistencyStep);

      const excellenceStep = await scoreCalculationLogger.logExcellenceBonusCalculation(
        this.checkPerfectRequirements(metrics),
        this.calculateExcellenceBonuses(metrics)
      );
      calculationSteps.push(excellenceStep);

      const monthlyScore = MonthlyScoreCalculator.calculateMonthlyScore(
        metrics,
        qualityMetrics,
        monthId,
        userId
      );

      const finalStep = await scoreCalculationLogger.logFinalScoreCalculation(
        monthlyScore.breakdown,
        monthlyScore.score,
        monthlyScore.tier
      );
      calculationSteps.push(finalStep);

      const validation = ScoreValidator.validateMonthlyScore(monthlyScore);
      if (!validation.isValid) {
        throw new Error(`Score validation failed: ${validation.errors.join(', ')}`);
      }

      const processingTime = performance.now() - startTime;
      
      await scoreCalculationLogger.logScoreCalculation(
        monthId,
        metrics,
        qualityMetrics,
        monthlyScore,
        calculationSteps,
        processingTime,
        userId
      );

      await monthlyProductivityCache.cacheMonthlyScore(monthId, monthlyScore, userId);

      logger.info(`Monthly score calculated: ${monthlyScore.score} (Tier ${monthlyScore.tier})`, {
        monthId,
        processingTime: `${processingTime.toFixed(2)}ms`
      }, 'MONTHLY_PRODUCTIVITY_SERVICE');

      return monthlyScore;
    } catch (error) {
      logger.error('Failed to calculate monthly score', error, 'MONTHLY_PRODUCTIVITY_SERVICE');
      throw new Error(`Unable to calculate monthly score: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async gatherMonthlyMetrics(
    monthId: string,
    userId?: string
  ): Promise<MonthlyMetrics> {
    const cachedMetrics = await monthlyProductivityCache.getCachedMonthlyMetrics(monthId, userId);
    if (cachedMetrics) {
      return cachedMetrics;
    }

    try {
      const { start, end } = DateHelpers.getMonthRangeFromId(monthId);
      const startString = DateHelpers.formatDateString(start);
      const endString = DateHelpers.formatDateString(end);

      logger.info(`Gathering monthly metrics for ${monthId}`, { startString, endString }, 'MONTHLY_PRODUCTIVITY_SERVICE');

      const [
        statistics,
        goals,
        habits,
        moodEntries,
        journalStats,
        activityLogs
      ] = await Promise.all([
        this.getStatisticsForMonth(startString, endString),
        this.getGoalsForMonth(startString, endString),
        this.getHabitsForMonth(startString, endString),
        this.getMoodEntriesForMonth(startString, endString),
        this.getJournalStatsForMonth(startString, endString),
        this.getActivityLogsForMonth(start, end)
      ]);

      const activeDays = DateHelpers.getActiveDaysInMonth(
        activityLogs.map(log => log.timestamp),
        monthId
      );

      const metrics: MonthlyMetrics = {
        activeDays,
        pomodoroSessions: statistics.sessions || 0,
        totalFocusTime: statistics.focusTime || 0,
        meditationSessions: activityLogs.filter(log => 
          log.activityType === 'meditation' && log.action === 'complete'
        ).length,
        breathingExercises: activityLogs.filter(log => 
          log.activityType === 'breathing' && log.action === 'complete'
        ).length,
        journalEntries: journalStats.totalEntries || 0,
        gratitudeEntries: journalStats.gratitudeEntries || 0,
        completedGoals: goals.filter(goal => goal.completed).length,
        habitCompletions: habits.totalCompletions || 0,
        totalHabits: habits.totalHabits || 0,
        moodEntries: moodEntries.length
      };

      const validation = ScoreValidator.validateMonthlyMetrics(metrics);
      if (!validation.isValid) {
        logger.error('Monthly metrics validation failed', validation.errors, 'MONTHLY_PRODUCTIVITY_SERVICE');
      }

      await monthlyProductivityCache.cacheMonthlyMetrics(monthId, metrics, userId);

      logger.info(`Monthly metrics gathered`, metrics, 'MONTHLY_PRODUCTIVITY_SERVICE');

      return metrics;
    } catch (error) {
      logger.error('Failed to gather monthly metrics', error, 'MONTHLY_PRODUCTIVITY_SERVICE');
      return MonthlyScoreCalculator.createEmptyMetrics();
    }
  }

  async gatherQualityMetrics(
    monthId: string,
    userId?: string
  ): Promise<QualityMetric[]> {
    try {
      const { start, end } = DateHelpers.getMonthRangeFromId(monthId);
      const qualityMetrics = await qualityMetricsLogger.getQualityMetrics(start, end);
      
      logger.info(`Gathered ${qualityMetrics.length} quality metrics for ${monthId}`, {}, 'MONTHLY_PRODUCTIVITY_SERVICE');
      
      return qualityMetrics;
    } catch (error) {
      logger.error('Failed to gather quality metrics', error, 'MONTHLY_PRODUCTIVITY_SERVICE');
      return [];
    }
  }

  async getMonthlyAnalytics(
    monthId: string,
    userId?: string
  ): Promise<MonthlyAnalytics> {
    try {
      const cachedAnalytics = await monthlyProductivityCache.getCachedMonthlyAnalytics(monthId, userId);
      if (cachedAnalytics) {
        return cachedAnalytics;
      }

      const [activityLogs, qualityMetrics] = await Promise.all([
        this.getActivityLogsForMonth(
          DateHelpers.getMonthRangeFromId(monthId).start,
          DateHelpers.getMonthRangeFromId(monthId).end
        ),
        this.gatherQualityMetrics(monthId, userId)
      ]);

      const analytics = this.calculateMonthlyAnalytics(activityLogs, qualityMetrics);
      
      await monthlyProductivityCache.cacheMonthlyAnalytics(monthId, analytics, userId);
      
      return analytics;
    } catch (error) {
      logger.error('Failed to get monthly analytics', error, 'MONTHLY_PRODUCTIVITY_SERVICE');
      return this.createEmptyAnalytics();
    }
  }

  async getScoreHistory(
    monthsBack: number = 12,
    userId?: string
  ): Promise<ScoreHistory[]> {
    try {
      const cachedHistory = await monthlyProductivityCache.getCachedScoreHistory(monthsBack, userId);
      if (cachedHistory) {
        return cachedHistory;
      }

      const currentMonth = DateHelpers.getCurrentMonthInfo();
      const history: ScoreHistory[] = [];
      
      for (let i = 0; i < monthsBack; i++) {
        const targetDate = new Date(currentMonth.year, currentMonth.month - 1 - i, 1);
        const monthId = formatMonthId(targetDate);
        
        try {
          const score = await this.calculateMonthlyScore(monthId, userId);
          history.push({
            month: monthId,
            score: score.score,
            tier: score.tier,
            breakdown: score.breakdown,
            createdAt: new Date()
          });
        } catch (error) {
          logger.error(`Failed to get score for ${monthId}`, error, 'MONTHLY_PRODUCTIVITY_SERVICE');
        }
      }

      const sortedHistory = history.sort((a, b) => a.month.localeCompare(b.month));
      await monthlyProductivityCache.cacheScoreHistory(monthsBack, sortedHistory, userId);
      
      return sortedHistory;
    } catch (error) {
      logger.error('Failed to get score history', error, 'MONTHLY_PRODUCTIVITY_SERVICE');
      return [];
    }
  }

  async getCurrentMonthProgress(userId?: string): Promise<{
    currentScore: MonthlyScore;
    progressToNextTier: {
      nextTier: number;
      progressPercentage: number;
      missingRequirements: string[];
    };
    daysRemaining: number;
  }> {
    try {
      const currentMonthId = MonthlyScoreCalculator.getCurrentMonthId();
      const currentScore = await this.calculateMonthlyScore(currentMonthId, userId);
      const currentMetrics = await this.gatherMonthlyMetrics(currentMonthId, userId);
      
      const progressToNextTier = MonthlyScoreCalculator.calculateProgressToNextTier(
        currentScore,
        currentMetrics
      );

      const monthInfo = DateHelpers.getCurrentMonthInfo();
      const today = new Date();
      const daysRemaining = monthInfo.daysInMonth - today.getDate();

      return {
        currentScore,
        progressToNextTier,
        daysRemaining
      };
    } catch (error) {
      logger.error('Failed to get current month progress', error, 'MONTHLY_PRODUCTIVITY_SERVICE');
      throw error;
    }
  }

  private async getStatisticsForMonth(startDate: string, endDate: string) {
    try {
      return await statisticsService.getStatistics(startDate, endDate);
    } catch (error) {
      logger.error('Failed to get statistics for month', error, 'MONTHLY_PRODUCTIVITY_SERVICE');
      return { focusTime: 0, sessions: 0, tasksDone: 0 };
    }
  }

  private async getGoalsForMonth(startDate: string, endDate: string) {
    try {
      return await goalsService.getGoalsHistory({ 
        startDate, 
        endDate 
      });
    } catch (error) {
      logger.error('Failed to get goals for month', error, 'MONTHLY_PRODUCTIVITY_SERVICE');
      return [];
    }
  }

  private async getHabitsForMonth(startDate: string, endDate: string) {
    try {
      const habits = await getHabits();
      const completions = await getHabitCompletions(startDate, endDate);
      
      // Calculate habit stats from the data
      const totalHabits = habits.length;
      const totalCompletions = completions.filter(c => c.completed).length;
      
      return {
        totalHabits,
        totalCompletions,
        completionRate: totalHabits > 0 ? totalCompletions / totalHabits : 0
      };
    } catch (error) {
      logger.error('Failed to get habits for month', error, 'MONTHLY_PRODUCTIVITY_SERVICE');
      return { totalHabits: 0, totalCompletions: 0, completionRate: 0 };
    }
  }

  private async getMoodEntriesForMonth(startDate: string, endDate: string) {
    try {
      return await getMoodEntries(startDate, endDate);
    } catch (error) {
      logger.error('Failed to get mood entries for month', error, 'MONTHLY_PRODUCTIVITY_SERVICE');
      return [];
    }
  }

  private async getJournalStatsForMonth(startDate: string, endDate: string) {
    try {
      return await journalService.getStatsForPeriod(startDate, endDate);
    } catch (error) {
      logger.error('Failed to get journal stats for month', error, 'MONTHLY_PRODUCTIVITY_SERVICE');
      return { totalEntries: 0, gratitudeEntries: 0, collections: 0 };
    }
  }

  private async getActivityLogsForMonth(startDate: Date, endDate: Date): Promise<ActivityLogEntry[]> {
    try {
      return await activityLogger.getActivityLogs(startDate, endDate);
    } catch (error) {
      logger.error('Failed to get activity logs for month', error, 'MONTHLY_PRODUCTIVITY_SERVICE');
      return [];
    }
  }

  private calculateBaseEngagement(metrics: MonthlyMetrics): number {
    return MonthlyScoreCalculator['calculateBaseEngagement'](metrics);
  }

  private calculateQualityMultipliers(qualityMetrics: QualityMetric[]): number {
    return MonthlyScoreCalculator['calculateQualityMultipliers'](qualityMetrics);
  }

  private calculateQualityWeights(qualityMetrics: QualityMetric[]): Record<string, number> {
    return qualityMetrics.reduce((acc, metric) => {
      if (!acc[metric.activityType]) {
        acc[metric.activityType] = 0;
      }
      acc[metric.activityType] += metric.qualityScore;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateConsistencyBonuses(metrics: MonthlyMetrics): number {
    return MonthlyScoreCalculator['calculateConsistencyBonuses'](metrics);
  }

  private calculateExcellenceBonuses(metrics: MonthlyMetrics): number {
    return MonthlyScoreCalculator['calculateExcellenceBonuses'](metrics);
  }

  private checkPerfectRequirements(metrics: MonthlyMetrics): Record<string, boolean> {
    return {
      habits: metrics.totalHabits >= 3 && (metrics.habitCompletions / metrics.totalHabits) >= 0.85,
      pomodoro: metrics.totalFocusTime >= 15,
      journal: metrics.journalEntries >= 10,
      meditation: metrics.meditationSessions >= 4
    };
  }

  private calculateMonthlyAnalytics(
    activityLogs: ActivityLogEntry[],
    qualityMetrics: QualityMetric[]
  ): MonthlyAnalytics {
    const totalActivities = activityLogs.length;
    const averageQuality = qualityMetrics.length > 0 ? 
      qualityMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / qualityMetrics.length : 0;

    const activityCounts = activityLogs.reduce((acc, log) => {
      acc[log.activityType] = (acc[log.activityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topActivities = Object.entries(activityCounts)
      .map(([type, count]) => ({
        type: type as any,
        count,
        averageQuality: qualityMetrics
          .filter(m => m.activityType === type)
          .reduce((sum, m) => sum + m.qualityScore, 0) / 
          qualityMetrics.filter(m => m.activityType === type).length || 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const weeklyBreakdown = this.calculateWeeklyBreakdown(activityLogs, qualityMetrics);

    return {
      totalActivities,
      averageQuality,
      engagementPattern: this.calculateEngagementPattern(activityLogs),
      topActivities,
      weeklyBreakdown
    };
  }

  private calculateEngagementPattern(activityLogs: ActivityLogEntry[]): any {
    const activeDays = new Set(activityLogs.map(log => 
      DateHelpers.formatDateString(log.timestamp)
    )).size;

    return {
      dailyEngagementScore: activeDays * 3.33,
      weeklyTrend: 0,
      monthlyTrend: 0,
      streakDays: DateHelpers.getActivityStreakDays(activityLogs.map(log => log.timestamp)),
      qualityScore: 0,
      consistencyScore: 0
    };
  }

  private calculateWeeklyBreakdown(
    activityLogs: ActivityLogEntry[],
    qualityMetrics: QualityMetric[]
  ): Array<{ week: number; activities: number; quality: number; score: number }> {
    const weeks: Array<{ week: number; activities: number; quality: number; score: number }> = [];
    
    for (let week = 1; week <= 5; week++) {
      const weekActivities = activityLogs.filter(log => {
        const weekOfMonth = Math.ceil(log.timestamp.getDate() / 7);
        return weekOfMonth === week;
      });

      const weekQuality = qualityMetrics.filter(metric => {
        const weekOfMonth = Math.ceil(metric.timestamp.getDate() / 7);
        return weekOfMonth === week;
      });

      const averageQuality = weekQuality.length > 0 ? 
        weekQuality.reduce((sum, m) => sum + m.qualityScore, 0) / weekQuality.length : 0;

      weeks.push({
        week,
        activities: weekActivities.length,
        quality: averageQuality,
        score: weekActivities.length * 2 + averageQuality
      });
    }

    return weeks;
  }

  private createEmptyAnalytics(): MonthlyAnalytics {
    return {
      totalActivities: 0,
      averageQuality: 0,
      engagementPattern: {
        dailyEngagementScore: 0,
        weeklyTrend: 0,
        monthlyTrend: 0,
        streakDays: 0,
        qualityScore: 0,
        consistencyScore: 0
      },
      topActivities: [],
      weeklyBreakdown: []
    };
  }

  async clearCache(): Promise<void> {
    await monthlyProductivityCache.clearAllCache();
    logger.info('Monthly productivity cache cleared', {}, 'MONTHLY_PRODUCTIVITY_SERVICE');
  }

  async refreshMonthlyData(monthId: string, userId?: string): Promise<void> {
    await monthlyProductivityCache.invalidateMonthData(monthId, userId);
    await this.calculateMonthlyScore(monthId, userId, true);
    logger.info(`Monthly data refreshed for ${monthId}`, { userId }, 'MONTHLY_PRODUCTIVITY_SERVICE');
  }
}

export const monthlyProductivityService = MonthlyProductivityService.getInstance();