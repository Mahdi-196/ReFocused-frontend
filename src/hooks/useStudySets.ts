import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/api/client';
import { STUDY } from '@/api/endpoints';

export interface Card {
  id: string;
  front: string;
  back: string;
}

export interface StudySet {
  id: string;
  name: string;
  cards: Card[];
  user_id?: string | number;
  last_updated?: string;
}

// Fetch all study sets
export function useStudySets() {
  return useQuery({
    queryKey: ['studySets'],
    queryFn: async () => {
      const response = await client.get<StudySet[]>(STUDY.SETS);
      return response.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch a single study set with cards
export function useStudySet(setId: string | null) {
  return useQuery({
    queryKey: ['studySet', setId],
    queryFn: async () => {
      if (!setId) return null;
      const response = await client.get<StudySet>(STUDY.SET_DETAIL(setId));
      return response.data;
    },
    enabled: !!setId,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Create a new study set
export function useCreateStudySet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newSet: { name: string }) => {
      const response = await client.post<StudySet>(STUDY.SETS, newSet);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studySets'] });
    },
  });
}

// Update study set name
export function useUpdateStudySet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const response = await client.put(STUDY.SET_DETAIL(id), { name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studySets'] });
    },
  });
}

// Delete study set
export function useDeleteStudySet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (setId: string) => {
      await client.delete(STUDY.SET_DETAIL(setId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studySets'] });
    },
  });
}

// Add card to study set
export function useAddCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ setId, card }: { setId: string; card: Omit<Card, 'id'> }) => {
      const response = await client.post(STUDY.CARDS(setId), card);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studySet', variables.setId] });
      queryClient.invalidateQueries({ queryKey: ['studySets'] });
    },
  });
}

// Update card
export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ setId, cardId, card }: { setId: string; cardId: string; card: Partial<Card> }) => {
      const response = await client.put(STUDY.CARD_DETAIL(setId, cardId), card);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studySet', variables.setId] });
      queryClient.invalidateQueries({ queryKey: ['studySets'] });
    },
  });
}

// Delete card
export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ setId, cardId }: { setId: string; cardId: string }) => {
      await client.delete(STUDY.CARD_DETAIL(setId, cardId));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studySet', variables.setId] });
      queryClient.invalidateQueries({ queryKey: ['studySets'] });
    },
  });
}
