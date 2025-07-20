import { 
  MonthlyScore, 
  MonthlyMetrics, 
  MonthlyRequirements, 
  ScoreBreakdown,
  QUALITY_ACTIVITY_WEIGHTS,
  PERFECT_SCORE_MINIMUMS,
  getScoreTier,
  formatMonthId 
} from '@/types/monthlyProductivity';
import { QualityMetric } from '@/types/qualityMetrics';

export class MonthlyScoreCalculator {
  private static readonly TIER_TARGETS = {
    TIER_1: {
      appDays: 18,
      pomodoroHours: 8,
      meditationSessions: 6,
      journalEntries: 8,
      habitCompletionRate: 0.60,
      goalCompletions: 1
    },
    TIER_2: {
      appDays: 22,
      pomodoroHours: 12,
      meditationSessions: 12,
      journalEntries: 15,
      habitCompletionRate: 0.75,
      goalCompletions: 2
    },
    TIER_3: {
      appDays: 26,
      pomodoroHours: 15,
      meditationSessions: 16,
      journalEntries: 20,
      habitCompletionRate: 0.85,
      goalCompletions: 3
    }
  };

  static calculateMonthlyScore(
    metrics: MonthlyMetrics,
    qualityMetrics: QualityMetric[],
    month: string,
    userId?: string
  ): MonthlyScore {
    
    const breakdown = this.calculateScoreBreakdown(metrics, qualityMetrics);
    const requirements = this.extractRequirements(metrics);
    const totalScore = this.calculateTotalScore(breakdown);
    const tier = getScoreTier(totalScore);

    const result = {
      score: Math.round(totalScore * 100) / 100,
      tier,
      breakdown,
      requirements,
      month,
      userId
    };

    return result;
  }

  private static calculateScoreBreakdown(
    metrics: MonthlyMetrics,
    qualityMetrics: QualityMetric[]
  ): ScoreBreakdown {
    const baseEngagement = this.calculateBaseEngagement(metrics);
    const qualityMultipliers = this.calculateQualityMultipliers(qualityMetrics);
    const consistencyBonuses = this.calculateConsistencyBonuses(metrics);
    const excellenceBonuses = this.calculateExcellenceBonuses(metrics);

    return {
      baseEngagement,
      qualityMultipliers,
      consistencyBonuses,
      excellenceBonuses
    };
  }

  private static calculateBaseEngagement(metrics: MonthlyMetrics): number {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const engagementRate = metrics.activeDays / daysInMonth;
    
    
    let baseScore = 0;
    const scoreBreakdown: string[] = [];
    
    // Engagement rate scoring (max 45 points)
    if (engagementRate >= 0.5) {
      baseScore += 20;
      scoreBreakdown.push('✅ 50%+ engagement: +20 points');
    } else {
      scoreBreakdown.push(`❌ <50% engagement (${Math.round(engagementRate * 100)}%): +0 points`);
    }
    
    if (engagementRate >= 0.7) {
      baseScore += 15;
      scoreBreakdown.push('✅ 70%+ engagement: +15 points');
    } else if (engagementRate >= 0.5) {
      scoreBreakdown.push(`❌ <70% engagement (${Math.round(engagementRate * 100)}%): +0 bonus points`);
    }
    
    if (engagementRate >= 0.85) {
      baseScore += 10;
      scoreBreakdown.push('✅ 85%+ engagement: +10 points');
    } else if (engagementRate >= 0.7) {
      scoreBreakdown.push(`❌ <85% engagement (${Math.round(engagementRate * 100)}%): +0 excellence points`);
    }
    
    // Activity participation scoring (max 25 points)
    if (metrics.pomodoroSessions > 0) {
      baseScore += 5;
      scoreBreakdown.push(`✅ Pomodoro sessions (${metrics.pomodoroSessions}): +5 points`);
    } else {
      scoreBreakdown.push('❌ No pomodoro sessions: +0 points');
    }
    
    if (metrics.totalFocusTime >= 5) {
      baseScore += 10;
      scoreBreakdown.push(`✅ Focus time ≥5h (${metrics.totalFocusTime}h): +10 points`);
    } else {
      scoreBreakdown.push(`❌ Focus time <5h (${metrics.totalFocusTime}h): +0 points`);
    }
    
    if (metrics.journalEntries > 0) {
      baseScore += 5;
      scoreBreakdown.push(`✅ Journal entries (${metrics.journalEntries}): +5 points`);
    } else {
      scoreBreakdown.push('❌ No journal entries: +0 points');
    }
    
    if (metrics.moodEntries > 0) {
      baseScore += 5;
      scoreBreakdown.push(`✅ Mood entries (${metrics.moodEntries}): +5 points`);
    } else {
      scoreBreakdown.push('❌ No mood entries: +0 points');
    }
    
    const finalScore = Math.min(50, baseScore);
    const cappedPoints = baseScore > 50 ? baseScore - 50 : 0;
    
    
    return finalScore;
  }

