class AudioService {
  private currentAudio: HTMLAudioElement | null = null;
  private masterVolume: number = 0.7;
  private ambientVolume: number = 0.5;
  private notificationVolume: number = 0.8;
  private breathingVolume: number = 0.6;
  private isGloballyMuted: boolean = false;
  private isBrowser: boolean = false;

  // Preload audio files for better performance
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private notificationCache: Map<string, HTMLAudioElement> = new Map();
  
  // Track pending play promises to prevent race conditions
  private playingPromises: Map<HTMLAudioElement, Promise<void>> = new Map();
  private audioStates: Map<HTMLAudioElement, 'idle' | 'playing' | 'paused' | 'loading'> = new Map();

  constructor() {
    this.isBrowser = typeof window !== 'undefined' && typeof Audio !== 'undefined';
    if (this.isBrowser) {
      this.preloadAudioFiles();
      this.preloadNotificationSounds();
      this.initializeGlobalMuteListener();
    }
  }

  private initializeGlobalMuteListener() {
    if (!this.isBrowser) return;
    // Load initial global mute state
    try {
      const savedMuteState = localStorage.getItem('refocused_global_mute');
      if (savedMuteState !== null) {
        this.isGloballyMuted = savedMuteState === 'true';
      }
    } catch (error) {
      // ignore
    }

    // Listen for global mute state changes
    if (typeof window !== 'undefined') {
      window.addEventListener('globalMuteChanged', (event: Event) => {
        const customEvent = event as CustomEvent;
        this.isGloballyMuted = customEvent.detail.isGloballyMuted;
        
        if (this.currentAudio) {
          if (this.isGloballyMuted) {
            // Mute: pause current audio safely
            this.safePause(this.currentAudio);
          } else {
            // Unmute: resume current audio safely
            this.safePlay(this.currentAudio).catch(error => {
              console.error('Failed to resume audio after unmute:', error);
            });
          }
        }
        // Update volume of current audio
        this.updateCurrentAudioVolume();
      });
    }
  }

  private preloadAudioFiles() {
    if (!this.isBrowser) return;
    const soundIds = [
      'forest', 'ocean', 'rain', 'thunderstorm', 'wind',
      'birdsong', 'waterfall', 'fire', 'coffee', 'whitenoise'
    ];

    soundIds.forEach(soundId => {
      const audio = new Audio(`/audio/ambient/${soundId}.mp3`);
      audio.preload = 'auto';
      audio.loop = true;
      this.audioCache.set(soundId, audio);
      this.audioStates.set(audio, 'idle');
    });
  }

  private preloadNotificationSounds() {
    if (!this.isBrowser) return;
    const notificationIds = ['gentle-chime', 'soft-bell', 'zen-ding'];

    notificationIds.forEach(soundId => {
      const audio = new Audio(`/audio/notifications/${soundId}.mp3`);
      audio.preload = 'auto';
      audio.loop = false;
      this.notificationCache.set(soundId, audio);
      this.audioStates.set(audio, 'idle');
    });
  }

