"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Settings, LogOut, MessageSquare, X, Star, Camera, Volume2, VolumeX, Bell, Wind } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import AvatarSelector from '@/components/AvatarSelector';
import { useSettings } from '@/hooks/useSettings';

interface FeedbackData {
  rating: number;
  category: string;
  message: string;
  contact: string;
}

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState('https://api.dicebear.com/7.x/personas/svg?seed=John-Doe&backgroundColor=transparent');
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [feedbackData, setFeedbackData] = useState<FeedbackData>({
    rating: 0,
    category: '',
    message: '',
    contact: ''
  });
  const [appSettingsActiveSection, setAppSettingsActiveSection] = useState('audio');
  
  // Settings hook
  const { settings, updateSettings, isLoaded } = useSettings();

  const menuItems = [
    { id: 'profile', icon: <User size={18} />, label: 'Profile' },
    { id: 'settings', icon: <Settings size={18} />, label: 'Account Settings' },
    { id: 'app-settings', icon: <Volume2 size={18} />, label: 'Audio' },
  ];

  const feedbackCategories = [
    'General Feedback',
    'Bug Report',
    'Feature Request',
    'User Experience',
    'Performance Issues',
    'Content Suggestions'
  ];

  const handleFeedbackSubmit = () => {
    if (feedbackData.rating === 0 || !feedbackData.category || !feedbackData.message.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    
    console.log('Feedback submitted:', feedbackData);
    
    setFeedbackData({
      rating: 0,
      category: '',
      message: '',
      contact: ''
    });
    setIsFeedbackModalOpen(false);
    
    alert('Thank you for your feedback! We appreciate your input.');
  };

  // Settings component helper functions
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

  const FeedbackModal = () => {
    if (!isFeedbackModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gradient-to-br from-gray-900/95 to-slate-900/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl"
        >
          <button
            onClick={() => setIsFeedbackModalOpen(false)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center transition-colors"
            aria-label="Close feedback modal"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Share Your Feedback</h2>
            <p className="text-gray-300 text-sm">Help us improve ReFocused by sharing your thoughts and suggestions</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Overall Experience <span className="text-red-400">*</span>
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setFeedbackData(prev => ({ ...prev, rating: star }))}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    star <= feedbackData.rating
                      ? 'bg-yellow-500 text-white shadow-lg'
                      : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                  }`}
                >
                  <Star className={`w-5 h-5 ${star <= feedbackData.rating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Feedback Category <span className="text-red-400">*</span>
            </label>
            <select
              value={feedbackData.category}
              onChange={(e) => setFeedbackData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Select a category...</option>
              {feedbackCategories.map((category) => (
                <option key={category} value={category} className="bg-gray-800">
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Your Message <span className="text-red-400">*</span>
            </label>
            <textarea
              value={feedbackData.message}
              onChange={(e) => setFeedbackData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Tell us what you think, report a bug, or suggest a new feature..."
              rows={5}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Contact Email (Optional)
            </label>
            <input
              type="email"
              value={feedbackData.contact}
              onChange={(e) => setFeedbackData(prev => ({ ...prev, contact: e.target.value }))}
              placeholder="your@email.com (if you'd like a response)"
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setIsFeedbackModalOpen(false)}
              className="flex-1 px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleFeedbackSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              Submit Feedback
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderAudioSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-3">
          <Bell className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-medium text-gray-200">Notification Sounds</span>
        </div>
        <ToggleSwitch
          enabled={settings.audio.notificationSounds}
          onChange={(enabled) => updateSettings('audio', { notificationSounds: enabled })}
        />
      </div>

      <VolumeSlider
        label="Master Volume"
        value={settings.audio.masterVolume}
        onChange={(value) => updateSettings('audio', { masterVolume: value })}
        icon={settings.audio.masterVolume === 0 ? VolumeX : Volume2}
      />

      <VolumeSlider
        label="Ambient Sounds"
        value={settings.audio.ambientVolume}
        onChange={(value) => updateSettings('audio', { ambientVolume: value })}
        icon={Wind}
        disabled={settings.audio.masterVolume === 0}
      />

      <VolumeSlider
        label="Breathing Exercise Audio"
        value={settings.audio.breathingVolume}
        onChange={(value) => updateSettings('audio', { breathingVolume: value })}
        icon={Wind}
        disabled={settings.audio.masterVolume === 0}
      />
    </div>
  );



  const renderActiveAppSettingsSection = () => {
    return renderAudioSettings();
  };

  const renderAppSettings = () => {
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
          {renderActiveAppSettingsSection()}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-gray-800/90 to-slate-800/90 backdrop-blur-lg border border-gray-700/60 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-blue-600/20 rounded-xl">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Profile Information</h3>
                  <p className="text-gray-400 text-sm">Manage your personal details and preferences</p>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/40">
                  <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
                    <div className="flex flex-col items-center space-y-4">
                      <div 
                        className="relative group cursor-pointer"
                        onClick={() => setIsAvatarSelectorOpen(true)}
                      >
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700/50 border-2 border-gray-600/50 group-hover:border-blue-500/50 transition-colors">
                          <img 
                            src={currentAvatar} 
                            alt="Profile Avatar" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setIsAvatarSelectorOpen(true)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-sm rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                      >
                        Change Avatar
                      </button>
                    </div>

                    <div className="flex-1 space-y-6 w-full lg:w-auto">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-xl font-semibold text-white">John Doe</h4>
                            <svg className="w-4 h-4 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </div>
                          <p className="text-gray-300 text-sm">john@example.com</p>
                          <p className="text-gray-400 text-sm">Member since January 2024</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-blue-500/20 to-indigo-600/20 border border-blue-500/30 rounded-lg p-4">
                            <h5 className="text-blue-400 font-medium mb-2">Current Streak</h5>
                            <p className="text-2xl font-bold text-white">7 days</p>
                            <p className="text-gray-400 text-sm">Keep it up! 🔥</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-blue-400" />
                Account Security
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
                  Update Password
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Email Subscription</h3>
              <div className="space-y-6">
                <div className={`p-4 rounded-lg ${isSubscribed ? 'bg-green-900/20 border border-green-800/50' : 'bg-red-900/20 border border-red-800/50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-medium mb-1 ${isSubscribed ? 'text-green-400' : 'text-red-400'}`}>
                        Subscription Status
                      </h4>
                      <p className="text-sm text-gray-300">
                        {isSubscribed ? 'You are currently subscribed to our newsletter' : 'You are not subscribed to our newsletter'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">john@example.com</p>
                    </div>
                    <button
                      onClick={() => setIsSubscribed(!isSubscribed)}
                      className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
                        isSubscribed 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Data Management</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                  <h4 className="text-blue-400 font-medium mb-2">Export Your Data</h4>
                  <p className="text-sm text-gray-300 mb-3">Download all your personal data including journal entries, goals, and settings.</p>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
                    Request Data Export
                  </button>
                </div>
                <div className="p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
                  <h4 className="text-yellow-400 font-medium mb-2">Clear Activity Data</h4>
                  <p className="text-sm text-gray-300 mb-3">Remove all your activity history while keeping your account active.</p>
                  <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm font-medium">
                    Clear Data
                  </button>
                </div>
                <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
                  <h4 className="text-red-400 font-medium mb-2">Delete Account</h4>
                  <p className="text-sm text-gray-300 mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'app-settings':
        return renderAppSettings();

      default:
        return (
          <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Section Coming Soon</h3>
            <p className="text-gray-400">This section is currently under development.</p>
          </div>
        );
    }
  };

  return (
    <PageTransition>
      <div 
        className="min-h-screen py-8"
        style={{ backgroundColor: "#1A2537" }}
      >
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
            <p className="text-gray-400">Manage your account settings and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 sticky top-8">
                <div className="text-center mb-6 pb-6 border-b border-gray-700/50">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700/50 border-2 border-gray-600/50 mx-auto mb-3">
                    <img 
                      src={currentAvatar} 
                      alt="Profile Avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-white">John Doe</h3>
                  <p className="text-sm text-gray-400">john@example.com</p>
                </div>

                <nav className="space-y-2">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                        activeTab === item.id
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setIsFeedbackModalOpen(true)}
                    className="w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left text-gray-300 hover:text-white hover:bg-gray-700/50 border-t border-gray-700/50 mt-4 pt-4"
                  >
                    <MessageSquare size={18} />
                    <span className="text-sm font-medium">Give Feedback</span>
                  </button>
                  
                  <button className="w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left text-red-400 hover:text-red-300 hover:bg-red-900/20">
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </nav>
              </div>
            </div>

            <div className="lg:col-span-3">
              {renderContent()}
            </div>
          </div>
        </div>

        <FeedbackModal />
        
        <AvatarSelector
          isOpen={isAvatarSelectorOpen}
          onClose={() => setIsAvatarSelectorOpen(false)}
          onSelect={(avatarUrl) => setCurrentAvatar(avatarUrl)}
          currentAvatar={currentAvatar}
          userName="John Doe"
        />
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

        .slider::-moz-range-track {
          background: transparent;
        }
      `}</style>
    </PageTransition>
  );
};

export default Profile;