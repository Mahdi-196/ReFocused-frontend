'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shuffle, Check, X, Zap, Palette, Robot } from 'lucide-react';

interface MultiAvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (avatarUrl: string) => void;
  currentAvatar?: string;
  userName?: string;
}

const MultiAvatarSelector = ({ isOpen, onClose, onSelect, currentAvatar, userName = 'User' }: MultiAvatarSelectorProps) => {
  const [selectedService, setSelectedService] = useState('dicebear');
  const [selectedStyle, setSelectedStyle] = useState('personas');
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || '');

  // Different avatar services with unique aesthetics
  const avatarServices = [
    {
      id: 'dicebear',
      name: 'DiceBear',
      icon: <Palette size={16} />,
      description: 'Illustrated avatars',
      styles: [
        { id: 'personas', name: 'Personas' },
        { id: 'avataaars', name: 'Avataaars' },
        { id: 'bottts', name: 'Robots' },
        { id: 'pixel-art', name: 'Pixel Art' },
        { id: 'open-peeps', name: 'Hand-drawn' },
        { id: 'croodles', name: 'Doodles' },
      ]
    },
    {
      id: 'multiavatar',
      name: 'MultiAvatar',
      icon: <Zap size={16} />,
      description: 'Multicultural avatars',
      styles: [{ id: 'default', name: 'Multicultural' }]
    },
    {
      id: 'robohash',
      name: 'RoboHash',
      icon: <Robot size={16} />,
      description: 'Robots & monsters',
      styles: [
        { id: 'robots', name: 'Robots' },
        { id: 'monsters', name: 'Monsters' },
        { id: 'heads', name: 'Robot Heads' },
        { id: 'cats', name: 'Cats' },
      ]
    },
    {
      id: 'ui-avatars',
      name: 'UI Avatars',
      icon: <span className="text-xs font-bold">UI</span>,
      description: 'Text-based avatars',
      styles: [{ id: 'initials', name: 'Initials' }]
    }
  ];

  const generateAvatars = (service: string, style: string, count: number = 12) => {
    const avatars = [];
    
    for (let i = 0; i < count; i++) {
      const seed = `${userName}-${service}-${style}-${i}-${Math.random().toString(36).substr(2, 9)}`;
      let avatarUrl = '';

      switch (service) {
        case 'dicebear':
          avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=transparent`;
          break;
        
        case 'multiavatar':
          avatarUrl = `https://api.multiavatar.com/${seed}.svg`;
          break;
        
        case 'robohash':
          const sets = {
            'robots': 'set1',
            'monsters': 'set2', 
            'heads': 'set3',
            'cats': 'set4'
          };
          avatarUrl = `https://robohash.org/${seed}?set=${sets[style as keyof typeof sets]}&size=200x200`;
          break;
        
        case 'ui-avatars':
          const colors = ['0D8ABC', '2DD4BF', 'F59E0B', 'EF4444', '8B5CF6', 'EC4899'];
          const bgColor = colors[i % colors.length];
          avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=${bgColor}&color=fff&size=200&font-size=0.6&rounded=true&bold=true`;
          break;
      }

      avatars.push({ seed, url: avatarUrl, service, style });
    }
    
    return avatars;
  };

  const [avatars, setAvatars] = useState(generateAvatars(selectedService, selectedStyle));

  const handleServiceChange = (serviceId: string) => {
    setSelectedService(serviceId);
    const service = avatarServices.find(s => s.id === serviceId);
    const firstStyle = service?.styles[0]?.id || 'default';
    setSelectedStyle(firstStyle);
    setAvatars(generateAvatars(serviceId, firstStyle));
    setSelectedAvatar('');
  };

  const handleStyleChange = (styleId: string) => {
    setSelectedStyle(styleId);
    setAvatars(generateAvatars(selectedService, styleId));
    setSelectedAvatar('');
  };

  const generateNewSet = () => {
    setAvatars(generateAvatars(selectedService, selectedStyle));
    setSelectedAvatar('');
  };

  const handleSelect = () => {
    if (selectedAvatar) {
      onSelect(selectedAvatar);
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentService = avatarServices.find(s => s.id === selectedService);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-gray-900/95 to-slate-900/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center transition-colors"
          aria-label="Close avatar selector"
        >
          <X className="w-5 h-5 text-gray-300" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Choose Your Avatar Style</h2>
          <p className="text-gray-300 text-sm">Explore different avatar services and find your perfect look</p>
        </div>

        {/* Service Selector */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Avatar Service</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {avatarServices.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceChange(service.id)}
                className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                  selectedService === service.id
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                    : 'border-gray-600/50 bg-gray-700/30 text-gray-300 hover:border-gray-500/70 hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 flex items-center justify-center">
                    {service.icon}
                  </div>
                  <div className="font-medium text-sm">{service.name}</div>
                </div>
                <div className="text-xs opacity-75">{service.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Style Selector (if service has multiple styles) */}
        {currentService && currentService.styles.length > 1 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">{currentService.name} Styles</h3>
            <div className="flex flex-wrap gap-2">
              {currentService.styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleStyleChange(style.id)}
                  className={`px-4 py-2 rounded-lg border transition-all duration-200 text-sm ${
                    selectedStyle === style.id
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                      : 'border-gray-600/50 bg-gray-700/30 text-gray-300 hover:border-gray-500/70 hover:bg-gray-700/50'
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>
        )}

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

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {avatars.map((avatar, index) => (
            <motion.button
              key={`${selectedService}-${selectedStyle}-${index}`}
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
                onError={(e) => {
                  // Fallback for failed loads
                  const target = e.target as HTMLImageElement;
                  target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${avatar.seed}&backgroundColor=transparent`;
                }}
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

export default MultiAvatarSelector; 