  // Safe play method that handles race conditions
  private async safePlay(audio: HTMLAudioElement): Promise<boolean> {
    if (!this.isBrowser) return false;
    try {
      // Check if there's already a pending play promise
      const existingPromise = this.playingPromises.get(audio);
      if (existingPromise) {
        // already playing/loading; wait for completion
        try {
          await existingPromise;
        } catch (error) {
          // Ignore errors from previous play attempts
        }
      }

      // Check current state
      const currentState = this.audioStates.get(audio);
      if (currentState === 'playing' || currentState === 'loading') {
        return true;
      }

      // Set state to loading
      this.audioStates.set(audio, 'loading');

      // Create and track the play promise
      const playPromise = audio.play();
      this.playingPromises.set(audio, playPromise);

      await playPromise;
      
      // Success - update state
      this.audioStates.set(audio, 'playing');
      this.playingPromises.delete(audio);
      
      return true;
    } catch (error) {
      // Clean up on error
      this.playingPromises.delete(audio);
      this.audioStates.set(audio, 'idle');
      
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      } else if (error instanceof Error && error.name === 'NotAllowedError') {
        return false;
      } else {
        return false;
      }
    }
  }

  // Safe pause method that handles ongoing play promises
  private safePause(audio: HTMLAudioElement): void {
    if (!this.isBrowser) return;
    try {
      // Cancel any pending play promise
      const pendingPromise = this.playingPromises.get(audio);
      if (pendingPromise) {
        this.playingPromises.delete(audio);
      }

      // Pause the audio
      audio.pause();
      this.audioStates.set(audio, 'paused');
    } catch (error) {
      console.error('Audio pause failed:', error);
    }
  }

  async playAmbientSound(soundId: string): Promise<boolean> {
    if (!this.isBrowser) return false;
    try {
      // Don't play if globally muted
      if (this.isGloballyMuted) {
        return false;
      }

      // Stop current audio if playing
      this.stopAmbientSound();

      // Get audio from cache
      let audio = this.audioCache.get(soundId);
      if (!audio) {
        // Create on-demand if not preloaded
        audio = new Audio(`/audio/ambient/${soundId}.mp3`);
        audio.preload = 'auto';
        audio.loop = true;
        this.audioCache.set(soundId, audio);
        this.audioStates.set(audio, 'idle');
      }

      // Set volume and reset position
      audio.volume = this.calculateEffectiveVolume();
      audio.currentTime = 0;
      
      // Use safe play method
      const success = await this.safePlay(audio);
      if (success) {
        this.currentAudio = audio;
      }
      
      return success;
    } catch (error) {
      return false;
    }
  }

  stopAmbientSound() {
    if (!this.isBrowser) return;
    if (this.currentAudio) {
      this.safePause(this.currentAudio);
      this.currentAudio.currentTime = 0;
      this.audioStates.set(this.currentAudio, 'idle');
      this.currentAudio = null;
    }
  }

  pauseAmbientSound() {
    if (this.currentAudio) {
      this.safePause(this.currentAudio);
    }
  }

  async resumeAmbientSound(): Promise<boolean> {
    if (!this.isBrowser) return false;
    if (this.currentAudio) {
      return await this.safePlay(this.currentAudio);
    }
    return false;
  }

  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume / 100));
    this.updateCurrentAudioVolume();
  }

  setAmbientVolume(volume: number) {
    this.ambientVolume = Math.max(0, Math.min(1, volume / 100));
    this.updateCurrentAudioVolume();
  }

  setNotificationVolume(volume: number) {
    this.notificationVolume = Math.max(0, Math.min(1, volume / 100));
  }

  setBreathingVolume(volume: number) {
    this.breathingVolume = Math.max(0, Math.min(1, volume / 100));
  }

  async playNotificationSound(soundId: string): Promise<boolean> {
    if (!this.isBrowser) return false;
    try {
      // Don't play if globally muted
      if (this.isGloballyMuted) {
        return false;
      }

      let audio = this.notificationCache.get(soundId);
      if (!audio) {
        // Create on-demand
        audio = new Audio(`/audio/notifications/${soundId}.mp3`);
        audio.preload = 'auto';
        audio.loop = false;
        this.notificationCache.set(soundId, audio);
        this.audioStates.set(audio, 'idle');
      }

      // Set volume for notification
      audio.volume = this.masterVolume * this.notificationVolume;
      audio.currentTime = 0;
      
      // Use safe play method
      return await this.safePlay(audio);
    } catch (error) {
      return false;
    }
  }

  getAvailableNotificationSounds(): Array<{id: string, name: string}> {
    return [
      { id: 'gentle-chime', name: 'Gentle Chime' },
      { id: 'soft-bell', name: 'Soft Bell' },
      { id: 'zen-ding', name: 'Zen Ding' }
    ];
  }

  private calculateEffectiveVolume(): number {
    if (this.isGloballyMuted) {
      return 0;
    }
    return this.masterVolume * this.ambientVolume;
  }

  private updateCurrentAudioVolume() {
    if (!this.isBrowser) return;
    if (this.currentAudio) {
      this.currentAudio.volume = this.calculateEffectiveVolume();
    }
  }

  isPlaying(): boolean {
    return this.currentAudio ? !this.currentAudio.paused : false;
  }

  getCurrentSoundId(): string | null {
    if (!this.currentAudio) return null;
    
    // Extract sound ID from audio src
    const src = this.currentAudio.src;
    const match = src.match(/\/audio\/ambient\/(\w+)\.mp3$/);
    return match ? match[1] : null;
  }

  // Cleanup method for components to use on unmount
  cleanup(): void {
    if (!this.isBrowser) return;
    // Stop all audio and clear promises
    this.stopAmbientSound();
    
    // Clear all pending promises
    this.playingPromises.clear();
    
    // Reset all audio states
    this.audioStates.forEach((state, audio) => {
      this.audioStates.set(audio, 'idle');
    });
  }
}

// Create singleton instance
export const audioService = new AudioService();
export default audioService;