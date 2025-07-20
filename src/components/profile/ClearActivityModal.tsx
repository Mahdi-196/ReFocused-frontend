import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, CheckCircle } from 'lucide-react';

interface ClearActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearActivity: () => Promise<{
    message: string;
    status: string;
    user_account_preserved: boolean;
    deleted_at: string;
    deletion_summary: Record<string, number>;
  }>;
  userEmail: string;
}

export const ClearActivityModal = ({ 
  isOpen, 
  onClose, 
  onClearActivity, 
  userEmail 
}: ClearActivityModalProps) => {
  const [step, setStep] = useState<'warning' | 'confirm' | 'success'>('warning');
  const [confirmationText, setConfirmationText] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState('');
  const [deletionSummary, setDeletionSummary] = useState<Record<string, number> | null>(null);

  const resetModal = () => {
    setStep('warning');
    setConfirmationText('');
    setIsClearing(false);
    setError('');
    setDeletionSummary(null);
  };

  const handleClose = () => {
    if (!isClearing) {
      resetModal();
      onClose();
    }
  };

  const handleClearActivity = async () => {
    setIsClearing(true);
    setError('');

    try {
      const result = await onClearActivity();
      setDeletionSummary(result.deletion_summary);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to clear activity data. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  const isConfirmationValid = confirmationText === 'Clear Activity Data';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-gray-900/95 to-slate-900/95 backdrop-blur-sm border border-yellow-700/50 rounded-2xl max-w-md w-full p-8 relative shadow-2xl"
      >
        <button
          onClick={handleClose}
          disabled={isClearing}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center transition-colors disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-gray-300" />
        </button>

        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            step === 'success' 
              ? 'bg-gradient-to-br from-green-500 to-green-600' 
              : 'bg-gradient-to-br from-yellow-500 to-yellow-600'
          }`}>
            {step === 'success' ? (
              <CheckCircle className="w-8 h-8 text-white" />
            ) : (
              <Trash2 className="w-8 h-8 text-white" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {step === 'success' ? 'Activity Data Cleared' : 'Clear Activity Data'}
          </h2>
          <p className="text-gray-300 text-sm">
            {step === 'success' 
              ? 'Your account remains active' 
              : 'This action cannot be undone'
            }
          </p>
        </div>

        {step === 'warning' && (
          <div className="space-y-6">
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
              <h3 className="text-yellow-400 font-semibold mb-2">⚠️ Warning</h3>
              <p className="text-sm text-gray-300 mb-4">
                Clearing your activity data will permanently remove:
              </p>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>All your goals and habits</li>
                <li>Journal entries and collections</li>
                <li>Mood tracking data</li>
                <li>Study sets and flashcards</li>
                <li>Activity statistics and progress</li>
                <li>Calendar entries and completions</li>
              </ul>
              <p className="text-sm text-green-400 mt-4 font-medium">
                Your account, email, and login will remain active
              </p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-300">
                <strong>Account:</strong> {userEmail}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('confirm')}
                className="flex-1 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-300 mb-4">
                To confirm clearing your activity data, please type:
              </p>
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 mb-4">
                <code className="text-yellow-400 font-mono text-sm select-none">Clear Activity Data</code>
              </div>
            </div>

            <div>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                onPaste={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onDrop={(e) => e.preventDefault()}
                onDragOver={(e) => e.preventDefault()}
                autoComplete="off"
                placeholder="Type the confirmation text"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('warning')}
                className="flex-1 px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors font-medium"
              >
                Back
              </button>
              <button
                onClick={handleClearActivity}
                disabled={!isConfirmationValid || isClearing}
                className="flex-1 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClearing ? 'Clearing...' : 'Clear Data'}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-6">
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-2">Success</h3>
              <p className="text-sm text-gray-300 mb-4">
                Your activity data has been successfully cleared. You can now start fresh while keeping your account.
              </p>
              {deletionSummary && (
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 mt-4">
                  <h4 className="text-gray-300 font-medium text-sm mb-2">Data Cleared:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                    {Object.entries(deletionSummary).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace(/_/g, ' ').replace('2week', '2 week')}:</span>
                        <span className="text-yellow-400">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleClose}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              Continue
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 mt-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {isClearing && (
          <div className="mt-4 p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-300 text-sm">Clearing activity data...</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};