// Monthly productivity types

export interface MonthlyScore {
  score: number;
  tier: string;
  breakdown: ScoreBreakdown;
  requirements: MonthlyRequirements;
  month: string;
  userId: string | undefined;
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
}

export interface MonthlyRequirements {
  appDays: number;
  pomodoroHours: number;
  meditationSessions: number;
  journalEntries: number;
  habitCompletionRate: number;
  goalCompletions: number;
}

export interface ScoreBreakdown {
  baseEngagement: number;
  qualityMultipliers: number;
  consistencyBonuses: number;
  excellenceBonuses: number;
}

export const QUALITY_ACTIVITY_WEIGHTS = {
  APP_USAGE: 0.15,
  POMODORO: 0.20,
  MEDITATION: 0.15,
  JOURNAL: 0.15,
  STUDY: 0.15,
  GOALS: 0.10,
  HABITS: 0.10
};

export const PERFECT_SCORE_MINIMUMS = {
  APP_DAYS: 25,
  POMODORO_HOURS: 20,
  MEDITATION_SESSIONS: 15,
  JOURNAL_ENTRIES: 20,
  STUDY_SESSIONS: 10,
  GOALS_COMPLETED: 5,
  HABIT_STREAK: 30
};

export function getScoreTier(score: number): string {
  if (score >= 90) return 'TIER_1';
  if (score >= 70) return 'TIER_2';
  if (score >= 50) return 'TIER_3';
  return 'TIER_4';
}

export function formatMonthId(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}