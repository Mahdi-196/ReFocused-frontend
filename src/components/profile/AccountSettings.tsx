import { useState } from 'react';
import { Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DeleteAccountModal } from './DeleteAccountModal';
import { ClearActivityModal } from './ClearActivityModal';
import { ExportDataModal } from './ExportDataModal';
import { authService } from '@/api/services/authService';

interface UserData {
  id: number;
  email: string;
  name: string;
  username?: string;
  createdAt: string;
  avatar?: string;
}

interface AccountSettingsProps {
  userData: UserData | null;
  isSubscribed: boolean;
  onSubscriptionToggle: () => void;
}

export const AccountSettings = ({ userData, isSubscribed, onSubscriptionToggle }: AccountSettingsProps) => {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isClearActivityModalOpen, setIsClearActivityModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      // TODO: Implement account deletion in authService
      // await authService.deleteAccount();
      // For now, just logout and redirect
      await authService.logout();
      router.push('/');
    } catch (error: unknown) {
      // Re-throw the error to be handled by the modal
      throw error;
    }
  };

  const handleClearActivity = async () => {
    try {
      console.log('🗑️ [CLEAR DATA] Starting activity data clearing...');
      const result = await authService.clearActivityData();
      console.log('✅ [CLEAR DATA] Successfully cleared data:', result);
      
      // Force a page reload to ensure all components refresh
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
      return result;
    } catch (error: unknown) {
      console.error('❌ [CLEAR DATA] Failed to clear activity data:', error);
      // Re-throw the error to be handled by the modal
      throw error;
    }
  };

  const handleRequestExport = async () => {
    try {
      // TODO: Implement data export in authService
      // const result = await authService.requestDataExport();
      // For now, return a mock result matching expected interface
      return {
        message: 'Export request submitted',
        status: 'pending',
        task_id: 'mock-task-id',
        user_id: 1,
        requested_at: new Date().toISOString(),
        estimated_completion: new Date(Date.now() + 60000).toISOString(),
        next_steps: ['Processing data', 'Generating export file', 'Sending notification']
      };
    } catch (error: unknown) {
      // Re-throw the error to be handled by the modal
      throw error;
    }
  };

  const handleCheckExportStatus = async (taskId: string) => {
    try {
      // TODO: Implement export status checking in authService
      // const result = await authService.checkExportStatus(taskId);
      // For now, return a mock result matching expected interface
      return {
        task_id: taskId,
        user_id: 1,
        status: 'SUCCESS' as const,
        checked_at: new Date().toISOString(),
        message: 'Export completed successfully',
        completed_at: new Date().toISOString(),
        file_path: '/exports/user-data.zip',
        download_url: '#'
      };
    } catch (error: unknown) {
      // Re-throw the error to be handled by the modal
      throw error;
    }
  };
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
                <p className="text-xs text-gray-400 mt-1">{userData?.email}</p>
              </div>
              <button
                onClick={onSubscriptionToggle}
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
            <button 
              onClick={() => setIsExportModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Request Data Export
            </button>
          </div>
          <div className="p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
            <h4 className="text-yellow-400 font-medium mb-2">Clear Activity Data</h4>
            <p className="text-sm text-gray-300 mb-3">Remove all your activity history while keeping your account active.</p>
            <button 
              onClick={() => setIsClearActivityModalOpen(true)}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Clear Data
            </button>
          </div>
          <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
            <h4 className="text-red-400 font-medium mb-2">Delete Account</h4>
            <p className="text-sm text-gray-300 mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>
            <button 
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleteAccount={handleDeleteAccount}
        userEmail={userData?.email || ''}
      />

      <ClearActivityModal
        isOpen={isClearActivityModalOpen}
        onClose={() => setIsClearActivityModalOpen(false)}
        onClearActivity={handleClearActivity}
        userEmail={userData?.email || ''}
      />

      <ExportDataModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onRequestExport={handleRequestExport}
        onCheckStatus={handleCheckExportStatus}
        userEmail={userData?.email || ''}
      />
    </div>
  );
};