import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteAccount: () => Promise<void>;
  userEmail: string;
}

export const DeleteAccountModal = ({ 
  isOpen, 
  onClose, 
  onDeleteAccount, 
  userEmail 
}: DeleteAccountModalProps) => {
  const [step, setStep] = useState<'warning' | 'confirm'>('warning');
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const resetModal = () => {
    setStep('warning');
    setConfirmationText('');
    setIsDeleting(false);
    setError('');
  };

  const handleClose = () => {
    if (!isDeleting) {
      resetModal();
      onClose();
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setError('');

    try {
      await onDeleteAccount();
      // The parent component should handle the success (redirect to login)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete account. Please try again.';
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const isConfirmationValid = confirmationText === 'Delete All Data';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-gray-900/95 to-slate-900/95 backdrop-blur-sm border border-red-700/50 rounded-2xl max-w-md w-full p-8 relative shadow-2xl"
      >
        <button
          onClick={handleClose}
          disabled={isDeleting}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center transition-colors disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-gray-300" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Delete Account</h2>
          <p className="text-gray-300 text-sm">This action cannot be undone</p>
        </div>

        {step === 'warning' && (
          <div className="space-y-6">
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
              <h3 className="text-red-400 font-semibold mb-2">⚠️ Warning</h3>
              <p className="text-sm text-gray-300 mb-4">
                Deleting your account will permanently remove:
              </p>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>All your goals and habits</li>
                <li>Journal entries and collections</li>
                <li>Mood tracking data</li>
                <li>Study sets and mantras</li>
                <li>Account settings and preferences</li>
                <li>All other personal data</li>
              </ul>
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
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
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
                To confirm account deletion, please type:
              </p>
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 mb-4">
                <code className="text-red-400 font-mono text-sm select-none">Delete All Data</code>
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
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
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
                onClick={handleDeleteAccount}
                disabled={!isConfirmationValid}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 mt-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {isDeleting && (
          <div className="mt-4 p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-300 text-sm">Deleting account and all data...</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};