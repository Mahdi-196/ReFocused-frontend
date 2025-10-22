import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/api/client';
import { JOURNAL } from '@/api/endpoints';

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
  collection_id?: string;
}

export interface GratitudeEntry {
  id: string;
  content: string;
  created_at: string;
  date: string;
}

export interface JournalCollection {
  id: string;
  name: string;
  description?: string;
  is_locked: boolean;
  created_at: string;
}

// Fetch journal entries
export function useJournalEntries(collectionId?: string) {
  return useQuery({
    queryKey: ['journalEntries', collectionId],
    queryFn: async () => {
      const url = collectionId
        ? `${JOURNAL.ENTRIES}?collection=${collectionId}`
        : JOURNAL.ENTRIES;
      const response = await client.get<JournalEntry[]>(url);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Fetch single journal entry
export function useJournalEntry(entryId: string | null) {
  return useQuery({
    queryKey: ['journalEntry', entryId],
    queryFn: async () => {
      if (!entryId) return null;
      const response = await client.get<JournalEntry>(JOURNAL.ENTRY_DETAIL(entryId));
      return response.data;
    },
    enabled: !!entryId,
    staleTime: 2 * 60 * 1000,
  });
}

// Create journal entry
export function useCreateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Partial<JournalEntry>) => {
      const response = await client.post<JournalEntry>(JOURNAL.ENTRIES, entry);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
    },
  });
}

// Update journal entry
export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, entry }: { id: string; entry: Partial<JournalEntry> }) => {
      const response = await client.put(JOURNAL.ENTRY_DETAIL(id), entry);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journalEntry', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
    },
  });
}

// Delete journal entry
export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      await client.delete(JOURNAL.ENTRY_DETAIL(entryId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
    },
  });
}

// Fetch journal collections
export function useJournalCollections() {
  return useQuery({
    queryKey: ['journalCollections'],
    queryFn: async () => {
      const response = await client.get<JournalCollection[]>(JOURNAL.COLLECTIONS);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Fetch gratitude entries
export function useGratitudeEntries() {
  return useQuery({
    queryKey: ['gratitudeEntries'],
    queryFn: async () => {
      const response = await client.get<GratitudeEntry[]>(JOURNAL.GRATITUDE);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Create gratitude entry
export function useCreateGratitudeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: { content: string; date: string }) => {
      const response = await client.post<GratitudeEntry>(JOURNAL.GRATITUDE, entry);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gratitudeEntries'] });
    },
  });
}

// Delete gratitude entry
export function useDeleteGratitudeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      await client.delete(JOURNAL.GRATITUDE_DETAIL(entryId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gratitudeEntries'] });
    },
  });
}
