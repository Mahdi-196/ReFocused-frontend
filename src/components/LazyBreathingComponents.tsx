'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Dynamically import all breathing components with loading fallbacks
export const BoxBreathing = dynamic(() => import('./breathing/BoxBreathing'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
});

export const StarBreathing = dynamic(() => import('./breathing/StarBreathing'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
});

export const LazyEightBreathing = dynamic(() => import('./breathing/LazyEightBreathing'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
});

export const BreatheThroughAnxiety = dynamic(() => import('./breathing/BreatheThroughAnxiety'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
});

export const BreatheInRelaxation = dynamic(() => import('./breathing/BreatheInRelaxation'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
});

export const AlternateNostrilBreathing = dynamic(() => import('./breathing/AlternateNostrilBreathing'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
});

export const BellyBreathing = dynamic(() => import('./breathing/BellyBreathing'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
});

export const ExtendedExhaleBreathing = dynamic(() => import('./breathing/ExtendedExhaleBreathing'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
});

export const DeepBreathing = dynamic(() => import('./breathing/DeepBreathing'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
});

export const FiveBreathCounting = dynamic(() => import('./breathing/FiveBreathCounting'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
});

// Also dynamically import other heavy components
export const MeditationTimer = dynamic(() => import('./MeditationTimer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
});

export const AmbientSounds = dynamic(() => import('./AmbientSounds'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
});

export const MultiAvatarSelector = dynamic(() => import('./MultiAvatarSelector'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
});

export const FeedbackModal = dynamic(() => import('./FeedbackModal'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-32">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
    </div>
  )
});

export const PomodoroTimer = dynamic(() => import('./pomodoro'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
}); 