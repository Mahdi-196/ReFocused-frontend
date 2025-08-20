import { useState, useEffect } from 'react';
import { getCurrentUserScope } from '@/utils/scopedStorage';

// Settings type definitions
export interface AudioSettings {
  masterVolume: number;
  notificationSounds: boolean;
  ambientVolume: number;
  breathingVolume: number;
}

export interface DisplaySettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  language: string;
  animations: boolean;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  dailyReminders: boolean;
  achievementAlerts: boolean;
}

export interface AppPreferences {
  defaultPomodoroTime: number;
  defaultBreakTime: number;
  defaultBreathingPattern: string;
  autoStartSessions: boolean;
}

export interface AllSettings {
  audio: AudioSettings;
  display: DisplaySettings;
  notifications: NotificationSettings;
  preferences: AppPreferences;
}

// Default settings
const defaultSettings: AllSettings = {
  audio: {
    masterVolume: 70,
    notificationSounds: true,
    ambientVolume: 50,
    breathingVolume: 60,
  },
  display: {
    theme: 'dark',
    fontSize: 'medium',
    language: 'en',
    animations: true,
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    dailyReminders: true,
    achievementAlerts: true,
  },
  preferences: {
    defaultPomodoroTime: 25,
    defaultBreakTime: 5,
    defaultBreathingPattern: '4-7-8',
    autoStartSessions: false,
  },
};

// Custom hook for settings management
export function useSettings() {
  const [settings, setSettings] = useState<AllSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(`refocused_settings:${getCurrentUserScope()}`);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(`refocused_settings:${getCurrentUserScope()}`, JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }
  }, [settings, isLoaded]);

  // Update specific setting category
  const updateSettings = <T extends keyof AllSettings>(
    category: T,
    newSettings: Partial<AllSettings[T]>
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...prev[category], ...newSettings }
    }));
  };

  // Reset settings to defaults
  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(`refocused_settings:${getCurrentUserScope()}`);
  };

  // Get a specific setting value
  const getSetting = <T extends keyof AllSettings, K extends keyof AllSettings[T]>(
    category: T,
    key: K
  ): AllSettings[T][K] => {
    return settings[category][key];
  };

  return {
    settings,
    updateSettings,
    resetSettings,
    getSetting,
    isLoaded,
  };
}

// Helper hooks for specific setting categories
export function useAudioSettings() {
  const { settings, updateSettings, getSetting } = useSettings();
  
  return {
    audioSettings: settings.audio,
    updateAudioSettings: (newSettings: Partial<AudioSettings>) => 
      updateSettings('audio', newSettings),
    getAudioSetting: <K extends keyof AudioSettings>(key: K) => 
      getSetting('audio', key),
  };
}

export function useDisplaySettings() {
  const { settings, updateSettings, getSetting } = useSettings();
  
  return {
    displaySettings: settings.display,
    updateDisplaySettings: (newSettings: Partial<DisplaySettings>) => 
      updateSettings('display', newSettings),
    getDisplaySetting: <K extends keyof DisplaySettings>(key: K) => 
      getSetting('display', key),
  };
}

export function useNotificationSettings() {
  const { settings, updateSettings, getSetting } = useSettings();
  
  return {
    notificationSettings: settings.notifications,
    updateNotificationSettings: (newSettings: Partial<NotificationSettings>) => 
      updateSettings('notifications', newSettings),
    getNotificationSetting: <K extends keyof NotificationSettings>(key: K) => 
      getSetting('notifications', key),
  };
}

export function useAppPreferences() {
  const { settings, updateSettings, getSetting } = useSettings();
  
  return {
    appPreferences: settings.preferences,
    updateAppPreferences: (newSettings: Partial<AppPreferences>) => 
      updateSettings('preferences', newSettings),
    getAppPreference: <K extends keyof AppPreferences>(key: K) => 
      getSetting('preferences', key),
  };
} 