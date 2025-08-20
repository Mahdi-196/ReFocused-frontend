"use client";

import React, { useEffect, useState } from 'react';
import TutorialOverlay from './TutorialOverlay';
import { tutorialService } from '@/api/services/tutorialService';

type TutorialTrigger = 'signup' | 'google';

export default function TutorialManager() {
  const [trigger, setTrigger] = useState<TutorialTrigger | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Only run on client
    const token = typeof window !== 'undefined' ? localStorage.getItem('REF_TOKEN') : null;
    if (!token) return;

    const init = async () => {
      try {
        // Prefer backend status
        const status = await tutorialService.getStatus();
        const userRaw = localStorage.getItem('REF_USER');
        const user = userRaw ? JSON.parse(userRaw) : null;
        const scope = String(user?.id || user?.email || 'user');

        // If backend says not completed for the method indicated by REF_TUTORIAL_TRIGGER, show it
        const storedTrigger = (localStorage.getItem('REF_TUTORIAL_TRIGGER') || '') as TutorialTrigger | '';
        if (storedTrigger === 'signup' && !status.signupCompleted) {
          setTrigger('signup');
          setOpen(true);
          return;
        }
        if (storedTrigger === 'google' && !status.googleCompleted) {
          setTrigger('google');
          setOpen(true);
          return;
        }

        // Fallback: if no trigger, check local flags only if backend didn't return true
        if (!status.signupCompleted) {
          const seenSignup = localStorage.getItem(`REF_TUTORIAL_SIGNUP_SEEN:${scope}`) === 'true';
          if (!seenSignup) {
            setTrigger('signup');
            setOpen(true);
            return;
          }
        }
        if (!status.googleCompleted) {
          const seenGoogle = localStorage.getItem(`REF_TUTORIAL_GOOGLE_SEEN:${scope}`) === 'true';
          if (!seenGoogle) {
            setTrigger('google');
            setOpen(true);
            return;
          }
        }
      } catch {
        // If backend unavailable, fall back to previous local logic
        const storedTrigger = (localStorage.getItem('REF_TUTORIAL_TRIGGER') || '') as TutorialTrigger | '';
        if (storedTrigger === 'signup' || storedTrigger === 'google') {
          setTrigger(storedTrigger);
          setOpen(true);
        }
      }
    };

    void init();
  }, []);

  const handleClose = () => {
    try {
      const userRaw = localStorage.getItem('REF_USER');
      const user = userRaw ? JSON.parse(userRaw) : null;
      const scope = String(user?.id || user?.email || 'user');

      if (trigger === 'signup') {
        localStorage.setItem(`REF_TUTORIAL_SIGNUP_SEEN:${scope}`, 'true');
        // Update backend
        void tutorialService.markCompleted('signup');
      } else if (trigger === 'google') {
        localStorage.setItem(`REF_TUTORIAL_GOOGLE_SEEN:${scope}`, 'true');
        // Update backend
        void tutorialService.markCompleted('google');
      }
    } catch {}

    localStorage.removeItem('REF_TUTORIAL_TRIGGER');
    setOpen(false);
    setTrigger(null);
  };

  if (!open || !trigger) return null;

  return (
    <TutorialOverlay isOpen={open} trigger={trigger} onClose={handleClose} />
  );
}


