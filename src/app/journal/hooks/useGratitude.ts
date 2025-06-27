import { useState, useEffect } from "react";
import journalService from "@/api/services/journalService";
import type { GratitudeEntry, JournalApiError } from "../types";

/**
 * Custom hook for managing gratitude entries with backend integration
 */
export function useGratitude() {
  const [gratitudes, setGratitudes] = useState<GratitudeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load gratitudes from backend
  const loadGratitudes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await journalService.getGratitudes();
      setGratitudes(data);
    } catch (err) {
      const error = err as JournalApiError;
      console.error("Failed to load gratitudes:", error);
      setError(error.message);
      
      // Fallback to empty array if backend is unavailable
      setGratitudes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadGratitudes();
  }, []);

  // Add new gratitude
  const addGratitude = async (text: string): Promise<boolean> => {
    if (!text.trim()) return false;

    try {
      const newGratitude = await journalService.createGratitude(text.trim());
      setGratitudes(prev => [newGratitude, ...prev]);
      return true;
    } catch (err) {
      const error = err as JournalApiError;
      console.error("Failed to add gratitude:", error);
      setError(error.message);
      return false;
    }
  };

  // Delete gratitude
  const deleteGratitude = async (id: number | string): Promise<boolean> => {
    try {
      await journalService.deleteGratitude(id.toString());
      setGratitudes(prev => prev.filter(g => g.id !== id));
      return true;
    } catch (err) {
      const error = err as JournalApiError;
      console.error("Failed to delete gratitude:", error);
      setError(error.message);
      return false;
    }
  };

  // Refresh gratitudes from backend
  const refreshGratitudes = () => {
    loadGratitudes();
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const totalGratitudes = gratitudes.length;

  return {
    gratitudes,
    isLoading,
    error,
    addGratitude,
    deleteGratitude,
    refreshGratitudes,
    clearError,
    totalGratitudes,
  };
} 