  private static calculateQualityMultipliers(qualityMetrics: QualityMetric[]): number {
    
    if (qualityMetrics.length === 0) {
      return 0;
    }
    
    const qualityByType = qualityMetrics.reduce((acc, metric) => {
      if (!acc[metric.activityType]) {
        acc[metric.activityType] = [];
      }
      acc[metric.activityType].push(metric.qualityScore);
      return acc;
    }, {} as Record<string, number[]>);

    let totalQualityScore = 0;
    let totalWeight = 0;
    const qualityBreakdown: Array<{ label: string; value: number; color: string }> = [];

    Object.entries(qualityByType).forEach(([type, scores]) => {
      const avgQuality = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const weight = QUALITY_ACTIVITY_WEIGHTS[type as keyof typeof QUALITY_ACTIVITY_WEIGHTS] || 1;
      const adjustedScore = Math.max(0, (avgQuality - 5) * 2);
      const weightedScore = adjustedScore * weight;
      
      totalQualityScore += weightedScore;
      totalWeight += weight;
      
      qualityBreakdown.push({
        label: type,
        value: Math.round(weightedScore * 100) / 100,
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
      });
    });

    const averageQualityMultiplier = totalWeight > 0 ? totalQualityScore / totalWeight : 0;
    const finalScore = Math.min(25, averageQualityMultiplier);
    const cappedPoints = averageQualityMultiplier > 25 ? averageQualityMultiplier - 25 : 0;
    
    
    return finalScore;
  }

  private static calculateConsistencyBonuses(metrics: MonthlyMetrics): number {
    
    let bonus = 0;
    const consistencyBreakdown: string[] = [];
    
    // Habit consistency (max 8 points)
    const habitConsistency = metrics.totalHabits > 0 ? 
      metrics.habitCompletions / metrics.totalHabits : 0;
    const habitPercentage = Math.round(habitConsistency * 100);
    
    if (habitConsistency >= 0.8) {
      bonus += 8;
      consistencyBreakdown.push(`✅ Habit consistency ≥80% (${habitPercentage}%): +8 points`);
    } else if (habitConsistency >= 0.6) {
      bonus += 5;
      consistencyBreakdown.push(`✅ Habit consistency ≥60% (${habitPercentage}%): +5 points`);
    } else if (habitConsistency >= 0.4) {
      bonus += 2;
      consistencyBreakdown.push(`⚠️ Habit consistency ≥40% (${habitPercentage}%): +2 points`);
    } else {
      consistencyBreakdown.push(`❌ Habit consistency <40% (${habitPercentage}%): +0 points`);
    }
    
    // Journal consistency (max 4 points) - target ~15 entries per month (50% of 30 days)
    const journalConsistency = metrics.journalEntries / 30;
    const journalPercentage = Math.round(journalConsistency * 100);
    
    if (journalConsistency >= 0.5) {
      bonus += 4;
      consistencyBreakdown.push(`✅ Journal consistency ≥50% (${metrics.journalEntries}/30 days): +4 points`);
    } else if (journalConsistency >= 0.3) {
      bonus += 2;
      consistencyBreakdown.push(`⚠️ Journal consistency ≥30% (${metrics.journalEntries}/30 days): +2 points`);
    } else {
      consistencyBreakdown.push(`❌ Journal consistency <30% (${metrics.journalEntries}/30 days): +0 points`);
    }
    
    // Meditation consistency (max 3 points) - target ~12 sessions per month (60% of 20 target)
    const meditationConsistency = metrics.meditationSessions / 20;
    const meditationPercentage = Math.round(meditationConsistency * 100);
    
    if (meditationConsistency >= 0.6) {
      bonus += 3;
      consistencyBreakdown.push(`✅ Meditation consistency ≥60% (${metrics.meditationSessions}/20 target): +3 points`);
    } else if (meditationConsistency >= 0.4) {
      bonus += 1;
      consistencyBreakdown.push(`⚠️ Meditation consistency ≥40% (${metrics.meditationSessions}/20 target): +1 point`);
    } else {
      consistencyBreakdown.push(`❌ Meditation consistency <40% (${metrics.meditationSessions}/20 target): +0 points`);
    }
    
    const finalBonus = Math.min(15, bonus);
    const cappedPoints = bonus > 15 ? bonus - 15 : 0;
    
    
    return finalBonus;
  }

