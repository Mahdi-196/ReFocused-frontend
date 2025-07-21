import { Volume2, VolumeX, Bell, Wind } from 'lucide-react';
// TODO: Implement VolumeSlider and ToggleSwitch components
// import { VolumeSlider } from './ui/VolumeSlider';
// import { ToggleSwitch } from './ui/ToggleSwitch';

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
            {/* TODO: Implement ToggleSwitch component */}
            <button
              onClick={() => onSettingChange('notificationSounds', !settings.notificationSounds)}
              className={`w-12 h-6 rounded-full ${settings.notificationSounds ? 'bg-blue-600' : 'bg-gray-600'} relative transition-colors`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${settings.notificationSounds ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* TODO: Implement VolumeSlider component */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-200 flex items-center space-x-2">
                {settings.masterVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>Master Volume</span>
              </label>
              <span className="text-sm text-gray-400">{settings.masterVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.masterVolume}
              onChange={(e) => onSettingChange('masterVolume', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* TODO: Implement VolumeSlider component */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-200 flex items-center space-x-2">
                <Wind className="w-4 h-4" />
                <span>Ambient Sounds</span>
              </label>
              <span className="text-sm text-gray-400">{settings.ambientVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.ambientVolume}
              onChange={(e) => onSettingChange('ambientVolume', parseInt(e.target.value))}
              disabled={settings.masterVolume === 0}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
          </div>

          {/* TODO: Implement VolumeSlider component */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-200 flex items-center space-x-2">
                <Wind className="w-4 h-4" />
                <span>Breathing Sounds</span>
              </label>
              <span className="text-sm text-gray-400">{settings.breathingVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.breathingVolume}
              onChange={(e) => onSettingChange('breathingVolume', parseInt(e.target.value))}
              disabled={settings.masterVolume === 0}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
};