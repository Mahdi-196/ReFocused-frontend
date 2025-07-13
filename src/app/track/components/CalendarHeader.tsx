import React from "react";

interface CalendarHeaderProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
}

export default function CalendarHeader({
  currentMonth,
  setCurrentMonth,
}: CalendarHeaderProps) {
  const handlePreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  return (
    <div className="flex justify-between items-center px-6 py-3 border-b border-gray-600">
      <button
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors text-base text-white"
        onClick={handlePreviousMonth}
      >
        ←
      </button>
      <h3 className="text-lg font-medium text-white">
        {currentMonth.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })}
      </h3>
      <button
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors text-base text-white"
        onClick={handleNextMonth}
      >
        →
      </button>
    </div>
  );
} 