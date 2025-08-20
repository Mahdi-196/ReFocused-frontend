'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getCurrentUserScope } from '@/utils/scopedStorage';

interface AudioContextType {
  isGloballyMuted: boolean;
  toggleGlobalMute: () => void;
  setGlobalMute: (muted: boolean) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isGloballyMuted, setIsGloballyMuted] = useState<boolean>(false);

  // Load global mute state from localStorage on mount
  useEffect(() => {
    try {
      const savedMuteState = localStorage.getItem(`refocused_global_mute:${getCurrentUserScope()}`);
      if (savedMuteState !== null) {
        setIsGloballyMuted(savedMuteState === 'true');
      }
    } catch (error) {
      console.error('Failed to load global mute state:', error);
    }
  }, []);

  // Save global mute state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(`refocused_global_mute:${getCurrentUserScope()}`, isGloballyMuted.toString());
      
      // Dispatch custom event to notify all components about mute state change
      window.dispatchEvent(new CustomEvent('globalMuteChanged', {
        detail: { isGloballyMuted }
      }));
    } catch (error) {
      console.error('Failed to save global mute state:', error);
    }
  }, [isGloballyMuted]);

  const toggleGlobalMute = useCallback(() => {
    setIsGloballyMuted(prev => !prev);
  }, []);

  const setGlobalMute = useCallback((muted: boolean) => {
    setIsGloballyMuted(muted);
  }, []);

  const contextValue = useMemo(() => ({
    isGloballyMuted,
    toggleGlobalMute,
    setGlobalMute
  }), [isGloballyMuted, toggleGlobalMute, setGlobalMute]);

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
}

export function useGlobalAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useGlobalAudio must be used within an AudioProvider');
  }
  return context;
}