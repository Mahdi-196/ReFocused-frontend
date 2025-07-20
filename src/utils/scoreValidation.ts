import { MonthlyScore, MonthlyMetrics } from '@/types/monthlyProductivity';
import { QualityMetric } from '@/types/qualityMetrics';
import { ActivityLogEntry } from '@/types/activityLogging';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ScoreValidator {
  static validateMonthlyScore(score: MonthlyScore): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (score.score < 0 || score.score > 100) {
      errors.push('Score must be between 0 and 100');
    }

    if (!['TIER_1', 'TIER_2', 'TIER_3'].includes(score.tier)) {
      errors.push('Tier must be TIER_1, TIER_2, or TIER_3');
    }

    if (!score.month || typeof score.month !== 'string') {
      errors.push('Month identifier is required');
    }

    if (!this.isValidMonthFormat(score.month)) {
      errors.push('Month must be in YYYY-MM format');
    }

    const breakdownSum = 
      score.breakdown.baseEngagement +
      score.breakdown.qualityMultipliers +
      score.breakdown.consistencyBonuses +
      score.breakdown.excellenceBonuses;

    if (Math.abs(breakdownSum - score.score) > 0.01) {
      errors.push('Score breakdown does not match total score');
    }

    if (score.breakdown.baseEngagement < 0 || score.breakdown.baseEngagement > 50) {
      warnings.push('Base engagement score seems unusual (expected 0-50)');
    }

    if (score.breakdown.qualityMultipliers < 0 || score.breakdown.qualityMultipliers > 25) {
      warnings.push('Quality multipliers seem unusual (expected 0-25)');
    }

    if (score.breakdown.consistencyBonuses < 0 || score.breakdown.consistencyBonuses > 15) {
      warnings.push('Consistency bonuses seem unusual (expected 0-15)');
    }

    if (score.breakdown.excellenceBonuses < 0 || score.breakdown.excellenceBonuses > 10) {
      warnings.push('Excellence bonuses seem unusual (expected 0-10)');
    }

    const expectedTier = this.calculateExpectedTier(score.score);
    const tierMapping = { 1: 'TIER_1', 2: 'TIER_2', 3: 'TIER_3' };
    const expectedTierString = tierMapping[expectedTier];
    if (score.tier !== expectedTierString) {
      errors.push(`Score ${score.score} should be in tier ${expectedTierString}, not tier ${score.tier}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateMonthlyMetrics(metrics: MonthlyMetrics): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (metrics.activeDays < 0 || metrics.activeDays > 31) {
      errors.push('Active days must be between 0 and 31');
    }

    if (metrics.totalFocusTime < 0) {
      errors.push('Total focus time cannot be negative');
    }

    if (metrics.pomodoroSessions < 0) {
      errors.push('Pomodoro sessions cannot be negative');
    }

    if (metrics.meditationSessions < 0) {
      errors.push('Meditation sessions cannot be negative');
    }

    if (metrics.breathingExercises < 0) {
      errors.push('Breathing exercises cannot be negative');
    }

    if (metrics.journalEntries < 0) {
      errors.push('Journal entries cannot be negative');
    }

    if (metrics.gratitudeEntries < 0) {
      errors.push('Gratitude entries cannot be negative');
    }

    if (metrics.completedGoals < 0) {
      errors.push('Completed goals cannot be negative');
    }

    if (metrics.habitCompletions < 0) {
      errors.push('Habit completions cannot be negative');
    }

    if (metrics.totalHabits < 0) {
      errors.push('Total habits cannot be negative');
    }

    if (metrics.moodEntries < 0) {
      errors.push('Mood entries cannot be negative');
    }

    if (metrics.habitCompletions > metrics.totalHabits) {
      errors.push('Habit completions cannot exceed total habits');
    }

    if (metrics.pomodoroSessions > 0 && metrics.totalFocusTime === 0) {
      warnings.push('Pomodoro sessions recorded but no focus time');
    }

    if (metrics.totalFocusTime > metrics.pomodoroSessions * 2) {
      warnings.push('Focus time seems high relative to pomodoro sessions');
    }

    if (metrics.activeDays > 25 && metrics.pomodoroSessions === 0) {
      warnings.push('High activity days but no pomodoro sessions');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateQualityMetrics(metrics: QualityMetric[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(metrics)) {
      errors.push('Quality metrics must be an array');
      return { isValid: false, errors, warnings };
    }

    metrics.forEach((metric, index) => {
      if (!metric.activityType) {
        errors.push(`Quality metric ${index}: Activity type is required`);
      }

      if (metric.qualityScore < 1 || metric.qualityScore > 10) {
        errors.push(`Quality metric ${index}: Quality score must be between 1 and 10`);
      }

      if (metric.date && !(metric.date instanceof Date)) {
        errors.push(`Quality metric ${index}: Date must be a Date object`);
      }
    });

    const totalMetrics = metrics.length;
    const avgQuality = totalMetrics > 0 ? 
      metrics.reduce((sum, m) => sum + m.qualityScore, 0) / totalMetrics : 0;

    if (avgQuality < 3) {
      warnings.push('Average quality score is quite low (< 3)');
    }

    if (avgQuality > 9) {
      warnings.push('Average quality score is unusually high (> 9)');
    }

    const uniqueTypes = new Set(metrics.map(m => m.activityType));
    if (uniqueTypes.size < 2 && totalMetrics > 10) {
      warnings.push('Quality metrics cover only one activity type');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateActivityLogs(logs: ActivityLogEntry[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(logs)) {
      errors.push('Activity logs must be an array');
      return { isValid: false, errors, warnings };
    }

    logs.forEach((log, index) => {
      if (!log.activityType) {
        errors.push(`Activity log ${index}: Activity type is required`);
      }

      if (!log.timestamp || !(log.timestamp instanceof Date)) {
        errors.push(`Activity log ${index}: Valid timestamp is required`);
      }

      if (log.quality !== undefined && (log.quality < 1 || log.quality > 10)) {
        errors.push(`Activity log ${index}: Quality must be between 1 and 10`);
      }

      if (log.duration !== undefined && log.duration < 0) {
        errors.push(`Activity log ${index}: Duration cannot be negative`);
      }
    });

    if (logs.length > 100) {
      warnings.push('Very high number of activity logs (100+)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateScoreConsistency(
    score: MonthlyScore,
    metrics: MonthlyMetrics,
    qualityMetrics: QualityMetric[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (score.requirements.appDays !== metrics.activeDays) {
      errors.push('Score requirements active days do not match metrics');
    }

    if (Math.abs(score.requirements.pomodoroHours - metrics.totalFocusTime) > 0.1) {
      errors.push('Score requirements focus time do not match metrics');
    }

    if (score.requirements.meditationSessions !== metrics.meditationSessions) {
      errors.push('Score requirements meditation sessions do not match metrics');
    }

    if (score.requirements.journalEntries !== metrics.journalEntries) {
      errors.push('Score requirements journal entries do not match metrics');
    }

    if (score.requirements.goalCompletions !== metrics.completedGoals) {
      errors.push('Score requirements goal completions do not match metrics');
    }

    const expectedHabitRate = metrics.totalHabits > 0 ? 
      metrics.habitCompletions / metrics.totalHabits : 0;
    if (Math.abs(score.requirements.habitCompletionRate - expectedHabitRate) > 0.01) {
      errors.push('Score requirements habit completion rate do not match metrics');
    }

    if (score.score > 90 && metrics.activeDays < 20) {
      warnings.push('Very high score with low activity days');
    }

    if (score.score < 20 && metrics.activeDays > 25) {
      warnings.push('Very low score with high activity days');
    }

    const avgQuality = qualityMetrics.length > 0 ? 
      qualityMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / qualityMetrics.length : 0;

    if (score.breakdown.qualityMultipliers > 15 && avgQuality < 6) {
      warnings.push('High quality multipliers with low average quality');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static isValidMonthFormat(month: string): boolean {
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) return false;

    const [year, monthNum] = month.split('-').map(Number);
    return year >= 2020 && year <= 2030 && monthNum >= 1 && monthNum <= 12;
  }

  private static calculateExpectedTier(score: number): 1 | 2 | 3 {
    if (score >= 80) return 3;
    if (score >= 50) return 2;
    return 1;
  }

  static createValidationReport(
    score: MonthlyScore,
    metrics: MonthlyMetrics,
    qualityMetrics: QualityMetric[],
    activityLogs: ActivityLogEntry[]
  ): ValidationResult {
    const scoreValidation = this.validateMonthlyScore(score);
    const metricsValidation = this.validateMonthlyMetrics(metrics);
    const qualityValidation = this.validateQualityMetrics(qualityMetrics);
    const logsValidation = this.validateActivityLogs(activityLogs);
    const consistencyValidation = this.validateScoreConsistency(score, metrics, qualityMetrics);

    const allErrors = [
      ...scoreValidation.errors,
      ...metricsValidation.errors,
      ...qualityValidation.errors,
      ...logsValidation.errors,
      ...consistencyValidation.errors
    ];

    const allWarnings = [
      ...scoreValidation.warnings,
      ...metricsValidation.warnings,
      ...qualityValidation.warnings,
      ...logsValidation.warnings,
      ...consistencyValidation.warnings
    ];

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }
}