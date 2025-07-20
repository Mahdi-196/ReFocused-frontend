"use client";

export class ProductivityLogger {
  private static prefix = '🎯 [PRODUCTIVITY]';
  
  static logDataFetch(source: string, data: any) {
    console.group(`${this.prefix} Data Fetch - ${source}`);
    console.log('Data:', data);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
  
  static logCalculation(type: string, input: any, output: any) {
    console.group(`${this.prefix} Calculation - ${type}`);
    console.log('Input:', input);
    console.log('Output:', output);
    console.groupEnd();
  }
  
  static logError(source: string, error: any) {
    console.group(`${this.prefix} ERROR - ${source}`);
    console.error('Error:', error);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
  
  static logPointsBreakdown(breakdown: {
    tasksDone: number;
    taskPoints: number;
    pomodoroSessions: number;
    pomodoroPoints: number;
    skippedHabits: number;
    habitPenalty: number;
    totalPoints: number;
  }) {
    console.group(`${this.prefix} Points Breakdown`);
    console.log('📋 Tasks:', `${breakdown.tasksDone} tasks = ${breakdown.taskPoints} points`);
    console.log('🍅 Pomodoros:', `${breakdown.pomodoroSessions} sessions = ${breakdown.pomodoroPoints} points`);
    console.log('❌ Habits:', `${breakdown.skippedHabits} skipped = ${breakdown.habitPenalty} penalty`);
    console.log('💯 Total:', `${breakdown.totalPoints} points`);
    console.groupEnd();
  }
  
  static logComponentState(componentName: string, state: any) {
    console.group(`${this.prefix} Component State - ${componentName}`);
    console.table(state);
    console.groupEnd();
  }
}

// Quick debug functions for global access
(window as any).debugProductivity = {
  logCurrentState: () => {
    const event = new CustomEvent('productivity-debug-log');
    window.dispatchEvent(event);
  },
  
  simulateTask: async () => {
    const { statisticsService } = await import('@/services/statisticsService');
    await statisticsService.incrementTasksDone();
    console.log('✅ Test task added via debug');
  },
  
  simulatePomodoro: async () => {
    const { statisticsService } = await import('@/services/statisticsService');
    await statisticsService.incrementSessions();
    await statisticsService.addFocusTime(25);
    console.log('🍅 Test pomodoro added via debug');
  }
};

export default ProductivityLogger; 