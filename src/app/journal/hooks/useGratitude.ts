import { useState, useEffect } from "react";
import journalService from "@/api/services/journalService";
import type { GratitudeEntry, JournalApiError } from "../types";
import { useConsistentDate } from "@/hooks/useConsistentDate";

/**
 * Custom hook for managing gratitude entries with backend integration
 */
export function useGratitude() {
  const [gratitudes, setGratitudes] = useState<GratitudeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentDate, isReady } = useConsistentDate();

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
    if (isReady) {
      loadGratitudes();
    }
  }, [isReady]);

  // Listen for day changes (resets at 12:00 like other components)
  useEffect(() => {
    if (!isReady) return;

    // Reload gratitudes when the date changes (24-hour reset)
    loadGratitudes();
  }, [currentDate, isReady]);

  // Also listen for the dayChanged event directly from timeService
  useEffect(() => {
    const handleDayChange = () => {
      console.log('🔄 [GRATITUDE] Day changed, reloading gratitudes...');
      loadGratitudes();
    };

    // Listen for custom dayChanged event
    if (typeof window !== 'undefined') {
      window.addEventListener('dayChanged', handleDayChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('dayChanged', handleDayChange);
      }
    };
  }, []);

  // Add new gratitude
  const addGratitude = async (text: string, date?: string): Promise<boolean> => {
    if (!text.trim()) return false;

    // Check if already at maximum of 3 gratitudes
    if (gratitudes.length >= 3) {
      setError("You can only have up to 3 gratitude entries. Please delete one before adding a new one.");
      return false;
    }

    try {
      console.log('🎯 [HOOK] About to call journalService.createGratitude:', {
        text: text.trim(),
        date,
        textLength: text.trim().length,
        serviceExists: !!journalService.createGratitude,
        serviceMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(journalService))
      });
      
      const newGratitude = await journalService.createGratitude(text.trim(), date);
      
      console.log('✅ [HOOK] journalService.createGratitude succeeded:', newGratitude);
      setGratitudes(prev => [newGratitude, ...prev]);
      return true;
    } catch (err) {
      const error = err as JournalApiError;
      console.error("Failed to add gratitude:", error);
      setError(error.message);
      return false;
    }
  };

  // Update gratitude
  const updateGratitude = async (id: number | string, text: string): Promise<boolean> => {
    try {
      const updatedGratitude = await journalService.updateGratitude(id.toString(), text.trim());
      setGratitudes(prev =>
        prev.map(g => g.id === id ? updatedGratitude : g)
      );
      return true;
    } catch (err) {
      const error = err as JournalApiError;
      console.error("Failed to update gratitude:", error);
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
    updateGratitude,
    deleteGratitude,
    refreshGratitudes,
    clearError,
    totalGratitudes,
  };
} 