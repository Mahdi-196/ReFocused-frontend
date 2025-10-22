import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/api/client';
import { HABITS } from '@/api/endpoints';

// Habit type
export interface Habit {
  id: number;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  created_at: string;
  streak: number;
  last_completed?: string;
}

// Fetch all habits
export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const response = await client.get<Habit[]>(HABITS.BASE);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create a new habit
export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newHabit: Partial<Habit>) => {
      const response = await client.post<Habit>(HABITS.BASE, newHabit);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

// Mark habit as complete
export function useCompleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: number) => {
      const response = await client.post(`${HABITS.DETAIL(habitId)}/complete`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
