'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, X, Star } from 'lucide-react';

interface FeedbackData {
  rating: number;
  category: string;
  message: string;
  contact: string;
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (feedback: FeedbackData) => void;
}

const FeedbackModal = ({ isOpen, onClose, onSubmit }: FeedbackModalProps) => {
  const [feedbackData, setFeedbackData] = useState<FeedbackData>({
    rating: 0,
    category: '',
    message: '',
    contact: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackCategories = [
    'General Feedback',
    'Bug Report', 
    'Feature Request',
    'User Experience',
    'Performance Issues',
    'Content Suggestions'
  ];

  const handleSubmit = async () => {
    if (feedbackData.rating === 0 || !feedbackData.category || !feedbackData.message.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (feedbackData.message.length < 10) {
      alert('Please provide at least 10 characters in your message');
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the provided onSubmit callback if available
      if (onSubmit) {
        await onSubmit(feedbackData);
      } else {
        // Default behavior - log to console
        console.log('Feedback submitted:', feedbackData);
      }

      // Reset form and close modal
      setFeedbackData({
        rating: 0,
        category: '',
        message: '',
        contact: ''
      });
      
      onClose();
      
      // Show success message
      alert('Thank you for your feedback! We appreciate your input.');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('There was an error submitting your feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    
    // Check if user has entered data
    const hasData = feedbackData.rating > 0 || 
                   feedbackData.category || 
                   feedbackData.message.trim() || 
                   feedbackData.contact.trim();

    if (hasData) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }

    // Reset form
    setFeedbackData({
      rating: 0,
      category: '',
      message: '',
      contact: ''
    });
    
    onClose();
  };

  if (!isOpen) return null;

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
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={isSubmitting}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed ${
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
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
            maxLength={1000}
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex justify-between mt-2">
            <span className={`text-xs ${feedbackData.message.length < 10 ? 'text-red-400' : 'text-gray-400'}`}>
              Minimum 10 characters {feedbackData.message.length < 10 && `(${10 - feedbackData.message.length} more needed)`}
            </span>
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
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">
            Leave this blank if you prefer to remain anonymous
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || feedbackData.rating === 0 || !feedbackData.category || feedbackData.message.length < 10}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </div>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default FeedbackModal; 