  private static calculateExcellenceBonuses(metrics: MonthlyMetrics): number {
    
    let bonus = 0;
    const perfectRequirements = PERFECT_SCORE_MINIMUMS;
    const excellenceBreakdown: string[] = [];
    
    // Habit excellence (3 points)
    if (metrics.totalHabits >= 3) {
      const habitRate = metrics.habitCompletions / metrics.totalHabits;
      if (habitRate >= 0.8) {
        bonus += 3;
        excellenceBreakdown.push(`✅ Habit excellence: ≥3 habits with ≥80% completion: +3 points`);
      } else {
        excellenceBreakdown.push(`❌ Habit excellence: 3+ habits but only ${Math.round(habitRate * 100)}% completion rate (need 80%): +0 points`);
      }
    } else {
      excellenceBreakdown.push(`❌ Habit excellence: Only ${metrics.totalHabits} habits (need 3+): +0 points`);
    }
    
    // Focus time excellence (3 points)
    if (metrics.totalFocusTime >= perfectRequirements.POMODORO_HOURS) {
      bonus += 3;
      excellenceBreakdown.push(`✅ Focus excellence: ≥${perfectRequirements.POMODORO_HOURS}h focus time (${metrics.totalFocusTime}h): +3 points`);
    } else {
      excellenceBreakdown.push(`❌ Focus excellence: ${metrics.totalFocusTime}h focus time (need ${perfectRequirements.POMODORO_HOURS}h): +0 points`);
    }
    
    // Journal excellence (2 points)
    if (metrics.journalEntries >= perfectRequirements.JOURNAL_ENTRIES) {
      bonus += 2;
      excellenceBreakdown.push(`✅ Journal excellence: ≥${perfectRequirements.JOURNAL_ENTRIES} entries (${metrics.journalEntries}): +2 points`);
    } else {
      excellenceBreakdown.push(`❌ Journal excellence: ${metrics.journalEntries} entries (need ${perfectRequirements.JOURNAL_ENTRIES}): +0 points`);
    }
    
    // Meditation excellence (2 points)
    if (metrics.meditationSessions >= perfectRequirements.MEDITATION_SESSIONS) {
      bonus += 2;
      excellenceBreakdown.push(`✅ Meditation excellence: ≥${perfectRequirements.MEDITATION_SESSIONS} sessions (${metrics.meditationSessions}): +2 points`);
    } else {
      excellenceBreakdown.push(`❌ Meditation excellence: ${metrics.meditationSessions} sessions (need ${perfectRequirements.MEDITATION_SESSIONS}): +0 points`);
    }
    
    const finalBonus = Math.min(10, bonus);
    const cappedPoints = bonus > 10 ? bonus - 10 : 0;
    
    
    return finalBonus;
  }

  private static calculateTotalScore(breakdown: ScoreBreakdown): number {
    return breakdown.baseEngagement + 
           breakdown.qualityMultipliers + 
           breakdown.consistencyBonuses + 
           breakdown.excellenceBonuses;
  }

  private static extractRequirements(metrics: MonthlyMetrics): MonthlyRequirements {
    return {
      appDays: metrics.activeDays,
      pomodoroHours: metrics.totalFocusTime,
      meditationSessions: metrics.meditationSessions,
      journalEntries: metrics.journalEntries,
      habitCompletionRate: metrics.totalHabits > 0 ? 
        metrics.habitCompletions / metrics.totalHabits : 0,
      goalCompletions: metrics.completedGoals
    };
  }

