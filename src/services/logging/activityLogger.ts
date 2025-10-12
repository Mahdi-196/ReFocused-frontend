import client from '@/api/client';
import { timeService } from '../timeService';

export interface ActivityLogEntry {
  id?: number;
  userId: number;
  date: string;
  activityType: 'pomodoro' | 'task' | 'habit' | 'mood' | 'journal' | 'meditation' | 'goal' | 'study' | 'app_open' | 'feature_use';
  activityDetails: any;
  timestamp: Date;
  metadata?: {
    duration?: number;
    quality?: number;
    category?: string;
    value?: number;
    tags?: string[];
  };
}

class ActivityLogger {
  private pendingLogs: ActivityLogEntry[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 5000; // 5 seconds
  private readonly MAX_BATCH_SIZE = 10;

  /**
   * Log a user activity
   */
  async logActivity(
    activityType: ActivityLogEntry['activityType'],
    activityDetails: any,
    metadata?: ActivityLogEntry['metadata']
  ): Promise<void> {
    try {
      const entry: ActivityLogEntry = {
        userId: 1, // Default user ID - would come from auth context in real app
        date: timeService.getCurrentDate(),
        activityType,
        activityDetails,
        timestamp: new Date(timeService.getCurrentDateTime()),
        metadata
      };

      // Add to pending batch
      this.pendingLogs.push(entry);

      // Send immediately if batch is full, otherwise wait for timeout
      if (this.pendingLogs.length >= this.MAX_BATCH_SIZE) {
        await this.flushLogs();
      } else {
        this.scheduleBatchSend();
      }

      console.log(`📝 Activity logged: ${activityType}`, activityDetails);
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  /**
   * Log pomodoro session completion
   */
  async logPomodoroSession(duration: number, completed: boolean): Promise<void> {
    await this.logActivity('pomodoro', {
      duration,
      completed,
      completedAt: timeService.getCurrentDateTime()
    }, {
      duration,
      quality: completed ? 5 : 3
    });
  }

  /**
   * Log task completion
   */
  async logTaskCompletion(taskName: string, category?: string): Promise<void> {
    await this.logActivity('task', {
      taskName,
      category,
      completedAt: timeService.getCurrentDateTime()
    }, {
      category,
      value: 1
    });
  }

  /**
   * Log habit completion
   */
  async logHabitCompletion(habitId: number, habitName: string, completed: boolean): Promise<void> {
    await this.logActivity('habit', {
      habitId,
      habitName,
      completed,
      completedAt: timeService.getCurrentDateTime()
    }, {
      value: completed ? 1 : 0,
      quality: completed ? 5 : 1
    });
  }

  /**
   * Log mood entry
   */
  async logMoodEntry(happiness: number, focus: number, stress: number): Promise<void> {
    await this.logActivity('mood', {
      happiness,
      focus,
      stress,
      entryDate: timeService.getCurrentDate()
    }, {
      quality: Math.round((happiness + focus + (6 - stress)) / 3)
    });
  }

  /**
   * Log journal entry
   */
  async logJournalEntry(entryLength: number, hasGratitude: boolean): Promise<void> {
    await this.logActivity('journal', {
      entryLength,
      hasGratitude,
      entryDate: timeService.getCurrentDate()
    }, {
      value: 1,
      quality: entryLength > 100 ? 5 : entryLength > 50 ? 4 : 3
    });
  }

  /**
   * Log meditation session
   */
  async logMeditationSession(duration: number, type: string): Promise<void> {
    await this.logActivity('meditation', {
      duration,
      type,
      completedAt: timeService.getCurrentDateTime()
    }, {
      duration,
      quality: duration >= 300 ? 5 : duration >= 120 ? 4 : 3 // 5+ min = quality 5
    });
  }

  /**
   * Log goal progress
   */
  async logGoalProgress(goalId: number, goalName: string, progress: number, isCompleted: boolean): Promise<void> {
    await this.logActivity('goal', {
      goalId,
      goalName,
      progress,
      isCompleted,
      updatedAt: timeService.getCurrentDateTime()
    }, {
      value: progress,
      quality: isCompleted ? 5 : Math.min(5, Math.floor(progress / 20) + 1)
    });
  }

  /**
   * Log study session
   */
  async logStudySession(studySetId: number, cardsStudied: number, duration: number): Promise<void> {
    await this.logActivity('study', {
      studySetId,
      cardsStudied,
      duration,
      completedAt: timeService.getCurrentDateTime()
    }, {
      duration,
      value: cardsStudied,
      quality: Math.min(5, Math.floor(cardsStudied / 5) + 1)
    });
  }

  /**
   * Log app usage
   */
  async logAppOpen(): Promise<void> {
    await this.logActivity('app_open', {
      timestamp: timeService.getCurrentDateTime(),
      date: timeService.getCurrentDate()
    });
  }

  /**
   * Log feature usage
   */
  async logFeatureUse(feature: string, details?: any): Promise<void> {
    await this.logActivity('feature_use', {
      feature,
      details,
      timestamp: timeService.getCurrentDateTime()
    }, {
      category: feature
    });
  }

  /**
   * Get activity summary for a date range
   */
  async getActivitySummary(startDate: string, endDate: string): Promise<{
    totalActivities: number;
    activeDays: number;
    activityBreakdown: { [key: string]: number };
  }> {
    try {
      const response = await client.get('/v1/activity/summary', {
        params: { start_date: startDate, end_date: endDate }
      });

      return response.data || {
        totalActivities: 0,
        activeDays: 0,
        activityBreakdown: {}
      };
    } catch (error) {
      console.error('Failed to get activity summary:', error);
      return {
        totalActivities: 0,
        activeDays: 0,
        activityBreakdown: {}
      };
    }
  }

  /**
   * Schedule batch send of logs
   */
  private scheduleBatchSend(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.flushLogs();
    }, this.BATCH_DELAY);
  }

  /**
   * Flush pending logs to server
   */
  private async flushLogs(): Promise<void> {
    if (this.pendingLogs.length === 0) return;

    try {
      const logsToSend = [...this.pendingLogs];
      this.pendingLogs = [];

      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
        this.batchTimeout = null;
      }

      await client.post('/v1/activity/batch', { activities: logsToSend });
      
      console.log(`📊 Sent ${logsToSend.length} activity logs to server`);
    } catch (error) {
      console.error('Failed to send activity logs:', error);
      // Re-add failed logs to pending queue
      this.pendingLogs.unshift(...this.pendingLogs);
    }
  }

  /**
   * Force flush all pending logs
   */
  async forceFush(): Promise<void> {
    await this.flushLogs();
  }
}

export const activityLogger = new ActivityLogger();
export default activityLogger; 