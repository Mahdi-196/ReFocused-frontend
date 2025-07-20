import { Volume2, VolumeX, Bell, Wind } from 'lucide-react';
import { VolumeSlider } from './ui/VolumeSlider';
import { ToggleSwitch } from './ui/ToggleSwitch';

interface AudioSettingsData {
  notificationSounds: boolean;
  masterVolume: number;
  ambientVolume: number;
  breathingVolume: number;
}

interface AudioSettingsProps {
  settings: AudioSettingsData;
  onSettingChange: (setting: string, value: boolean | number | string) => void;
}

export const AudioSettings = ({ settings, onSettingChange }: AudioSettingsProps) => {
  return (
    <div className="bg-gradient-to-br from-gray-800/90 to-slate-800/90 backdrop-blur-lg border border-gray-700/60 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <Volume2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Audio Settings</h2>
            <p className="text-gray-400 text-sm">Customize your audio settings and sound preferences</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Audio</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-gray-200">Notification Sounds</span>
            </div>
            <ToggleSwitch
              enabled={settings.notificationSounds}
              onChange={(enabled) => onSettingChange('notificationSounds', enabled)}
            />
          </div>

          <VolumeSlider
            label="Master Volume"
            value={settings.masterVolume}
            onChange={(value) => onSettingChange('masterVolume', value)}
            icon={settings.masterVolume === 0 ? VolumeX : Volume2}
          />

          <VolumeSlider
            label="Ambient Sounds"
            value={settings.ambientVolume}
            onChange={(value) => onSettingChange('ambientVolume', value)}
            icon={Wind}
            disabled={settings.masterVolume === 0}
          />

          <VolumeSlider
            label="Breathing Exercise Audio"
            value={settings.breathingVolume}
            onChange={(value) => onSettingChange('breathingVolume', value)}
            icon={Wind}
            disabled={settings.masterVolume === 0}
          />
        </div>
      </div>
    </div>
  );
};