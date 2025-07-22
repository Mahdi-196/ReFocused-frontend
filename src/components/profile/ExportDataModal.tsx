import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Download, CheckCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestExport: () => Promise<{
    message: string;
    status: string;
    task_id: string;
    user_id: number;
    requested_at: string;
    estimated_completion: string;
    next_steps: string[];
  }>;
  onCheckStatus: (taskId: string) => Promise<{
    task_id: string;
    user_id: number;
    status: 'PENDING' | 'SUCCESS' | 'FAILURE';
    checked_at: string;
    message: string;
    completed_at?: string;
    file_path?: string;
    data_summary?: Record<string, number>;
    download_instructions?: string;
    progress?: string;
    error?: string;
    retry_instructions?: string;
  }>;
  userEmail: string;
}

export const ExportDataModal = ({ 
  isOpen, 
  onClose, 
  onRequestExport,
  onCheckStatus,
  userEmail 
}: ExportDataModalProps) => {
  const [step, setStep] = useState<'info' | 'processing' | 'completed' | 'error'>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [taskId, setTaskId] = useState<string>('');
  const [exportData, setExportData] = useState<any>(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);

  const resetModal = () => {
    setStep('info');
    setIsLoading(false);
    setError('');
    setTaskId('');
    setExportData(null);
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      resetModal();
      onClose();
    }
  };

  const handleRequestExport = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await onRequestExport();
      setTaskId(result.task_id);
      setExportData(result);
      setStep('processing');
      
      // Start checking status every 3 seconds
      const interval = setInterval(async () => {
        try {
          const statusResult = await onCheckStatus(result.task_id);
          
          if (statusResult.status === 'SUCCESS') {
            setExportData(statusResult);
            setStep('completed');
            clearInterval(interval);
            setStatusCheckInterval(null);
          } else if (statusResult.status === 'FAILURE') {
            setError(statusResult.error || statusResult.message || 'Export failed');
            setStep('error');
            clearInterval(interval);
            setStatusCheckInterval(null);
          }
          // If PENDING, keep checking
        } catch (err) {
          console.error('Status check failed:', err);
          // Continue checking - network issues shouldn't stop the process
        }
      }, 3000);
      
      setStatusCheckInterval(interval);
    } catch (err: any) {
      setError(err.message || 'Failed to request data export. Please try again.');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    resetModal();
    setStep('info');
  };

  const handleDownload = () => {
    if (exportData?.file_path) {
      // Create a download link
      const downloadUrl = `/api/v1/user/me/export/${taskId}/download`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `my_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Cleanup interval on unmount or close
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-gray-900/95 to-slate-900/95 backdrop-blur-sm border border-blue-700/50 rounded-2xl max-w-md w-full p-8 relative shadow-2xl"
      >
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center transition-colors disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-gray-300" />
        </button>

        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            step === 'completed' 
              ? 'bg-gradient-to-br from-green-500 to-green-600' 
              : step === 'error'
              ? 'bg-gradient-to-br from-red-500 to-red-600'
              : step === 'processing'
              ? 'bg-gradient-to-br from-yellow-500 to-yellow-600'
              : 'bg-gradient-to-br from-blue-500 to-blue-600'
          }`}>
            {step === 'completed' ? (
              <CheckCircle className="w-8 h-8 text-white" />
            ) : step === 'error' ? (
              <AlertTriangle className="w-8 h-8 text-white" />
            ) : step === 'processing' ? (
              <Clock className="w-8 h-8 text-white" />
            ) : (
              <Download className="w-8 h-8 text-white" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {step === 'completed' ? 'Export Ready' : 
             step === 'error' ? 'Export Failed' :
             step === 'processing' ? 'Processing Export' : 'Export Your Data'}
          </h2>
          <p className="text-gray-300 text-sm">
            {step === 'completed' ? 'Your data export is ready for download' : 
             step === 'error' ? 'Something went wrong with your export' :
             step === 'processing' ? 'Your export is being processed' : 'Download a complete copy of your data'}
          </p>
        </div>

        {step === 'info' && (
          <div className="space-y-6">
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <h3 className="text-blue-400 font-semibold mb-2">📦 What's Included</h3>
              <p className="text-sm text-gray-300 mb-4">
                Your export will include all of your personal data:
              </p>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>Goals and progress tracking</li>
                <li>Habits and completion history</li>
                <li>Journal entries and collections</li>
                <li>Mood tracking data</li>
                <li>Study sets and flashcards</li>
                <li>Personal mantras and settings</li>
                <li>Activity statistics and calendar data</li>
              </ul>
              <p className="text-sm text-blue-400 mt-4 font-medium">
                Format: Human-readable JSON file
              </p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-300">
                <strong>Account:</strong> {userEmail}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Export processing typically takes a few minutes.
              </p>
              
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <p className="text-sm text-blue-300 font-medium">
                  Password-protected content will not be exported
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  This includes any journal entries or data that you've specifically password-protected
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestExport}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Requesting...' : 'Request Export'}
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-6">
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
              <h3 className="text-yellow-400 font-semibold mb-2">⏳ Processing</h3>
              <p className="text-sm text-gray-300 mb-4">
                Your data export is being processed in the background. This usually takes a few minutes.
              </p>
              {exportData?.next_steps && (
                <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                  {exportData.next_steps.map((step: string, index: number) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-300">
                <strong>Task ID:</strong> <code className="text-blue-400 font-mono text-xs">{taskId}</code>
              </p>
              <p className="text-sm text-gray-300 mt-1">
                <strong>Started:</strong> {exportData?.requested_at ? new Date(exportData.requested_at).toLocaleString() : 'Just now'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
              <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />
              <p className="text-gray-300 text-sm">Checking status every few seconds...</p>
            </div>

            <button
              onClick={handleClose}
              className="w-full px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors font-medium"
            >
              Close (Export continues in background)
            </button>
          </div>
        )}

        {step === 'completed' && (
          <div className="space-y-6">
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-2">Export Complete</h3>
              <p className="text-sm text-gray-300 mb-4">
                Your data export has been successfully generated and is ready for download.
              </p>
              {exportData?.data_summary && (
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 mt-4">
                  <h4 className="text-gray-300 font-medium text-sm mb-2">Export Summary:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                    {Object.entries(exportData.data_summary).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-green-400">{value as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-300">
                <strong>Completed:</strong> {exportData?.completed_at ? new Date(exportData.completed_at).toLocaleString() : 'Just now'}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {exportData?.download_instructions || 'Click the download button below to save your data.'}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-6">
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
              <h3 className="text-red-400 font-semibold mb-2">❌ Export Failed</h3>
              <p className="text-sm text-gray-300 mb-4">
                {error}
              </p>
              {exportData?.retry_instructions && (
                <p className="text-sm text-gray-400">
                  {exportData.retry_instructions}
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={handleRetry}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};