// Activity logging types

export interface ActivityLogEntry {
  id: string;
  userId: string;
  activityType: string;
  timestamp: Date;
  duration?: number;
  quality?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ActivitySession {
  id: string;
  userId: string;
  type: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  quality?: number;
  notes?: string;
}

export interface ActivitySummary {
  date: string;
  totalActivities: number;
  totalDuration: number;
  averageQuality: number;
  activitiesByType: Record<string, number>;
}