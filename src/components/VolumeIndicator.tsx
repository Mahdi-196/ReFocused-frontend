"use client";

import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { useAudioSettings } from '@/hooks/useSettings';

interface VolumeIndicatorProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const VolumeIndicator = ({ 
  className = '', 
  showLabel = false, 
  size = 'md' 
}: VolumeIndicatorProps) => {
  const { audioSettings } = useAudioSettings();
  const { masterVolume, notificationSounds } = audioSettings;

  // Determine icon based on volume level
  const getVolumeIcon = () => {
    if (masterVolume === 0 || !notificationSounds) {
      return VolumeX;
    } else if (masterVolume < 50) {
      return Volume1;
    } else {
      return Volume2;
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const VolumeIcon = getVolumeIcon();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <VolumeIcon 
        className={`${sizeClasses[size]} ${
          masterVolume === 0 || !notificationSounds 
            ? 'text-red-400' 
            : 'text-blue-400'
        }`}
      />
      {showLabel && (
        <span className={`${textSizeClasses[size]} text-gray-300`}>
          {masterVolume === 0 || !notificationSounds ? 'Muted' : `${masterVolume}%`}
        </span>
      )}
    </div>
  );
};

export default VolumeIndicator; 