  static getTierTargets(tier: 1 | 2 | 3): MonthlyRequirements {
    switch (tier) {
      case 1:
        return this.TIER_TARGETS.TIER_1;
      case 2:
        return this.TIER_TARGETS.TIER_2;
      case 3:
        return this.TIER_TARGETS.TIER_3;
      default:
        return this.TIER_TARGETS.TIER_1;
    }
  }

  static calculateProgressToNextTier(
    currentScore: MonthlyScore,
    metrics: MonthlyMetrics
  ): { nextTier: number; progressPercentage: number; missingRequirements: string[] } {
    // Convert string tier to number
    const tierNumber = currentScore.tier === 'TIER_1' ? 1 : 
                     currentScore.tier === 'TIER_2' ? 2 : 
                     currentScore.tier === 'TIER_3' ? 3 : 1;
    const nextTier = tierNumber < 3 ? tierNumber + 1 : 3;
    
    if (tierNumber === 3) {
      return {
        nextTier: 3,
        progressPercentage: 100,
        missingRequirements: []
      };
    }

    const nextTierTargets = this.getTierTargets(nextTier as 1 | 2 | 3);
    const missingRequirements: string[] = [];

    if (metrics.activeDays < nextTierTargets.appDays) {
      missingRequirements.push(`${nextTierTargets.appDays - metrics.activeDays} more active days`);
    }

    if (metrics.totalFocusTime < nextTierTargets.pomodoroHours) {
      missingRequirements.push(`${nextTierTargets.pomodoroHours - metrics.totalFocusTime} more focus hours`);
    }

    if (metrics.meditationSessions < nextTierTargets.meditationSessions) {
      missingRequirements.push(`${nextTierTargets.meditationSessions - metrics.meditationSessions} more meditation sessions`);
    }

    if (metrics.journalEntries < nextTierTargets.journalEntries) {
      missingRequirements.push(`${nextTierTargets.journalEntries - metrics.journalEntries} more journal entries`);
    }

    const habitRate = metrics.totalHabits > 0 ? metrics.habitCompletions / metrics.totalHabits : 0;
    if (habitRate < nextTierTargets.habitCompletionRate) {
      const neededRate = Math.round((nextTierTargets.habitCompletionRate - habitRate) * 100);
      missingRequirements.push(`${neededRate}% better habit completion rate`);
    }

    if (metrics.completedGoals < nextTierTargets.goalCompletions) {
      missingRequirements.push(`${nextTierTargets.goalCompletions - metrics.completedGoals} more goal completions`);
    }

    const thresholds = [50, 80, 100];
    const currentThreshold = thresholds[tierNumber - 1];
    const nextThreshold = thresholds[nextTier - 1];
    
    const progressPercentage = Math.min(100, 
      ((currentScore.score - currentThreshold) / (nextThreshold - currentThreshold)) * 100
    );

    return {
      nextTier,
      progressPercentage: Math.round(progressPercentage),
      missingRequirements
    };
  }

  static validateMetrics(metrics: MonthlyMetrics): string[] {
    const errors: string[] = [];

    if (metrics.activeDays < 0 || metrics.activeDays > 31) {
      errors.push('Active days must be between 0 and 31');
    }

    if (metrics.totalFocusTime < 0) {
      errors.push('Total focus time cannot be negative');
    }

    if (metrics.pomodoroSessions < 0) {
      errors.push('Pomodoro sessions cannot be negative');
    }

    if (metrics.habitCompletions < 0) {
      errors.push('Habit completions cannot be negative');
    }

    if (metrics.totalHabits < 0) {
      errors.push('Total habits cannot be negative');
    }

    if (metrics.habitCompletions > metrics.totalHabits) {
      errors.push('Habit completions cannot exceed total habits');
    }

    return errors;
  }

  static createEmptyMetrics(): MonthlyMetrics {
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
      moodEntries: 0
    };
  }

  static getCurrentMonthId(): string {
    return formatMonthId(new Date());
  }

}