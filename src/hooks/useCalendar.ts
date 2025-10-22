import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/api/client';
import { CALENDAR, STREAK } from '@/api/endpoints';

export interface CalendarEntry {
  date: string;
  activities: string[];
  mood?: string;
  notes?: string;
}

export interface StreakStatus {
  current_streak: number;
  longest_streak: number;
  last_check_in: string;
  total_check_ins: number;
}

export interface LeaderboardEntry {
  user_id: number;
  username: string;
  streak: number;
  rank: number;
}

// Fetch calendar entries
export function useCalendarEntries() {
  return useQuery({
    queryKey: ['calendarEntries'],
    queryFn: async () => {
      const response = await client.get<CalendarEntry[]>(CALENDAR.ENTRIES);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Fetch calendar entry by date
export function useCalendarEntryByDate(date: string) {
  return useQuery({
    queryKey: ['calendarEntry', date],
    queryFn: async () => {
      const response = await client.get<CalendarEntry>(CALENDAR.ENTRY_BY_DATE(date));
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch calendar summary
export function useCalendarSummary() {
  return useQuery({
    queryKey: ['calendarSummary'],
    queryFn: async () => {
      const response = await client.get(CALENDAR.SUMMARY);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch streak status
export function useStreakStatus() {
  return useQuery({
    queryKey: ['streakStatus'],
    queryFn: async () => {
      const response = await client.get<StreakStatus>(STREAK.STATUS);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Manual check-in
export function useManualCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await client.post(STREAK.MANUAL_CHECKIN);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streakStatus'] });
    },
  });
}

// Fetch leaderboard
export function useStreakLeaderboard() {
  return useQuery({
    queryKey: ['streakLeaderboard'],
    queryFn: async () => {
      const response = await client.get<LeaderboardEntry[]>(STREAK.LEADERBOARD);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch streak history
export function useStreakHistory() {
  return useQuery({
    queryKey: ['streakHistory'],
    queryFn: async () => {
      const response = await client.get(STREAK.HISTORY);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch streak stats
export function useStreakStats() {
  return useQuery({
    queryKey: ['streakStats'],
    queryFn: async () => {
      const response = await client.get(STREAK.STATS);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
