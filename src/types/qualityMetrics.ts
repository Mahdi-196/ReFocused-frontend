// Quality metrics types

export interface QualityMetric {
  activityType: string;
  qualityScore: number;
  date?: Date;
  userId?: string;
}