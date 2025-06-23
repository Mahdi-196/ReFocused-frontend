# 🕰️ Frontend Time System Integration Guide (TypeScript)

## 🎯 Overview

This comprehensive TypeScript implementation provides a robust, backend-synchronized time system that replaces your current date utilities with a single source of truth.

## 🏗️ Architecture

### Core Components
- **`src/types/time.ts`** - TypeScript interfaces for all time-related data
- **`src/services/timeService.ts`** - Main time service singleton 
- **`src/contexts/TimeContext.tsx`** - React context and hooks
- **`src/components/TimeSystemComponents.tsx`** - Example components

## 🚀 Quick Start Integration

### 1. Add TimeProvider to Your App Root

```tsx
// src/app/layout.tsx or your main App component
import { TimeProvider } from '@/contexts/TimeContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TimeProvider>
          {/* Your existing providers */}
          <AuthProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </AuthProvider>
        </TimeProvider>
      </body>
    </html>
  );
}
```

### 2. Update Your Habit Components

```tsx
// ✅ NEW WAY - Using the time system
import { useCurrentDate, useTime } from '@/contexts/TimeContext';

const HabitComponent: React.FC<{ habitId: number }> = ({ habitId }) => {
  const getCurrentDate = useCurrentDate();
  const { timeData } = useTime();

  const markComplete = async () => {
    // ✅ Always use backend date
    const completionDate = getCurrentDate();
    
    const response = await fetch(`/api/v1/habits/${habitId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        completed_date: completionDate  // Backend-synchronized date
      })
    });
  };

  return (
    <div>
      <h3>Today: {timeData?.user_current_date}</h3>
      <p>Timezone: {timeData?.user_timezone}</p>
      <button onClick={markComplete}>Mark Complete</button>
    </div>
  );
};
```

```tsx
// ❌ OLD WAY - Manual date handling
const OldHabitComponent = () => {
  const markComplete = async () => {
    // ❌ Don't do this anymore
    const date = new Date().toISOString().split('T')[0];
    // ... rest of component
  };
};
```

## 📋 Migration Checklist

### Step 1: Replace Date Utilities

**Before:**
```tsx
// src/utils/dateUtils.ts (OLD)
export function getCurrentDate(): Date {
  const mockDateStr = localStorage.getItem('dev-mock-date');
  if (mockDateStr) {
    return new Date(mockDateStr);
  }
  return new Date();
}
```

**After:**
```tsx
// Use the new time service
import { timeService } from '@/services/timeService';

// Simply call:
const currentDate = timeService.getCurrentDate(); // Returns YYYY-MM-DD string
```

### Step 2: Update Service Functions

**Before:**
```tsx
// OLD: Manual date in services
export async function markHabitCompletion(habitId: number) {
  const today = new Date().toISOString().split('T')[0]; // ❌ Local date
  
  await client.post(`/habits/${habitId}/complete`, {
    completed_date: today
  });
}
```

**After:**
```tsx
// NEW: Backend-synchronized date
import { timeService } from '@/services/timeService';

export async function markHabitCompletion(habitId: number) {
  const today = timeService.getCurrentDate(); // ✅ Backend date
  
  await client.post(`/habits/${habitId}/complete`, {
    completed_date: today
  });
}
```

### Step 3: Update React Components

**Before:**
```tsx
// OLD: Manual date handling in components
const Component = () => {
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  
  useEffect(() => {
    // Manual date sync logic
  }, []);
};
```

**After:**
```tsx
// NEW: Use time hooks
import { useCurrentDate, useTime } from '@/contexts/TimeContext';

const Component = () => {
  const currentDate = useCurrentDate(); // Always synced
  const { timeData, loading, error } = useTime();
  
  // Automatic sync, error handling, timezone support
};
```

## 🔧 Advanced Usage Patterns

### Date Range Analytics

```tsx
import { useTime } from '@/contexts/TimeContext';

