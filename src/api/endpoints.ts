/**
 * API Endpoints
 * 
 * This file contains all API endpoint constants to ensure consistency
 * across the application and avoid typos in API calls.
 */

// Auth endpoints
export const AUTH = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  GOOGLE: '/auth/google',
  ME: '/user/me',
  CHANGE_PASSWORD: '/auth/change-password',
  CHANGE_USERNAME: '/auth/change-username',
};

// User endpoints
export const USER = {
  PROFILE: '/user/profile',
  NOTES: '/user/notes',
  STATS: '/user/stats',
  EXPORT: '/user/me/export',
  EXPORT_STATUS: (taskId: string) => `/user/me/export/${taskId}/status`,
  EXPORT_DOWNLOAD: (taskId: string) => `/user/me/export/${taskId}/download`,
  CLEAR_ACTIVITY: '/user/me/activity',
  DELETE_ACCOUNT: '/user/me',
  AVATAR: '/user/avatar',
  TUTORIAL: '/user/tutorial',
};

// Goals endpoints
export const GOALS = {
  CREATE: '/goals',
  LIST: '/goals', // Main endpoint for fetching goals with duration filtering
  PROGRESS: (id: number | string) => `/goals/${id}/progress`,
  DETAIL: (id: number | string) => `/goals/${id}`,
  HISTORY: '/goals/history', // New endpoint for completed goals history
  STATS: '/goals/stats', // Enhanced stats endpoint
};

// Study endpoints (relative to baseURL)
export const STUDY = {
  SETS: '/study/sets',
  SET_DETAIL: (id: number | string) => `/study/sets/${id}`,
  CARDS: (setId: number | string) => `/study/sets/${setId}/cards`,
  CARD_DETAIL: (setId: number | string, cardId: number | string) =>
    `/study/sets/${setId}/cards/${cardId}`,
};

// Habits endpoints
export const HABITS = {
  BASE: '/habits',
  DETAIL: (id: number | string) => `/habits/${id}`,
};

// Dashboard endpoints
export const DASHBOARD = {
  DAILY_ENTRIES: '/dashboard/daily-entries',
};

// Journal endpoints
export const JOURNAL = {
  BASE: '/journal',
  COLLECTIONS: '/journal/collections',
  COLLECTION_DETAIL: (id: string) => `/journal/collections/${id}`,
  COLLECTION_ENTRIES: (id: string) => `/journal/collections/${id}/entries`,
  COLLECTION_VERIFY_PASSWORD: (id: string) => `/journal/collections/${id}/verify-password`,
  ENTRIES: '/journal/entries',
  ENTRY_DETAIL: (id: string) => `/journal/entries/${id}`,
  GRATITUDE: '/journal/gratitude',
  GRATITUDE_DETAIL: (id: string) => `/journal/gratitude/${id}`,
  STATS: '/journal/stats',
  HEALTH: '/journal/health',
}; 

// Mood endpoints
export const MOOD = {
  BASE: '/mood',
  BY_DATE: (date: string) => `/mood/${date}`,
};

// Statistics endpoints (relative to baseURL)
export const STATISTICS = {
  BASE: '/statistics',
  FOCUS: '/statistics/focus',
  SESSIONS: '/statistics/sessions',
  TASKS: '/statistics/tasks',
};

// Calendar endpoints
export const CALENDAR = {
  ENTRIES: '/calendar/entries',
  ENTRY_BY_DATE: (date: string) => `/calendar/entries/${date}`,
  SUMMARY: '/calendar/summary',
};

// Streak endpoints
export const STREAK = {
  STATUS: '/streak/status',
  MANUAL_CHECKIN: '/streak/manual-checkin',
  LEADERBOARD: '/streak/leaderboard',
  HISTORY: '/streak/history',
  INTERACTION_TYPES: '/streak/interaction-types',
  STATS: '/streak/stats',
}; 

// Email subscription endpoints
export const EMAIL = {
  STATUS: '/email/status',
  SUBSCRIBE: '/email/refocusedSubscribe',
  UNSUBSCRIBE: '/email/unsubscribe',
};

// Voting endpoints
export const VOTING = {
  VOTE: '/voting/vote',
  STATS: '/voting/stats',
  ME: '/voting/me',
};

// Feedback endpoint
export const FEEDBACK = {
  SUBMIT: '/feedback',
};