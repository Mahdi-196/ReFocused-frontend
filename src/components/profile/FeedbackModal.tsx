import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Star } from 'lucide-react';

interface FeedbackData {
  rating: number;
  category: string;
  message: string;
  contact: string;
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedbackData: FeedbackData;
  setFeedbackData: (data: FeedbackData) => void;
  onSubmit: () => void;
}

const feedbackCategories = [
  'General Feedback',
  'Bug Report',
  'Feature Request',
  'User Experience',
  'Performance Issues',
  'Content Suggestions'
];

export const FeedbackModal = ({ 
  isOpen, 
  onClose, 
  feedbackData, 
  setFeedbackData, 
  onSubmit 
}: FeedbackModalProps) => {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ 
              duration: 0.2, 
              ease: [0.16, 1, 0.3, 1], // Custom easing for smooth feel
              layout: { duration: 0.2 }
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-gray-900 to-slate-900 border border-gray-700/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl"
            style={{
              willChange: 'transform, opacity', // Optimize for animations
              backfaceVisibility: 'hidden', // Prevent flickering
            }}
          >
        <button
          onClick={onClose}
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
                onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
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
            onChange={(e) => setFeedbackData({ ...feedbackData, category: e.target.value })}
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
            onChange={(e) => setFeedbackData({ ...feedbackData, message: e.target.value })}
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
            onChange={(e) => setFeedbackData({ ...feedbackData, contact: e.target.value })}
            placeholder="your@email.com (if you'd like a response)"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            Submit Feedback
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};