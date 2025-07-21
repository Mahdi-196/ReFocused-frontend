"use client";

import React, { useState, useEffect } from 'react';
// TODO: Implement performance monitoring lib
// import { performanceMonitor } from '@/lib/performance';
import { SectionErrorBoundary } from './ErrorBoundary';

interface PerformanceStats {
  [key: string]: {
    count: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  };
}

const PerformanceDashboard: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or when explicitly enabled
    const shouldShow = process.env.NODE_ENV === 'development' || 
                      process.env.NEXT_PUBLIC_SHOW_PERF_DASHBOARD === 'true';
    setIsVisible(shouldShow);

    if (!shouldShow) return;

    const updateStats = () => {
      // TODO: Implement performance monitoring
      // const summary = performanceMonitor.getPerformanceSummary();
      // setStats(summary as PerformanceStats);
      setStats({});
    };

    // Update stats every 10 seconds
    const interval = setInterval(updateStats, 10000);
    updateStats(); // Initial load

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  const formatValue = (value: number, suffix: string = 'ms') => {
    return `${Math.round(value)}${suffix}`;
  };

  const getStatusColor = (metricName: string, value: number) => {
    const thresholds: Record<string, { good: number; needs_improvement: number }> = {
      lcp: { good: 2500, needs_improvement: 4000 },
      fid: { good: 100, needs_improvement: 300 },
      cls: { good: 0.1, needs_improvement: 0.25 },
      fcp: { good: 1800, needs_improvement: 3000 },
      api_call: { good: 1000, needs_improvement: 3000 },
    };

    const threshold = thresholds[metricName];
    if (!threshold) return 'text-gray-600';

    if (value <= threshold.good) return 'text-green-600';
    if (value <= threshold.needs_improvement) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <SectionErrorBoundary>
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Performance</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Live</span>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(stats).map(([metric, data]) => {
              if (typeof data !== 'object' || !data.avg) return null;

              return (
                <div key={metric} className="text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700 capitalize">
                      {metric.replace(/_/g, ' ')}
                    </span>
                    <span className={`font-mono ${getStatusColor(metric, data.avg)}`}>
                      {formatValue(data.avg)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-gray-500 mt-1">
                    <span>P95: {formatValue(data.p95)}</span>
                    <span>Count: {data.count}</span>
                  </div>

                  {/* Visual indicator bar */}
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      className={`h-1 rounded-full ${
                        data.avg <= 1000 ? 'bg-green-500' :
                        data.avg <= 3000 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.min(100, (data.avg / 5000) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {Object.keys(stats).length === 0 && (
              <div className="text-xs text-gray-500 text-center py-2">
                No performance data yet
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Updated: {new Date().toLocaleTimeString()}</span>
              <button
                onClick={() => setIsVisible(false)}
                className="hover:text-gray-700 transition-colors"
              >
                Hide
              </button>
            </div>
          </div>
        </div>
      </div>
    </SectionErrorBoundary>
  );
};

export default PerformanceDashboard;