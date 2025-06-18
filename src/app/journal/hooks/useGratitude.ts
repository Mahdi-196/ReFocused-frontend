import { useState } from "react";
import type { GratitudeEntry } from "../types";

/**
 * Custom hook for managing gratitude entries
 * Handles gratitude log state and operations
 */
export function useGratitude() {
  const [gratitudes, setGratitudes] = useState<GratitudeEntry[]>([
    { id: 1, text: "Grateful for a productive morning and good coffee", date: "Today" },
    { id: 2, text: "Thankful for my supportive team", date: "Yesterday" },
    { id: 3, text: "Appreciated the peaceful evening walk", date: "2 days ago" },
  ]);

  const addGratitude = (text: string) => {
    const newEntry: GratitudeEntry = {
      id: Math.max(...gratitudes.map(g => g.id), 0) + 1,
      text: text.trim(),
      date: "Today"
    };
    setGratitudes([newEntry, ...gratitudes]);
  };

  const removeGratitude = (id: number) => {
    setGratitudes(gratitudes.filter(g => g.id !== id));
  };

  return {
    gratitudes,
    addGratitude,
    removeGratitude,
    totalGratitudes: gratitudes.length
  };
} 