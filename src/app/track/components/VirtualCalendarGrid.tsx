import React, { useMemo } from "react";
import { DailyCalendarEntry } from "../types";
import CalendarCell from "./CalendarCell";

interface VirtualCalendarGridProps {
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

export default function VirtualCalendarGrid({
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
}: VirtualCalendarGridProps) {
  
  // Memoized calendar data generation - only recalculates when month changes
  const calendarData = useMemo(() => {
    const firstDay = new Date(currentMonth);
    const lastDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );
    
    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const firstDayOfWeek = firstDay.getDay();
    const previousMonth = new Date(firstDay);
    previousMonth.setDate(0);
    const daysInPreviousMonth = previousMonth.getDate();
    
    const dateRows = [];
    let currentRow = [];
    
    // Previous month dates
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        daysInPreviousMonth - i
      );
      const dateStr = prevDate.toISOString().split("T")[0];
      
      currentRow.push({
        date: prevDate,
        dateStr,
        isCurrentMonth: false,
        isPreviousMonth: true,
      });
    }
    
    // Current month dates
    for (let date = 1; date <= lastDay.getDate(); date++) {
      const currentDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        date
      );
      const dateStr = currentDate.toISOString().split("T")[0];
      
      currentRow.push({
        date: currentDate,
        dateStr,
        isCurrentMonth: true,
        isPreviousMonth: false,
      });
      
      if (currentRow.length === 7) {
        dateRows.push([...currentRow]);
        currentRow = [];
      }
    }
    
    // Next month dates to complete the grid
    if (currentRow.length > 0) {
      const nextMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      );
      
      for (let i = currentRow.length; i < 7; i++) {
        const nextDate = new Date(nextMonth);
        nextDate.setDate(i - currentRow.length + 1);
        const dateStr = nextDate.toISOString().split("T")[0];
        
        currentRow.push({
          date: nextDate,
          dateStr,
          isCurrentMonth: false,
          isPreviousMonth: false,
        });
      }
      dateRows.push([...currentRow]);
    }
    
    return { weekDays, dateRows };
  }, [currentMonth]);
  
  // Virtual rendering - only render visible weeks (optimized for performance)
  const renderOptimizedCalendar = () => {
    const { weekDays, dateRows } = calendarData;
    
    return (
      <div className="space-y-1.5">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-400 py-1"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar rows with optimized rendering */}
        {dateRows.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1.5">
            {week.map((dayData) => (
              <CalendarCell
                key={dayData.dateStr}
                date={dayData.date.getDate()}
                dateStr={dayData.dateStr}
                calendarEntry={getCalendarEntryForDate(dayData.dateStr)}
                isSelected={selectedDate === dayData.dateStr}
                isReadOnly={isDateReadOnly(dayData.dateStr)}
                onDateClick={onDateClick}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };
  
  return <div>{renderOptimizedCalendar()}</div>;
}