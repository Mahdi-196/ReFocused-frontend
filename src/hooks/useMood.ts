import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/api/client';
import { MOOD } from '@/api/endpoints';

export interface MoodEntry {
  id?: string;
  mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  date: string;
  note?: string;
  created_at?: string;
}

// Fetch mood entry by date
export function useMoodByDate(date: string) {
  return useQuery({
    queryKey: ['mood', date],
    queryFn: async () => {
      const response = await client.get<MoodEntry>(MOOD.BY_DATE(date));
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Fetch all mood entries
export function useMoodEntries() {
  return useQuery({
    queryKey: ['moodEntries'],
    queryFn: async () => {
      const response = await client.get<MoodEntry[]>(MOOD.BASE);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Create or update mood entry
export function useSetMood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (moodData: MoodEntry) => {
      const response = await client.post<MoodEntry>(MOOD.BASE, moodData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mood', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['moodEntries'] });
    },
  });
}
