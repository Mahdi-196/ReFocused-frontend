/**
 * Time System TypeScript Interfaces
 */

export interface BackendTimeResponse {
  user_current_date: string;           // "2025-06-23"
  user_current_datetime: string;       // "2025-06-23T14:30:45"
  user_timezone: string;               // "America/New_York"
  utc_datetime: string;                // "2025-06-23T18:30:45Z"
  is_mock_date: boolean;               // true for development
  day_of_week: string;                 // "Monday"
  week_number: number;                 // 26
  is_weekend: boolean;                 // false
  day_boundaries: {
    start_utc: string;                 // "2025-06-23T04:00:00Z"
    end_utc: string;                   // "2025-06-24T04:00:00Z"
  };
}

export interface TimezoneInfo {
  name: string;                        // "America/New_York"
  current_time: string;                // "2025-06-23T14:30:45"
  offset: string;                      // "-04:00"
  display_name: string;                // "Eastern Daylight Time"
}

export interface WeekInfo {
  week_start: string;                  // "2025-06-22"
  week_end: string;                    // "2025-06-28"
  week_number: number;                 // 26
  days_in_week: string[];              // ["2025-06-22", "2025-06-23", ...]
}

export interface TimeSyncCheck {
  is_synchronized: boolean;
  time_difference_seconds: number;
  recommendation: string;
  backend_time: string;
  frontend_time: string;
}

export interface TimezoneDetectionRequest {
  browser_timezone: string;
  language: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface TimezoneUpdateRequest {
  timezone: string;
  method: 'manual' | 'auto_detected';
}

export interface DayChangeEvent {
  oldDate: string;
  newDate: string;
  timezone: string;
}

export type TimeFilter = 'D' | 'W' | 'M';

export interface TimeServiceState {
  currentTime: BackendTimeResponse | null;
  lastSync: number | null;
  isOnline: boolean;
  syncInProgress: boolean;
  syncErrors: number;
  isReady: boolean;
} 