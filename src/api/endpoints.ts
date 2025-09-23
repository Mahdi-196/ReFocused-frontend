/**
 * API Endpoints
 * 
 * This file contains all API endpoint constants to ensure consistency
 * across the application and avoid typos in API calls.
 */

// Auth endpoints
export const AUTH = {
  LOGIN: '/v1/auth/login',
  REGISTER: '/v1/auth/register',
  GOOGLE: '/v1/auth/google',
  ME: '/v1/user/me',
  CHANGE_PASSWORD: '/v1/auth/change-password',
  CHANGE_USERNAME: '/v1/auth/change-username',
};

// User endpoints
export const USER = {
  PROFILE: '/v1/user/profile',
  NOTES: '/v1/user/notes',
  STATS: '/v1/user/stats',
  EXPORT: '/v1/user/me/export',
  EXPORT_STATUS: (taskId: string) => `/v1/user/me/export/${taskId}/status`,
  EXPORT_DOWNLOAD: (taskId: string) => `/v1/user/me/export/${taskId}/download`,
  CLEAR_ACTIVITY: '/v1/user/me/activity',
  DELETE_ACCOUNT: '/v1/user/me',
  AVATAR: '/v1/user/avatar',
  TUTORIAL: '/v1/user/tutorial',
};

// Goals endpoints
export const GOALS = {
  CREATE: '/v1/goals',
  LIST: '/v1/goals', // Main endpoint for fetching goals with duration filtering
  PROGRESS: (id: number | string) => `/v1/goals/${id}/progress`,
  DETAIL: (id: number | string) => `/v1/goals/${id}`,
  HISTORY: '/v1/goals/history', // New endpoint for completed goals history
  STATS: '/v1/goals/stats', // Enhanced stats endpoint
};

// Study endpoints (relative to baseURL)
export const STUDY = {
  SETS: '/v1/study/sets',
  SET_DETAIL: (id: number | string) => `/v1/study/sets/${id}`,
  CARDS: (setId: number | string) => `/v1/study/sets/${setId}/cards`,
  CARD_DETAIL: (setId: number | string, cardId: number | string) =>
    `/v1/study/sets/${setId}/cards/${cardId}`,
};

// Habits endpoints
export const HABITS = {
  BASE: '/v1/habits',
  DETAIL: (id: number | string) => `/v1/habits/${id}`,
};

// Dashboard endpoints
export const DASHBOARD = {
  DAILY_ENTRIES: '/v1/dashboard/daily-entries',
};

// Journal endpoints
export const JOURNAL = {
  BASE: '/v1/journal',
  COLLECTIONS: '/v1/journal/collections',
  COLLECTION_DETAIL: (id: string) => `/v1/journal/collections/${id}`,
  COLLECTION_ENTRIES: (id: string) => `/v1/journal/collections/${id}/entries`,
  COLLECTION_VERIFY_PASSWORD: (id: string) => `/v1/journal/collections/${id}/verify-password`,
  ENTRIES: '/v1/journal/entries',
  ENTRY_DETAIL: (id: string) => `/v1/journal/entries/${id}`,
  GRATITUDE: '/v1/journal/gratitude',
  GRATITUDE_DETAIL: (id: string) => `/v1/journal/gratitude/${id}`,
  STATS: '/v1/journal/stats',
  HEALTH: '/v1/journal/health',
}; 

// Mood endpoints
export const MOOD = {
  BASE: '/v1/mood',
  BY_DATE: (date: string) => `/v1/mood/${date}`,
};

// Statistics endpoints (relative to baseURL)
export const STATISTICS = {
  BASE: '/v1/statistics',
  FOCUS: '/v1/statistics/focus',
  SESSIONS: '/v1/statistics/sessions',
  TASKS: '/v1/statistics/tasks',
};

// Calendar endpoints
export const CALENDAR = {
  ENTRIES: '/v1/calendar/entries',
  ENTRY_BY_DATE: (date: string) => `/v1/calendar/entries/${date}`,
  SUMMARY: '/v1/calendar/summary',
};

// Streak endpoints
export const STREAK = {
  STATUS: '/v1/streak/status',
  MANUAL_CHECKIN: '/v1/streak/manual-checkin',
  LEADERBOARD: '/v1/streak/leaderboard',
  HISTORY: '/v1/streak/history',
  INTERACTION_TYPES: '/v1/streak/interaction-types',
  STATS: '/v1/streak/stats',
}; 

// Email subscription endpoints
export const EMAIL = {
  STATUS: '/v1/email/status',
  SUBSCRIBE: '/v1/email/refocusedSubscribe',
  UNSUBSCRIBE: '/v1/email/unsubscribe',
};

// Voting endpoints
export const VOTING = {
  VOTE: '/v1/voting/vote',
  STATS: '/v1/voting/stats',
  ME: '/v1/voting/me',
};

// Feedback endpoint
export const FEEDBACK = {
  SUBMIT: '/v1/feedback',
};