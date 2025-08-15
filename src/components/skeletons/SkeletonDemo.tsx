import React, { useState, useEffect } from 'react';

interface SkeletonDemoProps {
  children: React.ReactNode;
  skeleton: React.ReactNode;
  delay?: number; // milliseconds to show skeleton
  enabled?: boolean; // whether demo mode is enabled
  isLoading?: boolean; // actual loading state
}

export const SkeletonDemo: React.FC<SkeletonDemoProps> = ({
  children,
  skeleton,
  delay = 100, // Minimal delay for smooth transition
  enabled = false, // disabled by default for performance
  isLoading // leave undefined unless you want to control explicitly
}) => {
  const [showSkeleton, setShowSkeleton] = useState<boolean>(enabled || !!isLoading);

  useEffect(() => {
    // If we have an actual loading state, use that instead of demo mode
    if (typeof isLoading === 'boolean') {
      setShowSkeleton(isLoading);
      return;
    }

    // Otherwise, use demo mode if enabled
    if (!enabled) {
      setShowSkeleton(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, enabled, isLoading]);

  return showSkeleton ? <>{skeleton}</> : <>{children}</>;
}; 