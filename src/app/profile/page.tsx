'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Settings, Award, CreditCard, HelpCircle, Share2, LogOut, MessageSquare, X, Star, Camera, Palette } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import AvatarSelector from '@/components/AvatarSelector';

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

  const menuItems = [
    { id: 'profile', icon: <User size={18} />, label: 'Profile' },
    { id: 'settings', icon: <Settings size={18} />, label: 'Account Settings' },
    // { id: 'badges', icon: <Award size={18} />, label: 'Badges' },
    // { id: 'billing', icon: <CreditCard size={18} />, label: 'Billing & Subscription' },
    { id: 'support', icon: <HelpCircle size={18} />, label: 'Help & Support' },
    // { id: 'invite', icon: <Share2 size={18} />, label: 'Invite Friends' },
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
    
    // Here you would typically send the feedback to your backend
    console.log('Feedback submitted:', feedbackData);
    
    // Reset form and close modal
    setFeedbackData({
      rating: 0,
      category: '',
      message: '',
      contact: ''
    });
    setIsFeedbackModalOpen(false);
    
    // Show success message
    alert('Thank you for your feedback! We appreciate your input.');
  };

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
          {/* Close Button */}
          <button
            onClick={() => setIsFeedbackModalOpen(false)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center transition-colors"
            aria-label="Close feedback modal"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Share Your Feedback</h2>
            <p className="text-gray-300 text-sm">Help us improve ReFocused by sharing your thoughts and suggestions</p>
          </div>

          {/* Rating Section */}
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
            {feedbackData.rating > 0 && (
              <p className="text-center mt-2 text-sm text-gray-400">
                {feedbackData.rating === 1 && 'Poor'}
                {feedbackData.rating === 2 && 'Fair'}
                {feedbackData.rating === 3 && 'Good'}
                {feedbackData.rating === 4 && 'Very Good'}
                {feedbackData.rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Category Selection */}
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

          {/* Message */}
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
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-400">Minimum 10 characters</span>
              <span className="text-xs text-gray-400">{feedbackData.message.length}/1000</span>
            </div>
          </div>

          {/* Contact Information */}
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

          {/* Action Buttons */}
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

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Profile Information</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-6">
                  <div className="flex flex-col items-center space-y-3">
                    <div 
                      className="relative group cursor-pointer"
                      onClick={() => setIsAvatarSelectorOpen(true)}
                    >
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700/50 border-2 border-gray-600/50 group-hover:border-blue-400 transition-all duration-200">
                        <img 
                          src={currentAvatar} 
                          alt="Profile Avatar" 
                          className="w-full h-full object-cover group-hover:opacity-80 transition-opacity duration-200"
                        />
                      </div>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <Camera size={24} className="text-white" />
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAvatarSelectorOpen(true)}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <Palette size={14} />
                      <span>Change Avatar</span>
                    </button>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white">John Doe</h4>
                    <p className="text-gray-400">john@example.com</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      defaultValue="John Doe"
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue="john@example.com"
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            {/* Account Security */}
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

            {/* Email Subscription Management */}
            <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Email Subscription</h3>
              <div className="space-y-6">
                {/* Current Subscription Status */}
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

            {/* Data Management */}
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
            <p className="text-gray-400">Manage your account settings and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 sticky top-8">
                {/* User Info */}
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

                {/* Menu Items */}
                <nav className="space-y-2">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        activeTab === item.id
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  ))}
                  
                  {/* Feedback Button */}
                  <button
                    onClick={() => setIsFeedbackModalOpen(true)}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-gray-300 hover:text-white hover:bg-gray-700/50 border-t border-gray-700/50 mt-4 pt-4"
                  >
                    <MessageSquare size={18} />
                    <span className="text-sm font-medium">Give Feedback</span>
                  </button>
                  
                  {/* Logout */}
                  <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-red-400 hover:text-red-300 hover:bg-red-900/20">
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {renderContent()}
            </div>
          </div>
        </div>

        {/* Feedback Modal */}
        <FeedbackModal />
        
        {/* Avatar Selector */}
        <AvatarSelector
          isOpen={isAvatarSelectorOpen}
          onClose={() => setIsAvatarSelectorOpen(false)}
          onSelect={(avatarUrl) => setCurrentAvatar(avatarUrl)}
          currentAvatar={currentAvatar}
          userName="John Doe"
        />
      </div>
    </PageTransition>
  );
};

export default Profile;