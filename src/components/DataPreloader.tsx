'use client';

import { useDataPreloader } from '@/hooks/useDataPreloader';

/**
 * Component that initializes data preloading for authenticated users
 * Must be placed inside AuthProvider context
 */
export default function DataPreloader() {
  useDataPreloader();
  return null; // This component doesn't render anything
}