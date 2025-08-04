import { Volume2, VolumeX, Bell, Wind } from 'lucide-react';
import { useCallback, useRef } from 'react';
import { useAudioSettings } from '../../hooks/useSettings';
import { audioService } from '../../services/audioService';

interface VolumeSliderProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
}

function VolumeSlider({ label, icon, value, onChange, disabled = false, min = 0, max = 100 }: VolumeSliderProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleChange = useCallback((newValue: number) => {
    onChange(newValue);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for debounced save (500ms after slider stops moving)
    timeoutRef.current = setTimeout(() => {
      // Trigger a custom event to indicate settings should be saved
      window.dispatchEvent(new CustomEvent('audioSettingsChanged'));
    }, 500);
  }, [onChange]);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-200 flex items-center space-x-2">
          {icon}
          <span>{label}</span>
        </label>
        <span className="text-sm text-gray-400">{value}%</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => handleChange(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 slider"
        />
        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .slider::-webkit-slider-thumb:hover {
            background: #2563eb;
            transform: scale(1.1);
          }
          .slider::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: none;
            transition: all 0.2s ease;
          }
          .slider::-moz-range-thumb:hover {
            background: #2563eb;
            transform: scale(1.1);
          }
        `}</style>
      </div>
    </div>
  );
}

export const AudioSettings = () => {
  const { audioSettings, updateAudioSettings } = useAudioSettings();
  
  const handleVolumeChange = useCallback((setting: keyof typeof audioSettings, value: number) => {
    updateAudioSettings({ [setting]: value });
    
    // Update audio service immediately for real-time feedback
    switch (setting) {
      case 'masterVolume':
        audioService.setMasterVolume(value);
        break;
      case 'ambientVolume':
        audioService.setAmbientVolume(value);
        break;
      case 'breathingVolume':
        audioService.setBreathingVolume(value);
        break;
    }
  }, [updateAudioSettings]);
  
  const handleToggleChange = useCallback((setting: keyof typeof audioSettings) => {
    const newValue = !audioSettings[setting];
    updateAudioSettings({ [setting]: newValue });
  }, [audioSettings, updateAudioSettings]);
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
            <button
              type="button"
              onClick={() => handleToggleChange('notificationSounds')}
              className={`w-12 h-6 rounded-full ${audioSettings.notificationSounds ? 'bg-blue-600' : 'bg-gray-600'} relative transition-all duration-200 ease-in-out hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ease-in-out ${audioSettings.notificationSounds ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <VolumeSlider
            label="Master Volume"
            icon={audioSettings.masterVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            value={audioSettings.masterVolume}
            onChange={(value) => handleVolumeChange('masterVolume', value)}
          />

          <VolumeSlider
            label="Ambient Sounds"
            icon={<Wind className="w-4 h-4" />}
            value={audioSettings.ambientVolume}
            onChange={(value) => handleVolumeChange('ambientVolume', value)}
            disabled={audioSettings.masterVolume === 0}
          />

          <VolumeSlider
            label="Breathing Sounds"
            icon={<Wind className="w-4 h-4" />}
            value={audioSettings.breathingVolume}
            onChange={(value) => handleVolumeChange('breathingVolume', value)}
            disabled={audioSettings.masterVolume === 0}
          />
        </div>
      </div>
    </div>
  );
};