'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';

export default function PerformanceMonitor() {
  useReportWebVitals((metric) => {
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance Metric:', {
        name: metric.name,
        value: metric.value,
        id: metric.id,
        delta: metric.delta,
      });
    }
    
    // You can send metrics to analytics services here
    // Example: sendToAnalytics(metric);
  });

  useEffect(() => {
    // Monitor memory usage in development
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        if (memory) {
          console.log('🧠 Memory Usage:', {
            used: `${Math.round(memory.usedJSHeapSize / 1048576)} MB`,
            total: `${Math.round(memory.totalJSHeapSize / 1048576)} MB`,
            limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)} MB`,
          });
        }
      };

      // Check memory every 30 seconds in development
      const interval = setInterval(checkMemory, 30000);
      checkMemory(); // Initial check

      return () => clearInterval(interval);
    }
  }, []);

  // This component doesn't render anything visible
  return null;
} 