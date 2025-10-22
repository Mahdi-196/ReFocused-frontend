import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/api/client';
import { GOALS } from '@/api/endpoints';

// Goal type
export interface Goal {
  id: number;
  title: string;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: 'daily' | 'weekly' | 'monthly';
  status: 'active' | 'completed' | 'missed';
  created_at: string;
  completed_at?: string;
  progress?: number;
}

// Fetch goals by duration
export function useGoals(duration: 'daily' | 'weekly' | 'monthly' = 'daily') {
  return useQuery({
    queryKey: ['goals', duration],
    queryFn: async () => {
      const response = await client.get<Goal[]>(`${GOALS.LIST}?duration=${duration}`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create a new goal
export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newGoal: Partial<Goal>) => {
      const response = await client.post<Goal>(GOALS.CREATE, newGoal);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch goals after creating
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

// Update goal progress
export function useUpdateGoalProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, progress }: { id: number; progress: number }) => {
      const response = await client.post(GOALS.PROGRESS(id), { progress });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
