"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type TutorialTrigger = 'signup' | 'google';

interface TutorialOverlayProps {
  isOpen: boolean;
  trigger: TutorialTrigger;
  onClose: () => void;
}

interface HighlightTargetConfig {
  id: string;
  fallbackCenter?: boolean;
}

// Compute a rounded highlight box around a DOM element by id
function useHighlightRect(targetId: string | null) {
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    function compute() {
      if (!targetId) {
        setRect(null);
        return;
      }
      let el: HTMLElement | null = null;
      if (targetId === 'header-logo') {
        el = (document.getElementById('header-logo-desktop') as HTMLElement | null) || (document.getElementById('header-logo-mobile') as HTMLElement | null);
      } else {
        el = document.getElementById(targetId) as HTMLElement | null;
      }
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      // Use viewport coordinates so the highlight stays anchored on screen while scrolling
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }

    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, { passive: true });
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute as EventListener);
    };
  }, [targetId]);

  return rect;
}

const stepsForSignup: Array<{ title: string; body: React.ReactNode; target?: HighlightTargetConfig }> = [
  {
    title: 'Welcome to ReFocused',
    body: (
      <div className="text-gray-200 text-sm">
        <p className="mb-3">Here are your five main pages:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="mb-1">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs bg-gradient-to-r from-[#42b9e5]/20 to-[#4f83ed]/20 text-[#e7f7ff] border border-[#42b9e5]/30">
                Home
              </span>
            </div>
            <div className="text-gray-300">your dashboard and daily content</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="mb-1">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs bg-gradient-to-r from-[#42b9e5]/20 to-[#4f83ed]/20 text-[#e7f7ff] border border-[#42b9e5]/30">
                Track
              </span>
            </div>
            <div className="text-gray-300">habits, moods, and calendar</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="mb-1">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs bg-gradient-to-r from-[#42b9e5]/20 to-[#4f83ed]/20 text-[#e7f7ff] border border-[#42b9e5]/30">
                Study
              </span>
            </div>
            <div className="text-gray-300">flashcards and Pomodoro</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="mb-1">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs bg-gradient-to-r from-[#42b9e5]/20 to-[#4f83ed]/20 text-[#e7f7ff] border border-[#42b9e5]/30">
                Journal
              </span>
            </div>
            <div className="text-gray-300">secure entries and collections</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:col-span-2 flex flex-col items-center text-center">
            <div className="mb-1">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs bg-gradient-to-r from-[#42b9e5]/20 to-[#4f83ed]/20 text-[#e7f7ff] border border-[#42b9e5]/30">
                Relax
              </span>
            </div>
            <div className="text-gray-300">breathing, meditation, and ambient sounds</div>
          </div>
        </div>
      </div>
    ),
    target: { id: 'header-nav-list', fallbackCenter: true },
  },
  {
    title: 'ReFocused AI',
    body: (
      <div className="text-gray-200 text-sm">
        <p className="mb-1">Hover the logo to see it glow. Click it anytime to open the AI assistant.</p>
      </div>
    ),
    target: { id: 'header-logo', fallbackCenter: true },
  },
  {
    title: 'Profile & Settings',
    body: (
      <div className="text-gray-200 text-sm">
        <p>Access your profile, audio, and account settings from here.</p>
      </div>
    ),
    target: { id: 'profile-button', fallbackCenter: true },
  },
];

const stepsForGoogle = stepsForSignup; // Same tour content for first Google login

export default function TutorialOverlay({ isOpen, trigger, onClose }: TutorialOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const steps = useMemo(() => (trigger === 'google' ? stepsForGoogle : stepsForSignup), [trigger]);
  const targetId = steps[stepIndex]?.target?.id ?? null;
  const rect = useHighlightRect(targetId);

  useEffect(() => {
    if (!isOpen) {
      setStepIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    // Emphasize the logo while on that step; remove when leaving the step.
    // Also trigger the hover effect that reveals " AI" visually.
    if (!isOpen) return;
    const currentTarget = steps[stepIndex]?.target?.id;
    if (currentTarget === 'header-logo') {
      const aiSpan = (document.getElementById('logo-ai-desktop') as HTMLElement | null) || (document.getElementById('logo-ai-mobile') as HTMLElement | null);
      if (aiSpan) {
        aiSpan.classList.add('opacity-100', 'scale-x-100');
      }
      return () => {
        if (aiSpan) aiSpan.classList.remove('opacity-100', 'scale-x-100');
      };
    }
  }, [isOpen, stepIndex, steps]);

  // While tutorial is open, page interactions are blocked by the overlay.

  const next = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      onClose();
    }
  };

  const prev = () => {
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[10000] pointer-events-auto"
          aria-live="polite"
        >
          {/* Dim background */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Highlight box */}
          {rect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-none fixed border-2 border-[#42b9e5]/70 rounded-xl shadow-[0_0_30px_rgba(66,185,229,0.35)]"
              style={{ top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 }}
            />
          )}

          {/* Centered Callout card */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-[min(92vw,560px)] bg-gradient-to-br from-[#10182B] to-[#0c1324] border border-gray-700/50 rounded-2xl p-5 shadow-2xl pointer-events-auto"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="text-white text-lg font-semibold mb-1">{steps[stepIndex].title}</h3>
                  <div>{steps[stepIndex].body}</div>
                </div>
                <button
                  aria-label="Close tutorial"
                  onClick={onClose}
                  className="shrink-0 ml-2 px-2 py-1 text-sm text-gray-300 hover:text-white rounded-md hover:bg-white/10"
                >
                  Skip
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-gray-400">Step {stepIndex + 1} of {steps.length}</div>
                <div className="flex gap-2">
                  <button
                    onClick={prev}
                    disabled={stepIndex === 0}
                    className="px-3 py-1.5 rounded-md text-sm disabled:opacity-40 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 text-gray-200"
                  >
                    Back
                  </button>
                  <button
                    onClick={next}
                    className="px-3 py-1.5 rounded-md text-sm bg-gradient-to-r from-[#42b9e5] to-[#4f83ed] text-white"
                  >
                    {stepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


