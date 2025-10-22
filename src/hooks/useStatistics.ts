import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/api/client';
import { STATISTICS } from '@/api/endpoints';

export interface FocusStats {
  total_sessions: number;
  total_time: number;
  average_session_length: number;
  streak: number;
}

export interface SessionData {
  date: string;
  duration: number;
  type: string;
}

// Fetch focus statistics
export function useFocusStatistics() {
  return useQuery({
    queryKey: ['focusStatistics'],
    queryFn: async () => {
      const response = await client.get<FocusStats>(STATISTICS.FOCUS);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Fetch session history
export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await client.get<SessionData[]>(STATISTICS.SESSIONS);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Track session completion
export function useTrackSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionData: { duration: number; type: string }) => {
      const response = await client.post(STATISTICS.SESSIONS, sessionData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focusStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

// Fetch task statistics
export function useTaskStatistics() {
  return useQuery({
    queryKey: ['taskStatistics'],
    queryFn: async () => {
      const response = await client.get(STATISTICS.TASKS);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
