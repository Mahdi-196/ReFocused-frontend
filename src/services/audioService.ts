class AudioService {
  private currentAudio: HTMLAudioElement | null = null;
  private masterVolume: number = 0.7;
  private ambientVolume: number = 0.5;
  private notificationVolume: number = 0.8;
  private isGloballyMuted: boolean = false;

  // Preload audio files for better performance
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private notificationCache: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    this.preloadAudioFiles();
    this.preloadNotificationSounds();
    this.initializeGlobalMuteListener();
  }

  private initializeGlobalMuteListener() {
    // Load initial global mute state
    try {
      const savedMuteState = localStorage.getItem('refocused_global_mute');
      if (savedMuteState !== null) {
        this.isGloballyMuted = savedMuteState === 'true';
      }
    } catch (error) {
      console.error('Failed to load global mute state in audioService:', error);
    }

    // Listen for global mute state changes
    if (typeof window !== 'undefined') {
      window.addEventListener('globalMuteChanged', (event: Event) => {
        const customEvent = event as CustomEvent;
        this.isGloballyMuted = customEvent.detail.isGloballyMuted;
        
        if (this.currentAudio) {
          if (this.isGloballyMuted) {
            // Mute: pause current audio
            this.currentAudio.pause();
          } else {
            // Unmute: resume current audio if it was playing
            const playPromise = this.currentAudio.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.error('Failed to resume audio after unmute:', error);
              });
            }
          }
        }
        // Update volume of current audio
        this.updateCurrentAudioVolume();
      });
    }
  }

  private preloadAudioFiles() {
    const soundIds = [
      'forest', 'ocean', 'rain', 'thunderstorm', 'wind',
      'birdsong', 'waterfall', 'fire', 'coffee', 'whitenoise'
    ];

    soundIds.forEach(soundId => {
      const audio = new Audio(`/audio/ambient/${soundId}.mp3`);
      audio.preload = 'auto';
      audio.loop = true;
      this.audioCache.set(soundId, audio);
    });
  }

  private preloadNotificationSounds() {
    const notificationIds = ['gentle-chime', 'soft-bell', 'zen-ding'];

    notificationIds.forEach(soundId => {
      const audio = new Audio(`/audio/notifications/${soundId}.mp3`);
      audio.preload = 'auto';
      audio.loop = false;
      this.notificationCache.set(soundId, audio);
    });
  }

  playAmbientSound(soundId: string): boolean {
    try {
      // Don't play if globally muted
      if (this.isGloballyMuted) {
        console.log('Audio globally muted, not playing ambient sound');
        return false;
      }

      // Stop current audio if playing
      this.stopAmbientSound();

      // Get audio from cache
      const audio = this.audioCache.get(soundId);
      if (!audio) {
        console.error(`Audio file not found: ${soundId}`);
        return false;
      }

      // Set volume and play
      audio.volume = this.calculateEffectiveVolume();
      audio.currentTime = 0;
      
      // Handle play promise (required for modern browsers)
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Audio play failed:', error);
        });
      }

      this.currentAudio = audio;
      return true;
    } catch (error) {
      console.error('Failed to play ambient sound:', error);
      return false;
    }
  }

  stopAmbientSound() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  pauseAmbientSound() {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
  }

  resumeAmbientSound() {
    if (this.currentAudio) {
      const playPromise = this.currentAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Audio resume failed:', error);
        });
      }
    }
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

  playNotificationSound(soundId: string): boolean {
    try {
      // Don't play if globally muted
      if (this.isGloballyMuted) {
        console.log('Audio globally muted, not playing notification sound');
        return false;
      }

      const audio = this.notificationCache.get(soundId);
      if (!audio) {
        console.error(`Notification sound not found: ${soundId}`);
        return false;
      }

      // Set volume for notification
      audio.volume = this.masterVolume * this.notificationVolume;
      audio.currentTime = 0;
      
      // Handle play promise
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Notification sound play failed:', error);
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to play notification sound:', error);
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
}

// Create singleton instance
export const audioService = new AudioService();
export default audioService;