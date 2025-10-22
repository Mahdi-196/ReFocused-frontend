import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/api/client';
import { USER, AUTH, FEEDBACK, EMAIL, VOTING } from '@/api/endpoints';

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  username?: string;
  avatar?: string;
  profile_picture?: string;
  created_at: string;
}

export interface UserStats {
  total_sessions: number;
  total_time: number;
  goals_completed: number;
  habits_tracked: number;
}

// Fetch current user
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await client.get<UserProfile>(AUTH.ME);
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Fetch user stats
export function useUserStats() {
  return useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      const response = await client.get<UserStats>(USER.STATS);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Update user avatar
export function useUpdateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (avatarData: { style: string; seed: string; options?: any }) => {
      const response = await client.post(USER.AVATAR, avatarData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

// Change password
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: { old_password: string; new_password: string }) => {
      const response = await client.post(AUTH.CHANGE_PASSWORD, data);
      return response.data;
    },
  });
}

// Change username
export function useChangeUsername() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      const response = await client.post(AUTH.CHANGE_USERNAME, { username });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

// Delete account
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      await client.delete(USER.DELETE_ACCOUNT);
    },
  });
}

// Submit feedback
export function useSubmitFeedback() {
  return useMutation({
    mutationFn: async (feedback: { message: string; type?: string }) => {
      const response = await client.post(FEEDBACK.SUBMIT, feedback);
      return response.data;
    },
  });
}

// Email subscription
export function useEmailSubscription() {
  return useQuery({
    queryKey: ['emailSubscription'],
    queryFn: async () => {
      const response = await client.get(EMAIL.STATUS);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Subscribe to email
export function useSubscribeEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await client.post(EMAIL.SUBSCRIBE);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailSubscription'] });
    },
  });
}

// Unsubscribe from email
export function useUnsubscribeEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await client.post(EMAIL.UNSUBSCRIBE);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailSubscription'] });
    },
  });
}

// Voting
export function useVotingStats() {
  return useQuery({
    queryKey: ['votingStats'],
    queryFn: async () => {
      const response = await client.get(VOTING.STATS);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useMyVote() {
  return useQuery({
    queryKey: ['myVote'],
    queryFn: async () => {
      const response = await client.get(VOTING.ME);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubmitVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vote: { option: string }) => {
      const response = await client.post(VOTING.VOTE, vote);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votingStats'] });
      queryClient.invalidateQueries({ queryKey: ['myVote'] });
    },
  });
}

// Tutorial status
export function useTutorialStatus() {
  return useQuery({
    queryKey: ['tutorialStatus'],
    queryFn: async () => {
      const response = await client.get(USER.TUTORIAL);
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdateTutorialStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (completed: boolean) => {
      const response = await client.post(USER.TUTORIAL, { completed });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorialStatus'] });
    },
  });
}
