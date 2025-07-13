import React from "react";
import { DailyCalendarEntry } from "../types";
import CalendarCell from "./CalendarCell";

interface CalendarGridProps {
  currentMonth: Date;
  selectedDate: string | null;
  calendarEntries: DailyCalendarEntry[];
  onDateClick: (dateStr: string) => void;
  isDateReadOnly: (dateStr: string) => boolean;
  getCalendarEntryForDate: (dateStr: string) => DailyCalendarEntry | null;
  touchStart: number | null;
  setTouchStart: (value: number | null) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export default function CalendarGrid({
  currentMonth,
  selectedDate,
  calendarEntries,
  onDateClick,
  isDateReadOnly,
  getCalendarEntryForDate,
  touchStart,
  setTouchStart,
  onTouchStart,
  onTouchEnd,
}: CalendarGridProps) {
  const renderCalendar = () => {
    const firstDay = new Date(currentMonth);
    const lastDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );
    const days = [];
    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    // Week day headers
    days.push(
      <div key="weekdays" className="grid grid-cols-7 gap-1.5 mb-1.5">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-400 py-1"
          >
            {day}
          </div>
        ))}
      </div>
    );

    const firstDayOfWeek = firstDay.getDay();
    const previousMonth = new Date(firstDay);
    previousMonth.setDate(0);
    const daysInPreviousMonth = previousMonth.getDate();

    const dateRows = [];
    let currentRow = [];

    // Previous month trailing days
    for (let i = 0; i < firstDayOfWeek; i++) {
      const date = daysInPreviousMonth - firstDayOfWeek + i + 1;
      currentRow.push(
        <div
          key={`prev-${date}`}
          className="aspect-square flex items-center justify-center text-gray-500 bg-gray-800 rounded text-xs"
        >
          {date}
        </div>
      );
    }

    // Current month days
    for (let date = 1; date <= lastDay.getDate(); date++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(
        currentMonth.getMonth() + 1
      ).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
      
      const calendarEntry = getCalendarEntryForDate(dateStr);
      const isReadOnly = isDateReadOnly(dateStr);
      const isSelected = selectedDate === dateStr;

      currentRow.push(
        <CalendarCell
          key={date}
          date={date}
          dateStr={dateStr}
          calendarEntry={calendarEntry}
          isSelected={isSelected}
          isReadOnly={isReadOnly}
          onDateClick={onDateClick}
        />
      );

      if (currentRow.length === 7) {
        dateRows.push(
          <div
            key={`row-${dateRows.length}`}
            className="grid grid-cols-7 gap-1.5"
          >
            {currentRow}
          </div>
        );
        currentRow = [];
      }
    }

    // Next month leading days
    const remainingCells = 7 - currentRow.length;
    if (remainingCells < 7) {
      for (let i = 1; i <= remainingCells; i++) {
        currentRow.push(
          <div
            key={`next-${i}`}
            className="aspect-square flex items-center justify-center text-gray-500 bg-gray-800 rounded text-xs"
          >
            {i}
          </div>
        );
      }
      dateRows.push(
        <div
          key={`row-${dateRows.length}`}
          className="grid grid-cols-7 gap-1.5"
        >
          {currentRow}
        </div>
      );
    }

    return (
      <div className="p-6">
        {days}
        {dateRows}
      </div>
    );
  };

  return (
    <div
      className="flex-1 select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {renderCalendar()}
    </div>
  );
} 