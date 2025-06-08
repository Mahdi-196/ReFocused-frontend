'use client';

import { AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import PageTransition from './PageTransition';

interface AnimatedTransitionProps {
  children: ReactNode;
}

export default function AnimatedTransition({ children }: AnimatedTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={pathname}>
        {children}
      </PageTransition>
    </AnimatePresence>
  );
} 