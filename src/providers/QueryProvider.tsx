'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export default function QueryProvider({ children }: { children: ReactNode }) {
  // Create a client instance per component mount to avoid sharing state between requests
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data for 5 minutes by default
            staleTime: 5 * 60 * 1000,
            // Keep unused data in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Retry failed requests twice
            retry: 2,
            // Don't refetch on window focus by default (can be overridden per query)
            refetchOnWindowFocus: false,
            // Refetch on mount only if data is stale
            refetchOnMount: true,
            // Refetch on reconnect only if data is stale
            refetchOnReconnect: true,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
