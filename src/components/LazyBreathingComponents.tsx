'use client';

import dynamic from 'next/dynamic';
import { CardSkeleton } from './skeletons/CardSkeleton';

// Dynamically import all breathing components with loading fallbacks
export const BoxBreathing = dynamic(() => import('./breathing/BoxBreathing'), {
  ssr: false,
  loading: () => <CardSkeleton contentLines={5} />
});

export const StarBreathing = dynamic(() => import('./breathing/StarBreathing'), {
  ssr: false,
  loading: () => <CardSkeleton contentLines={5} />
});

export const LazyEightBreathing = dynamic(() => import('./breathing/LazyEightBreathing'), {
  ssr: false,
  loading: () => <CardSkeleton contentLines={5} />
});

export const BreatheThroughAnxiety = dynamic(() => import('./breathing/BreatheThroughAnxiety'), {
  ssr: false,
  loading: () => <CardSkeleton contentLines={5} />
});

export const BreatheInRelaxation = dynamic(() => import('./breathing/BreatheInRelaxation'), {
  ssr: false,
  loading: () => <CardSkeleton contentLines={5} />
});

export const AlternateNostrilBreathing = dynamic(() => import('./breathing/AlternateNostrilBreathing'), {
  ssr: false,
  loading: () => <CardSkeleton contentLines={5} />
});

export const BellyBreathing = dynamic(() => import('./breathing/BellyBreathing'), {
  ssr: false,
  loading: () => <CardSkeleton contentLines={5} />
});

export const ExtendedExhaleBreathing = dynamic(() => import('./breathing/ExtendedExhaleBreathing'), {
  ssr: false,
  loading: () => <CardSkeleton contentLines={5} />
});

export const DeepBreathing = dynamic(() => import('./breathing/DeepBreathing'), {
  ssr: false,
  loading: () => <CardSkeleton contentLines={5} />
});

export const FiveBreathCounting = dynamic(() => import('./breathing/FiveBreathCounting'), {
  ssr: false,
  loading: () => <CardSkeleton contentLines={5} />
});

// Also dynamically import other heavy components
export const MeditationTimer = dynamic(() => import('./MeditationTimer'), {
  ssr: false,
  loading: () => <CardSkeleton contentLines={6} />
});

export const AmbientSounds = dynamic(() => import('./AmbientSounds'), {
  ssr: false,
  loading: () => <CardSkeleton contentLines={4} />
});

export const MultiAvatarSelector = dynamic(() => import('./MultiAvatarSelector'), {
  ssr: false,
  loading: () => <CardSkeleton contentLines={3} />
});

export const FeedbackModal = dynamic(() => import('./FeedbackModal'), {
  ssr: false,
  loading: () => <CardSkeleton contentLines={2} showFooter={true} />
});

export const PomodoroTimer = dynamic(() => import('./pomodoro'), {
  ssr: false,
  loading: () => <CardSkeleton contentLines={6} />
}); 