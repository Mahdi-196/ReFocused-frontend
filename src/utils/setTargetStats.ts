import { setStatistics } from '@/services/statisticsService';
import type { Statistics } from '@/services/statisticsService';

/**
 * Set the target statistics values as requested:
 * - Focus Time: 8h 21m (501 minutes)
 * - Sessions: 13
 * - Tasks Done: 16
 */
export async function setTargetStats(): Promise<Statistics> {
  const targetStats: Statistics = {
    focusTime: 501, // 8 hours 21 minutes = 8*60 + 21 = 501 minutes
    sessions: 13,
    tasksDone: 16
  };

  try {
    const result = await setStatistics(targetStats);
    console.log('✅ Target statistics set successfully:', {
      focusTime: `${Math.floor(result.focusTime / 60)}h ${result.focusTime % 60}m`,
      sessions: result.sessions,
      tasksDone: result.tasksDone
    });
    return result;
  } catch (error) {
    console.error('❌ Failed to set target statistics:', error);
    throw error;
  }
}

/**
 * Make this available globally for console access
 */
if (typeof window !== 'undefined') {
  // Extend window object for development tools
  Object.assign(window, { setTargetStats });
}

export default setTargetStats; 