'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Check, X } from 'lucide-react';

interface AIAvatarGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (avatarUrl: string) => void;
  userName?: string;
}

const AIAvatarGenerator = ({ isOpen, onClose, onSelect, userName = 'User' }: AIAvatarGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [generatedAvatars, setGeneratedAvatars] = useState<string[]>([]);

  // AI-style avatar generation using multiple services
  const generateAIAvatars = async () => {
    setIsGenerating(true);
    
    // For demo purposes, we'll use different AI-style generators
    // In production, you could integrate with Hugging Face, Stable Diffusion, etc.
    const aiServices = [
      // These are free AI-style avatar generators
      'https://api.dicebear.com/7.x/personas/svg?seed=ai-{SEED}&mood=happy&eyes=variant01&eyebrows=variant01',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=ai-{SEED}&skinColor=fdbcb4&hairColor=0e7c7b',
      'https://api.dicebear.com/7.x/lorelei/svg?seed=ai-{SEED}&flip=false',
      'https://api.dicebear.com/7.x/micah/svg?seed=ai-{SEED}&baseColor=apricot',
    ];

    const avatars = [];
    
    for (let i = 0; i < 8; i++) {
      const service = aiServices[i % aiServices.length];
      const seed = `${userName}-ai-gen-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
      const avatarUrl = service.replace('{SEED}', seed);
      avatars.push(avatarUrl);
    }

    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setGeneratedAvatars(avatars);
    setIsGenerating(false);
  };

  const handleGenerate = () => {
    setSelectedAvatar('');
    generateAIAvatars();
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
        className="bg-gradient-to-br from-gray-900/95 to-slate-900/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center transition-colors"
          aria-label="Close AI avatar generator"
        >
          <X className="w-5 h-5 text-gray-300" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">AI Avatar Generator</h2>
          <p className="text-gray-300 text-sm">Generate unique AI-powered profile pictures</p>
        </div>

        {!isGenerating && generatedAvatars.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-6">
              <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-white mb-2">Ready to Generate</h3>
              <p className="text-gray-400">Click the button below to generate unique AI avatars just for you!</p>
            </div>
            <button
              onClick={handleGenerate}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-3 mx-auto"
            >
              <Sparkles size={20} />
              Generate AI Avatars
            </button>
          </div>
        )}

        {isGenerating && (
          <div className="text-center py-12">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 border-4 border-pink-500/50 rounded-full animate-spin"></div>
              <div className="absolute inset-4 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Generating AI Avatars</h3>
            <p className="text-gray-400">Creating unique avatars with artificial intelligence...</p>
          </div>
        )}

        {!isGenerating && generatedAvatars.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">Generated Avatars</h3>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors border border-purple-500/30"
              >
                <RefreshCw size={16} />
                Generate New Set
              </button>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-8">
              {generatedAvatars.map((avatar, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`relative w-full aspect-square rounded-xl overflow-hidden transition-all duration-200 ${
                    selectedAvatar === avatar
                      ? 'ring-4 ring-purple-500 scale-105'
                      : 'hover:scale-105 hover:ring-2 hover:ring-purple-400'
                  }`}
                >
                  <img
                    src={avatar}
                    alt={`AI Generated Avatar ${index + 1}`}
                    className="w-full h-full object-cover bg-gray-700/50"
                    loading="lazy"
                  />
                  {selectedAvatar === avatar && (
                    <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                      <Check className="w-6 h-6 text-purple-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  </div>
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
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Select Avatar
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AIAvatarGenerator; 