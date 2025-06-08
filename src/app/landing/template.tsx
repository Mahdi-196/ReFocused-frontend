'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode } from 'react';

export default function Template({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
} 