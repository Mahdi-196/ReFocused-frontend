'use client';

import { AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode, memo } from 'react';
import ClientOnly from './ClientOnly';

interface AnimatedLayoutProps {
  children: ReactNode;
}

function AnimatedLayout({ children }: AnimatedLayoutProps) {
  const pathname = usePathname();

  return (
    <ClientOnly fallback={<div>{children}</div>}>
      <AnimatePresence mode="wait" initial={false}>
        <div key={pathname}>
          {children}
        </div>
      </AnimatePresence>
    </ClientOnly>
  );
}

export default memo(AnimatedLayout); 