const AnalyticsComponent = () => {
  const { getDateRange } = useTime();
  
  const [filter, setFilter] = useState<'D' | 'W' | 'M'>('D');
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    const loadStats = async () => {
      const range = getDateRange(filter);
      
      const response = await fetch(`/api/v1/statistics?start=${range.start}&end=${range.end}`);
      const data = await response.json();
      setStats(data);
    };
    
    loadStats();
  }, [filter, getDateRange]);
  
  return (
    <div>
      <select value={filter} onChange={(e) => setFilter(e.target.value as 'D' | 'W' | 'M')}>
        <option value="D">Daily</option>
        <option value="W">Weekly</option>
        <option value="M">Monthly</option>
      </select>
      
      {/* Stats display using backend-synchronized dates */}
    </div>
  );
};
```

### Timezone Management

```tsx
import { useTimezone } from '@/contexts/TimeContext';

const TimezoneSettings = () => {
  const { 
    getUserTimezone, 
    detectAndSetTimezone, 
    updateUserTimezone, 
    getAvailableTimezones 
  } = useTimezone();
  
  const handleAutoDetect = async () => {
    const success = await detectAndSetTimezone();
    if (success) {
      alert('Timezone updated!');
      // All components will automatically sync
    }
  };
  
  return (
    <div>
      <p>Current: {getUserTimezone()}</p>
      <button onClick={handleAutoDetect}>Auto-Detect Timezone</button>
    </div>
  );
};
```

### Day Change Handling

```tsx
import { useEffect } from 'react';

const HabitStreakComponent = () => {
  const { getCurrentDate } = useTime();
  
  useEffect(() => {
    const handleDayChange = (event: CustomEvent) => {
      console.log('Day changed!', event.detail);
      
      // Refresh habit data, reset daily counts, etc.
      refreshHabitData();
      clearDailyCache();
    };
    
    window.addEventListener('dayChanged', handleDayChange as EventListener);
    
    return () => {
      window.removeEventListener('dayChanged', handleDayChange as EventListener);
    };
  }, []);
  
  // Component automatically gets new date when day changes
};
```

## 🔄 Service Updates Required

### Update Statistics Service

```tsx
// src/services/statisticsService.ts
import { timeService } from './timeService';

class StatisticsService {
  async getFilteredStats(filter: 'D' | 'W' | 'M') {
    // ✅ Use backend date ranges
    const dateRange = timeService.getDateRange(filter);
    
    const response = await client.get('/statistics', {
      params: {
        start: dateRange.start,
        end: dateRange.end
      }
    });
    
    return response.data;
  }
  
  private getCacheKey(filter: 'D' | 'W' | 'M'): string {
    // ✅ Use backend date for cache keys
    const today = timeService.getCurrentDate();
    return `statistics_${filter}_${today}`;
  }
}
```

### Update Mood Service

```tsx
// src/services/moodService.ts
import { timeService } from './timeService';

export async function getMoodForToday() {
  // ✅ Use backend date
  const today = timeService.getCurrentDate();
  
  const response = await client.get(`/mood/${today}`);
  return response.data;
}

export async function saveMoodEntry(mood: number) {
  // ✅ Use backend date
  const today = timeService.getCurrentDate();
  
  const response = await client.post('/mood', {
    date: today,
    mood
  });
  
  return response.data;
}
```

### Update Dashboard Service

```tsx
// src/services/dashboardService.ts
import { timeService } from './timeService';

export async function getDailyEntries(month: string) {
  // ✅ Month calculation uses backend time
  const currentDate = timeService.getCurrentDate();
  const targetMonth = month || currentDate.slice(0, 7); // YYYY-MM
  
  const response = await client.get(`/dashboard/entries`, {
    params: { month: targetMonth }
  });
  
  return response.data;
}
```

## 🧪 Development & Testing

### Mock Date Testing (Development Only)

The system automatically supports mock dates for testing:

```tsx
// Your existing dev tools can still use mock dates
localStorage.setItem('dev-mock-date', '2024-12-25T00:00:00.000Z');

// The time service will automatically detect and use the mock date
// All components will sync to December 25, 2024
```

### Debug Information

```tsx
import { useTime } from '@/contexts/TimeContext';

