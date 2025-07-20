# 🐛 ProductivityScore Debug Tools

## Overview
Debug tools to test the real data integration in the ProductivityScore component after removing mock data.

## Available Tools

### 1. 🎛️ Debug Panel (Visual Interface)
- **Location**: Bottom-right corner of the home page (development only)
- **Access**: Click the "🐛 Debug Panel" button

#### Features:
- **Overview Tab**: Current values and test buttons
- **Productivity Tab**: Monthly productivity service data
- **Statistics Tab**: Study statistics (tasks, pomodoros, focus time)
- **Habits Tab**: Habit tracking data and completion rates

#### Test Actions:
- ➕ **Add Test Task**: Increments task counter by 1
- 🍅 **Add Test Pomodoro**: Adds a 25-minute pomodoro session
- 🔄 **Refresh All Data**: Forces refresh of all data sources

### 2. 🖥️ Console Debugging

#### Automatic Logging:
The ProductivityScore component automatically logs:
- Data fetches from each service
- Points calculations breakdown
- Component state changes
- Errors and loading states

#### Manual Console Commands:
```javascript
// Log current state
debugProductivity.logCurrentState()

// Add test data
debugProductivity.simulateTask()
debugProductivity.simulatePomodoro()
```

### 3. 📊 Real-Time Data Monitoring

#### What to Watch:
1. **Productivity Score**: Should reflect monthly score (0-100+)
2. **Tasks Done**: Real task completions from statistics service
3. **Pomodoros**: Actual pomodoro sessions completed
4. **Habits**: Today's habit completion status

#### Points Calculation:
```
Total Points = (Tasks × 1) + (Pomodoros × 2) - (Skipped Habits × 1)
```

## Testing Workflow

### 1. Initial State Check
1. Open home page
2. Click debug panel
3. Check "Overview" tab for current values
4. Note any loading states or errors

### 2. Add Test Data
1. Use "Add Test Task" button
2. Watch for value updates in both debug panel and main component
3. Use "Add Test Pomodoro" button
4. Verify points calculation updates

### 3. Data Validation
1. Switch to "Statistics" tab
2. Verify time filter (D/W/M) affects data
3. Check "Productivity" tab for monthly score
4. Review "Habits" tab for habit tracking

### 4. Console Inspection
1. Open browser DevTools Console
2. Look for grouped logs with 🎯 [PRODUCTIVITY] prefix
3. Use `debugProductivity.logCurrentState()` for detailed state
4. Check for any error messages

## Common Issues & Solutions

### ❌ No Data Showing
- Check if user is authenticated
- Verify timeData context is loaded
- Look for API errors in console

### ❌ Values Not Updating
- Click "Refresh All Data" button
- Check network tab for API calls
- Verify localStorage has user data

### ❌ Loading States Stuck
- Check productivity/statistics hooks for errors
- Verify service endpoints are responding
- Clear browser cache/localStorage

### ❌ Points Calculation Wrong
- Check console for points breakdown logs
- Verify each data source (tasks, pomodoros, habits)
- Look for null/undefined values

## Debug Data Sources

| Component | Hook | Service | Data |
|-----------|------|---------|------|
| Productivity Score | `useMonthlyProductivity` | `monthlyProductivityService` | Overall score, tier, metrics |
| Tasks/Pomodoros | `useStatistics` | `statisticsService` | Daily/weekly/monthly stats |
| Habits | `useTrackingData` | `habitsService` | Completion status, streaks |

## Quick Test Commands

```javascript
// In browser console:

// 1. Check current state
debugProductivity.logCurrentState()

// 2. Add test activity
debugProductivity.simulateTask()
debugProductivity.simulatePomodoro()

// 3. Force component refresh
window.location.reload()
```

## Notes
- Debug tools only appear in development mode
- All logging is prefixed with 🎯 [PRODUCTIVITY]
- Real data updates may have slight delays
- Cache invalidation might be needed for fresh data 