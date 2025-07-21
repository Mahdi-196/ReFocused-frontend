"use client";

import React, { Component, ReactNode } from 'react';
// TODO: Implement error reporting and performance monitoring libs
// import { AppError, reportError } from '@/lib/errors';
// import { performanceMonitor } from '@/lib/performance';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorId: string, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  isolate?: boolean; // If true, only catches errors from direct children
  level?: 'page' | 'section' | 'component';
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    const { errorId } = this.state;

    // Create structured error for reporting
    const errorData = {
      message: error.message,
      type: 'REACT_ERROR',
      statusCode: 500,
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundaryLevel: level,
        errorId,
        route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      }
    };

    // Report error to monitoring systems
    // TODO: Implement error reporting
    // reportError(errorData, {
    //   errorInfo,
    //   errorBoundaryLevel: level,
    // });

    // Track error in performance monitoring
    // TODO: Implement performance monitoring
    // performanceMonitor.recordMetric({
    //   name: 'react_error',
    //   value: 1,
    //   timestamp: Date.now(),
    //   tags: {
    //     level,
    //     errorType: error.name,
    //     route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    //   },
    //   context: {
    //     message: error.message,
    //     errorId,
    //   },
    // });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // In development, log detailed error info
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary (${level})`);
      console.error('Error:', error);
      console.error('Error ID:', errorId);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });

    // Track retry attempts
    // TODO: Implement performance monitoring
    // performanceMonitor.recordMetric({
    //   name: 'error_boundary_retry',
    //   value: 1,
    //   timestamp: Date.now(),
    //   tags: {
    //     level: this.props.level || 'component',
    //     route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    //   },
    // });
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    const { hasError, error, errorId } = this.state;
    const { children, fallback, level = 'component' } = this.props;

    if (hasError && error && errorId) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, errorId, this.handleRetry);
      }

      // Default fallback UI based on error boundary level
      return this.renderDefaultFallback(error, errorId, level);
    }

    return children;
  }

  private renderDefaultFallback(error: Error, errorId: string, level: string) {
    const isPageLevel = level === 'page';
    const isSectionLevel = level === 'section';

    return (
      <div className={`
        flex flex-col items-center justify-center p-8 
        ${isPageLevel ? 'min-h-screen' : 'min-h-[200px]'}
        ${isSectionLevel ? 'bg-red-50 border border-red-200 rounded-lg' : ''}
      `}>
        <div className="text-center max-w-md">
          {/* Error Icon */}
          <div className="mx-auto mb-4">
            <svg
              className="w-16 h-16 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.351 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* Error Message */}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {isPageLevel ? 'Page Error' : 'Something went wrong'}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {isPageLevel 
              ? 'The page encountered an error and could not be displayed.'
              : 'This section encountered an error and could not be displayed.'
            }
          </p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Error Details (Dev Only)
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800">
                <p><strong>Error ID:</strong> {errorId}</p>
                <p><strong>Message:</strong> {error.message}</p>
                <p><strong>Type:</strong> {error.name}</p>
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            
            {isPageLevel && (
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            )}
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 mt-4">
            If this problem persists, please contact support with error ID: {errorId}
          </p>
        </div>
      </div>
    );
  }
}

// Higher-order component for easy error boundary wrapping
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WrappedWithErrorBoundary.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WrappedWithErrorBoundary;
};

// Specialized error boundaries for different app sections
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="page">
    {children}
  </ErrorBoundary>
);

export const SectionErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="section">
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="component">
    {children}
  </ErrorBoundary>
);

// Custom fallback components
export const MinimalErrorFallback: React.FC<{
  error: Error;
  errorId: string;
  retry: () => void;
}> = ({ retry }) => (
  <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded">
    <span className="text-red-600 text-sm mr-3">Error occurred</span>
    <button
      onClick={retry}
      className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
    >
      Retry
    </button>
  </div>
);

export const DetailedErrorFallback: React.FC<{
  error: Error;
  errorId: string;
  retry: () => void;
}> = ({ error, errorId, retry }) => (
  <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
    <h3 className="text-lg font-semibold text-red-800 mb-2">Component Error</h3>
    <p className="text-red-700 mb-4">{error.message}</p>
    <div className="flex gap-2">
      <button
        onClick={retry}
        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Retry
      </button>
      <span className="text-xs text-red-600 self-center">ID: {errorId}</span>
    </div>
  </div>
);

export default ErrorBoundary;