import React from "react";
import { UserHabit } from "../types";

interface HabitWithCompletion {
  habit: UserHabit;
  completed: boolean;
  wasActive: boolean;
}

interface HabitsDisplayProps {
  habitsForDate: HabitWithCompletion[];
  selectedDate: string;
  isDateReadOnly: (dateStr: string) => boolean;
  onToggleHabit: (dateStr: string, habitId: string, completed: boolean) => void;
}

export default function HabitsDisplay({
  habitsForDate,
  selectedDate,
  isDateReadOnly,
  onToggleHabit,
}: HabitsDisplayProps) {
  const totalHabits = habitsForDate.length;
  const completedCount = habitsForDate.filter((h) => h.completed).length;

  if (totalHabits === 0) {
    return (
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="font-medium text-white mb-3 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Habits
        </div>
        <div className="text-center text-gray-400 py-6">
          <svg
            className="w-8 h-8 mx-auto mb-2 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <p className="text-sm">No habits tracked on this date</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-700/50 rounded-lg p-4">
      <div className="font-medium text-white mb-3 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Habits
      </div>

      {/* Progress Summary */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-300 text-sm">Progress:</span>
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{
                width: `${
                  totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Habit List */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {habitsForDate
          .sort((a, b) => {
            // First sort by completion status (completed first)
            if (a.completed !== b.completed) {
              return b.completed ? 1 : -1;
            }
            // Then sort by favorite status (favorites first within each group)
            if (a.habit.isFavorite !== b.habit.isFavorite) {
              return a.habit.isFavorite ? -1 : 1;
            }
            // Finally sort alphabetically
            return a.habit.name.localeCompare(b.habit.name);
          })
          .map(({ habit, completed, wasActive }) => {
            const handleToggle = async () => {
              if (!isDateReadOnly(selectedDate)) {
                await onToggleHabit(selectedDate, habit.id.toString(), !completed);
              }
            };

            return (
              <div
                key={habit.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  completed
                    ? "border border-green-500/20"
                    : "border border-red-500/20"
                } ${
                  !isDateReadOnly(selectedDate)
                    ? "cursor-pointer hover:opacity-80"
                    : "opacity-70"
                }`}
                style={{
                  backgroundColor: completed ? "#2A4347" : "#413544",
                }}
                onClick={handleToggle}
              >
                <div className="flex items-center gap-3">
                  <>
                    {completed ? (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "#02C951" }}
                      >
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "#FA2C37" }}
                      >
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </div>
                    )}
                  </>
                  <div className="flex flex-col">
                    <span className="text-white text-sm">{habit.name}</span>
                    {!wasActive && (
                      <span className="text-xs text-gray-400">
                        Was inactive on this date
                      </span>
                    )}
                  </div>
                  {habit.isFavorite && (
                    <svg
                      className="w-3 h-3 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
} 