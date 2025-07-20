import { formatMonthId } from '@/types/monthlyProductivity';

export interface DateRange {
  start: Date;
  end: Date;
  startString: string;
  endString: string;
}

export interface MonthInfo {
  monthId: string;
  year: number;
  month: number;
  monthName: string;
  daysInMonth: number;
  startDate: Date;
  endDate: Date;
}

export class DateHelpers {
  static getCurrentMonthRange(): DateRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      start,
      end,
      startString: this.formatDateString(start),
      endString: this.formatDateString(end)
    };
  }

  static getMonthRange(year: number, month: number): DateRange {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    
    return {
      start,
      end,
      startString: this.formatDateString(start),
      endString: this.formatDateString(end)
    };
  }

  static getMonthRangeFromId(monthId: string): DateRange {
    const [year, month] = monthId.split('-').map(Number);
    return this.getMonthRange(year, month);
  }

  static getCurrentMonthInfo(): MonthInfo {
    const now = new Date();
    return this.getMonthInfo(now.getFullYear(), now.getMonth() + 1);
  }

  static getMonthInfo(year: number, month: number): MonthInfo {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const daysInMonth = endDate.getDate();
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return {
      monthId: formatMonthId(startDate),
      year,
      month,
      monthName: monthNames[month - 1],
      daysInMonth,
      startDate,
      endDate
    };
  }

  static getMonthInfoFromId(monthId: string): MonthInfo {
    const [year, month] = monthId.split('-').map(Number);
    return this.getMonthInfo(year, month);
  }

  static formatDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  static parseMonthId(monthId: string): { year: number; month: number } {
    const [year, month] = monthId.split('-').map(Number);
    return { year, month };
  }

  static isValidMonthId(monthId: string): boolean {
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(monthId)) return false;

    const { year, month } = this.parseMonthId(monthId);
    return year >= 2020 && year <= 2030 && month >= 1 && month <= 12;
  }

  static getPreviousMonth(monthId: string): string {
    const { year, month } = this.parseMonthId(monthId);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  }

  static getNextMonth(monthId: string): string {
    const { year, month } = this.parseMonthId(monthId);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
  }

  static getMonthsInRange(startMonthId: string, endMonthId: string): string[] {
    const months: string[] = [];
    let currentMonth = startMonthId;
    
    while (currentMonth <= endMonthId) {
      months.push(currentMonth);
      currentMonth = this.getNextMonth(currentMonth);
      
      if (months.length > 100) {
        break;
      }
    }
    
    return months;
  }

  static getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

  static isDateInMonth(date: Date, monthId: string): boolean {
    const { year, month } = this.parseMonthId(monthId);
    return date.getFullYear() === year && date.getMonth() === month - 1;
  }

  static getDateFromDayOfMonth(monthId: string, day: number): Date {
    const { year, month } = this.parseMonthId(monthId);
    return new Date(year, month - 1, day);
  }

  static getDayOfMonth(date: Date): number {
    return date.getDate();
  }

  static getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000);
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  static getWeeksInMonth(monthId: string): Array<{ week: number; startDate: Date; endDate: Date }> {
    const { year, month } = this.parseMonthId(monthId);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const weeks: Array<{ week: number; startDate: Date; endDate: Date }> = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const weekStart = new Date(currentDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      weeks.push({
        week: this.getWeekNumber(currentDate),
        startDate: weekStart,
        endDate: weekEnd
      });
      
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return weeks;
  }

  static getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  static getDayOfWeek(date: Date): 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    return days[date.getDay()];
  }

  static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  static getBusinessDaysInMonth(monthId: string): number {
    const { year, month } = this.parseMonthId(monthId);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    let businessDays = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      if (!this.isWeekend(currentDate)) {
        businessDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return businessDays;
  }

  static getActiveDaysInMonth(activityDates: Date[], monthId: string): number {
    const uniqueDays = new Set<string>();
    
    activityDates.forEach(date => {
      if (this.isDateInMonth(date, monthId)) {
        uniqueDays.add(this.formatDateString(date));
      }
    });
    
    return uniqueDays.size;
  }

  static getActivityStreakDays(activityDates: Date[], endDate: Date = new Date()): number {
    const sortedDates = activityDates
      .filter(date => date <= endDate)
      .sort((a, b) => b.getTime() - a.getTime());
    
    if (sortedDates.length === 0) return 0;
    
    const today = new Date(endDate);
    today.setHours(0, 0, 0, 0);
    
    let streakDays = 0;
    let currentDate = new Date(today);
    
    for (const activityDate of sortedDates) {
      const activityDay = new Date(activityDate);
      activityDay.setHours(0, 0, 0, 0);
      
      if (activityDay.getTime() === currentDate.getTime()) {
        streakDays++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (activityDay.getTime() < currentDate.getTime()) {
        const daysDiff = Math.floor((currentDate.getTime() - activityDay.getTime()) / (24 * 60 * 60 * 1000));
        if (daysDiff > 1) {
          break;
        }
        streakDays++;
        currentDate = new Date(activityDay);
        currentDate.setDate(currentDate.getDate() - 1);
      }
    }
    
    return streakDays;
  }

  static formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  static formatMonthYear(monthId: string): string {
    const { year, month } = this.parseMonthId(monthId);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[month - 1]} ${year}`;
  }
}