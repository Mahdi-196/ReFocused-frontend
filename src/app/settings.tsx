"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Volume2, 
  VolumeX, 
  Monitor, 
  Smartphone, 
  Bell, 
  BellOff, 
  Settings as SettingsIcon,
  Moon,
  Sun,
  Globe,
  Clock,
  Wind,
  ChevronRight,
  Check
} from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

// Settings interfaces for type safety
interface AudioSettings {
  masterVolume: number;
  notificationSounds: boolean;
  ambientVolume: number;
  breathingVolume: number;
}

interface DisplaySettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  language: string;
  animations: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  dailyReminders: boolean;
  achievementAlerts: boolean;
}

interface AppPreferences {
  defaultPomodoroTime: number;
  defaultBreakTime: number;
  defaultBreathingPattern: string;
  autoStartSessions: boolean;
}

const Settings = () => {
  const { settings, updateSettings, isLoaded } = useSettings();
  const [activeSection, setActiveSection] = useState<string>('audio');

  // Destructure settings for easier access
  const { audio: audioSettings, display: displaySettings, notifications: notificationSettings, preferences: appPreferences } = settings;

  // Section navigation items
  const sections = [
    { id: 'audio', label: 'Audio & Sound', icon: Volume2 },
    { id: 'display', label: 'Display & Theme', icon: Monitor },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'App Preferences', icon: SettingsIcon },
  ];

  // Component for volume slider
  const VolumeSlider = ({ 
    label, 
    value, 
    onChange, 
    icon: Icon,
    disabled = false 
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    icon: React.ElementType;
    disabled?: boolean;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon className={`w-5 h-5 ${disabled ? 'text-gray-500' : 'text-blue-400'}`} />
          <span className={`text-sm font-medium ${disabled ? 'text-gray-500' : 'text-gray-200'}`}>
            {label}
          </span>
        </div>
        <span className={`text-sm ${disabled ? 'text-gray-500' : 'text-gray-400'}`}>
          {value}%
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className={`w-full h-2 rounded-lg appearance-none cursor-pointer slider ${
            disabled ? 'opacity-50' : ''
          }`}
          style={{
            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${value}%, #374151 ${value}%, #374151 100%)`
          }}
        />
      </div>
    </div>
  );

  // Toggle switch component
  const ToggleSwitch = ({ 
    enabled, 
    onChange, 
    disabled = false 
  }: {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        enabled ? 'bg-blue-600' : 'bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const renderAudioSettings = () => (
    <div className="space-y-6">
      <VolumeSlider
        label="Master Volume"
        value={audioSettings.masterVolume}
        onChange={(value) => updateSettings('audio', { masterVolume: value })}
        icon={audioSettings.masterVolume === 0 ? VolumeX : Volume2}
      />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-medium text-gray-200">Notification Sounds</span>
        </div>
        <ToggleSwitch
          enabled={audioSettings.notificationSounds}
          onChange={(enabled) => updateSettings('audio', { notificationSounds: enabled })}
        />
      </div>

      <VolumeSlider
        label="Ambient Sounds"
        value={audioSettings.ambientVolume}
        onChange={(value) => updateSettings('audio', { ambientVolume: value })}
        icon={Wind}
        disabled={audioSettings.masterVolume === 0}
      />

      <VolumeSlider
        label="Breathing Exercise Audio"
        value={audioSettings.breathingVolume}
        onChange={(value) => updateSettings('audio', { breathingVolume: value })}
        icon={Wind}
        disabled={audioSettings.masterVolume === 0}
      />
    </div>
  );

  const renderDisplaySettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-3">Theme</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'auto', label: 'Auto', icon: Monitor },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setDisplaySettings(prev => ({ ...prev, theme: value as any }))}
              className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                displaySettings.theme === value
                  ? 'border-blue-400 bg-blue-400/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <Icon className={`w-6 h-6 mb-2 ${
                displaySettings.theme === value ? 'text-blue-400' : 'text-gray-400'
              }`} />
              <span className={`text-sm ${
                displaySettings.theme === value ? 'text-blue-400' : 'text-gray-300'
              }`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-3">Font Size</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setDisplaySettings(prev => ({ ...prev, fontSize: value as any }))}
              className={`p-3 rounded-lg border-2 transition-all ${
                displaySettings.fontSize === value
                  ? 'border-blue-400 bg-blue-400/10 text-blue-400'
                  : 'border-gray-600 hover:border-gray-500 text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-medium text-gray-200">Animations</span>
        </div>
        <ToggleSwitch
          enabled={displaySettings.animations}
          onChange={(enabled) => setDisplaySettings(prev => ({ ...prev, animations: enabled }))}
        />
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      {[
        { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive updates via email' },
        { key: 'pushNotifications', label: 'Push Notifications', description: 'Browser notifications' },
        { key: 'dailyReminders', label: 'Daily Reminders', description: 'Remind me to practice mindfulness' },
        { key: 'achievementAlerts', label: 'Achievement Alerts', description: 'Celebrate your progress' },
      ].map(({ key, label, description }) => (
        <div key={key} className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-200">{label}</div>
            <div className="text-xs text-gray-400">{description}</div>
          </div>
          <ToggleSwitch
            enabled={notificationSettings[key as keyof NotificationSettings] as boolean}
            onChange={(enabled) => 
              setNotificationSettings(prev => ({ ...prev, [key]: enabled }))
            }
          />
        </div>
      ))}
    </div>
  );

  const renderAppPreferences = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-3">
          Default Pomodoro Duration (minutes)
        </label>
        <select
          value={appPreferences.defaultPomodoroTime}
          onChange={(e) => setAppPreferences(prev => ({ 
            ...prev, 
            defaultPomodoroTime: Number(e.target.value) 
          }))}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-blue-400"
        >
          {[15, 20, 25, 30, 45, 60].map(time => (
            <option key={time} value={time}>{time} minutes</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-3">
          Default Break Duration (minutes)
        </label>
        <select
          value={appPreferences.defaultBreakTime}
          onChange={(e) => setAppPreferences(prev => ({ 
            ...prev, 
            defaultBreakTime: Number(e.target.value) 
          }))}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-blue-400"
        >
          {[3, 5, 10, 15, 20].map(time => (
            <option key={time} value={time}>{time} minutes</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-3">
          Default Breathing Pattern
        </label>
        <select
          value={appPreferences.defaultBreathingPattern}
          onChange={(e) => setAppPreferences(prev => ({ 
            ...prev, 
            defaultBreathingPattern: e.target.value 
          }))}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-blue-400"
        >
          <option value="4-7-8">4-7-8 Relaxing Breath</option>
          <option value="4-4-4">4-4-4 Box Breathing</option>
          <option value="6-6">6-6 Equal Breathing</option>
          <option value="custom">Custom Pattern</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-200">Auto-start Sessions</div>
          <div className="text-xs text-gray-400">Automatically begin the next session</div>
        </div>
        <ToggleSwitch
          enabled={appPreferences.autoStartSessions}
          onChange={(enabled) => 
            setAppPreferences(prev => ({ ...prev, autoStartSessions: enabled }))
          }
        />
      </div>
    </div>
  );



  const renderActiveSection = () => {
    switch (activeSection) {
      case 'audio': return renderAudioSettings();
      case 'display': return renderDisplaySettings();
      case 'notifications': return renderNotificationSettings();
      case 'preferences': return renderAppPreferences();
      default: return renderAudioSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <SettingsIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-gray-400 text-sm">Customize your ReFocused experience</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Sidebar Navigation */}
            <div className="lg:w-1/3 xl:w-1/4 border-b lg:border-b-0 lg:border-r border-gray-700">
              <nav className="p-6">
                <div className="space-y-2">
                  {sections.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveSection(id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                        activeSection === id
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${
                        activeSection === id ? 'rotate-90' : ''
                      }`} />
                    </button>
                  ))}
                </div>
              </nav>
            </div>

            {/* Main Content */}
            <div className="lg:w-2/3 xl:w-3/4 p-6">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold text-white mb-6">
                  {sections.find(s => s.id === activeSection)?.label}
                </h2>
                {renderActiveSection()}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Save Confirmation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 p-4 bg-green-900/20 border border-green-800/50 rounded-lg flex items-center space-x-3"
        >
          <Check className="w-5 h-5 text-green-400" />
          <span className="text-green-400 text-sm">Settings are automatically saved</span>
        </motion.div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #1E40AF;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #1E40AF;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default Settings;
