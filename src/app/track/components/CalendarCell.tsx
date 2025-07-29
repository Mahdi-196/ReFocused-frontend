import React from "react";
import { DailyCalendarEntry } from "../types";

interface CalendarCellProps {
  date: number;
  dateStr: string;
  calendarEntry: DailyCalendarEntry | null;
  isSelected: boolean;
  isReadOnly: boolean;
  onDateClick: (dateStr: string) => void;
}

export default function CalendarCell({
  date,
  dateStr,
  calendarEntry,
  isSelected,
  isReadOnly,
  onDateClick,
}: CalendarCellProps) {
  // Calculate overall mood score from happiness, focus, and stress
  const calculateMoodScore = (
    happiness: number,
    focus: number,
    stress: number
  ) => {
    // Convert to 0-10 scale: (happiness + focus + (6-stress)) / 3 * 2
    // Stress is inverted (higher stress = lower score)
    const invertedStress = 6 - stress; // Convert 1-5 stress to 5-1 scale
    return ((happiness + focus + invertedStress) / 3) * 2;
  };

  // Debug logging for dates with gratitudes only
  if (calendarEntry?.gratitudes && calendarEntry.gratitudes.length > 0) {
    console.log(`🚨 GRATITUDE FOUND! CalendarCell(${dateStr}) HAS GRATITUDES:`, {
      gratitudesCount: calendarEntry.gratitudes.length,
      gratitudes: calendarEntry.gratitudes
    });
  }

  const getDayClass = () => {
    const hasMood = !!calendarEntry?.moodEntry;

    // Only show mood colors - nothing else
    if (calendarEntry?.moodEntry) {
      const { happiness, focus, stress } = calendarEntry.moodEntry;
      const moodScore = calculateMoodScore(happiness, focus, stress);
      if (moodScore >= 7) return "mood-good";
      if (moodScore >= 5) return "mood-neutral";
      return "mood-poor";
    }

    return "";
  };

  const getMoodStyling = () => {
    if (isSelected) {
      return {
        background:
          "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)",
        boxShadow:
          "0 4px 12px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
        border: "1px solid #3b82f6",
      };
    }

    const dayClass = getDayClass();
    switch (dayClass) {
      case "mood-good":
        return {
          background:
            "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
          boxShadow:
            "0 4px 12px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          border: "1px solid #10b981",
        };
      case "mood-neutral":
        return {
          background:
            "linear-gradient(135deg, #eab308 0%, #ca8a04 50%, #a16207 100%)",
          boxShadow:
            "0 4px 12px rgba(234, 179, 8, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          border: "1px solid #eab308",
        };
      case "mood-poor":
        return {
          background:
            "linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)",
          boxShadow:
            "0 4px 12px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          border: "1px solid #ef4444",
        };
      default:
        return {
          background:
            "linear-gradient(135deg, #4b5563 0%, #374151 50%, #1f2937 100%)",
          boxShadow:
            "0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          border: "1px solid #4b5563",
        };
    }
  };

  return (
    <div
      className={`aspect-square flex flex-col items-center justify-center rounded transition-all text-xs text-white relative cursor-pointer ${
        isReadOnly ? "opacity-80" : ""
      }`}
      onClick={() => onDateClick(dateStr)}
      style={getMoodStyling()}
    >
      {/* Gloss effect */}
      <div
        className="absolute inset-0 rounded opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)",
        }}
      />

      {/* Date number */}
      <span className="relative z-10 font-medium">{date}</span>
    </div>
  );
} 