'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shuffle, Check, X } from 'lucide-react';

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (avatarUrl: string) => void;
  currentAvatar?: string;
  userName?: string;
}

const AvatarSelector = ({ isOpen, onClose, onSelect, currentAvatar, userName = 'User' }: AvatarSelectorProps) => {
  const [selectedStyle, setSelectedStyle] = useState('open-peeps');
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || '');

  const avatarStyles = [
    // Human-like styles
    { id: 'open-peeps', name: 'Open Peeps', description: 'Hand-drawn illustrations' },
    { id: 'adventurer', name: 'Adventurer', description: 'Colorful characters' },
    
    // Artistic/Abstract styles
    { id: 'lorelei', name: 'Lorelei', description: 'Minimalist elegance' },
    { id: 'croodles', name: 'Croodles', description: 'Doodle-style faces' },
    { id: 'notionists', name: 'Notionists', description: 'Notion-style avatars' },
    
    // Fun/Creative styles
    { id: 'pixel-art', name: 'Pixel Art', description: '8-bit retro style' },
    
    // Alternative Services
    { id: 'robohash-robots', name: 'RoboHash Robots', description: 'Cool robot avatars' },
    { id: 'robohash-monsters', name: 'RoboHash Monsters', description: 'Cute monsters' },
  ];

  const generateAvatars = (style: string, count: number = 12) => {
    const avatars = [];
    for (let i = 0; i < count; i++) {
      const seed = `${userName}-${style}-${i}-${Math.random().toString(36).substr(2, 9)}`;
      let avatarUrl = '';
      
      // Special handling for different services
      if (style === 'multiavatar') {
        avatarUrl = `https://api.multiavatar.com/${seed}.svg`;
      } else if (style === 'robohash-robots') {
        avatarUrl = `https://robohash.org/${seed}?set=set1&size=200x200`;
      } else if (style === 'robohash-monsters') {
        avatarUrl = `https://robohash.org/${seed}?set=set2&size=200x200`;
      } else if (style === 'ui-avatars') {
        const colors = ['0D8ABC', '2DD4BF', 'F59E0B', 'EF4444', '8B5CF6', 'EC4899'];
        const bgColor = colors[i % colors.length];
        avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=${bgColor}&color=fff&size=200&font-size=0.6&rounded=true&bold=true`;
      } else {
        // Default DiceBear
        avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=transparent`;
      }
      
      avatars.push({ seed, url: avatarUrl });
    }
    return avatars;
  };

  const [avatars, setAvatars] = useState(generateAvatars(selectedStyle));

  const handleStyleChange = (style: string) => {
    setSelectedStyle(style);
    setAvatars(generateAvatars(style));
    setSelectedAvatar('');
  };

  const generateNewSet = () => {
    setAvatars(generateAvatars(selectedStyle));
    setSelectedAvatar('');
  };

  const handleSelect = () => {
    if (selectedAvatar) {
      onSelect(selectedAvatar);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-gray-900/95 to-slate-900/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center transition-colors"
          aria-label="Close avatar selector"
        >
          <X className="w-5 h-5 text-gray-300" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Choose Your Avatar</h2>
          <p className="text-gray-300 text-sm">Select a style and pick your perfect profile picture</p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Avatar Style ({avatarStyles.length} styles available)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
            {avatarStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => handleStyleChange(style.id)}
                className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                  selectedStyle === style.id
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                    : 'border-gray-600/50 bg-gray-700/30 text-gray-300 hover:border-gray-500/70 hover:bg-gray-700/50'
                }`}
              >
                <div className="font-medium text-sm">{style.name}</div>
                <div className="text-xs opacity-75 mt-1">{style.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">Choose an Avatar</h3>
          <button
            onClick={generateNewSet}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors"
          >
            <Shuffle size={16} />
            Generate New Set
          </button>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-6 gap-4 mb-8">
          {avatars.map((avatar, index) => (
            <motion.button
              key={`${selectedStyle}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedAvatar(avatar.url)}
              className={`relative w-full aspect-square rounded-xl overflow-hidden transition-all duration-200 ${
                selectedAvatar === avatar.url
                  ? 'ring-4 ring-blue-500 scale-105'
                  : 'hover:scale-105 hover:ring-2 hover:ring-gray-400'
              }`}
            >
              <img
                src={avatar.url}
                alt="Avatar option"
                className="w-full h-full object-cover bg-gray-700/50"
                loading="lazy"
              />
              {selectedAvatar === avatar.url && (
                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-blue-400" />
                </div>
              )}
            </motion.button>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedAvatar}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Select Avatar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AvatarSelector;