const DebugComponent = () => {
  const { getServiceState, checkSyncStatus } = useTime();
  
  const showDebugInfo = async () => {
    const state = getServiceState();
    const syncStatus = await checkSyncStatus();
    
    console.log('Time Service State:', state);
    console.log('Sync Status:', syncStatus);
  };
  
  return <button onClick={showDebugInfo}>Debug Time System</button>;
};
```

## 🎯 API Endpoints Integration

### Core Endpoint: `/api/v1/time/current`

This is your single source of truth:

```tsx
// The time service automatically calls this
// Response format:
interface BackendTimeResponse {
  user_current_date: string;        // "2025-06-23"
  user_current_datetime: string;    // "2025-06-23T14:30:45"
  user_timezone: string;            // "America/New_York"
  utc_datetime: string;             // "2025-06-23T18:30:45Z"
  is_mock_date: boolean;            // true for development
  day_of_week: string;              // "Monday"
  week_number: number;              // 26
  is_weekend: boolean;              // false
  day_boundaries: {
    start_utc: string;              // "2025-06-23T04:00:00Z"
    end_utc: string;                // "2025-06-24T04:00:00Z"
  };
}
```

### Other Endpoints

- **`/api/v1/time/timezone`** - Update user timezone
- **`/api/v1/time/detect`** - Auto-detect timezone
- **`/api/v1/time/timezones`** - Get available timezones
- **`/api/v1/time/week-info`** - Get week information
- **`/api/v1/time/sync-check`** - Check sync status

## 🚨 Error Handling

### Network Failures

```tsx
const { timeData, error, loading, syncTime } = useTime();

if (error) {
  return (
    <div className="error-banner">
      <p>Time sync error: {error}</p>
      <button onClick={syncTime}>Retry</button>
    </div>
  );
}

if (loading) {
  return <div>Synchronizing time...</div>;
}

// Use timeData safely
```

### Offline Support

```tsx
// The service automatically handles offline/online states
const { getServiceState } = useTime();

const serviceState = getServiceState();
if (!serviceState.isOnline) {
  // Show offline indicator
  // Service will auto-sync when back online
}
```

## 📊 Performance Considerations

### Automatic Optimizations

- **5-minute sync interval** (configurable)
- **Intelligent caching** with automatic invalidation
- **Network failure retry** with exponential backoff
- **Minimal re-renders** with React optimization

### Manual Optimizations

```tsx
// Use specific hooks for better performance
import { useCurrentDate } from '@/contexts/TimeContext'; // Lightweight

// Instead of:
import { useTime } from '@/contexts/TimeContext'; // Full context

const Component = () => {
  const currentDate = useCurrentDate(); // Only gets date, no other data
  
  return <div>{currentDate}</div>;
};
```

## 🔄 Migration Timeline

### Phase 1: Install New System (Week 1)
- [ ] Add new time system files
- [ ] Update app root with TimeProvider
- [ ] Test time synchronization

### Phase 2: Update Core Services (Week 2)
- [ ] Update habits service
- [ ] Update statistics service  
- [ ] Update mood service
- [ ] Update dashboard service

### Phase 3: Update Components (Week 3)
- [ ] Update habit tracking components
- [ ] Update analytics components
- [ ] Update profile/settings components
- [ ] Add timezone selection

### Phase 4: Remove Old System (Week 4)
- [ ] Remove old dateUtils.ts
- [ ] Remove manual date calculations
- [ ] Clean up localStorage keys
- [ ] Update dev tools

## 🎉 Benefits After Migration

✅ **Single Source of Truth** - All dates come from backend  
✅ **Automatic Timezone Support** - Users see their local dates  
✅ **Mock Date Testing** - Seamless development testing  
✅ **Day Change Detection** - Automatic cache invalidation  
✅ **Network Resilience** - Offline support with auto-sync  
✅ **TypeScript Safety** - Full type coverage  
✅ **Performance Optimized** - Intelligent caching and sync  
✅ **Error Handling** - Graceful fallbacks and retry logic  

## 🆘 Troubleshooting

### Common Issues

**Time not syncing:**
```tsx
const { checkSyncStatus, syncTime } = useTime();

// Check sync status
const status = await checkSyncStatus();
console.log('Sync status:', status);

// Force sync
await syncTime();
```

**Component not updating:**
```tsx
// Make sure component is wrapped in TimeProvider
<TimeProvider>
  <YourComponent />
</TimeProvider>
```

**Mock date not working:**
```tsx
// Verify mock date format
localStorage.setItem('dev-mock-date', '2024-12-25T00:00:00.000Z'); // ✅ Correct
localStorage.setItem('dev-mock-date', '2024-12-25'); // ❌ Wrong format
```

This system provides a robust, production-ready time management solution that eliminates timezone issues and provides a consistent experience for all users worldwide! 