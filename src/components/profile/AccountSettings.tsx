import { useState, useEffect } from 'react';
import { emailSubscriptionService } from '@/api/services/emailSubscriptionService';
import { Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DeleteAccountModal } from './DeleteAccountModal';
import { ClearActivityModal } from './ClearActivityModal';
import { ExportDataModal } from './ExportDataModal';
import AvatarSelector from '@/components/AvatarSelector';
import { authService } from '@/api/services/authService';
import { avatarService } from '@/api/services/avatarService';

interface UserData {
  id: number;
  email: string;
  name: string;
  username?: string;
  createdAt: string;
  avatar?: string;
  profile_picture?: string;
}

interface AccountSettingsProps {
  userData: UserData | null;
  isSubscribed: boolean;
  onSubscriptionToggle: () => void;
  onUserDataUpdate?: (updatedData: Partial<UserData>) => void;
}

export const AccountSettings = ({ userData, isSubscribed, onSubscriptionToggle, onUserDataUpdate }: AccountSettingsProps) => {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isClearActivityModalOpen, setIsClearActivityModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(userData?.profile_picture || userData?.avatar || '');
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Load current avatar on component mount and when userData changes
  useEffect(() => {
    const loadCurrentAvatar = async () => {
      try {
        const response = await avatarService.getCurrentAvatar();
        setCurrentAvatar(response.avatar_url);
      } catch (error) {
        // If API call fails, fall back to userData
        setCurrentAvatar(userData?.profile_picture || userData?.avatar || '');
      }
    };

    loadCurrentAvatar();
  }, [userData]);

  // Check email subscription status on mount for the provided email
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await emailSubscriptionService.status(userData?.email || 'cheaxx123@gmail.com');
        if (typeof res?.isSubscribed === 'boolean' && res.isSubscribed !== isSubscribed) {
          onSubscriptionToggle();
        }
      } catch (e) {
        // ignore
      }
    };
    if (userData?.email) {
      checkStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.email]);

  // Update local state when userData changes
  useEffect(() => {
    if (userData?.profile_picture || userData?.avatar) {
      setCurrentAvatar(userData.profile_picture || userData.avatar || '');
    }
  }, [userData?.profile_picture, userData?.avatar]);

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

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      await emailSubscriptionService.subscribe(userData?.email || 'cheaxx123@gmail.com');
      onSubscriptionToggle();
    } catch (error: any) {
      // Silently fail - don't show error
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsSubscribing(true);
    try {
      await emailSubscriptionService.unsubscribe(userData?.email || 'cheaxx123@gmail.com');
      onSubscriptionToggle();
    } catch (error: any) {
      // Silently fail - don't show error
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setCurrentAvatar(avatarUrl);
    // Update parent component with new avatar
    if (onUserDataUpdate) {
      onUserDataUpdate({ profile_picture: avatarUrl });
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <User className="w-5 h-5 mr-2 text-blue-400" />
          Profile Picture
        </h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gray-700/50 border-2 border-gray-600/50 overflow-hidden">
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="Profile avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-gray-300 text-sm mb-3">
              Choose from our collection of avatars to personalize your profile
            </p>
            <button
              onClick={() => setIsAvatarSelectorOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Change Avatar
            </button>
          </div>
        </div>
      </div>

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
                <p className="text-xs text-gray-400 mt-1">{userData?.email || 'cheaxx123@gmail.com'}</p>
              </div>
              <button
                onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
                disabled={isSubscribing}
                className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
                  isSubscribed 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } ${isSubscribing ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {isSubscribed ? (isSubscribing ? 'Unsubscribing...' : 'Unsubscribe') : (isSubscribing ? 'Subscribing...' : 'Subscribe')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Data Management</h3>
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-cyan-500/10 border border-blue-500/20 p-5">
            <div className="relative z-10">
              <h4 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Your Data
              </h4>
              <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                Download a complete archive of your personal data including journal entries, goals, habits, mood tracking, and all settings. Perfect for backup or data portability.
              </p>
              <button 
                onClick={() => setIsExportModalOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30 text-blue-200 rounded-lg transition-all duration-200 text-sm font-medium hover:scale-105"
              >
                Request Data Export
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/10 via-yellow-600/5 to-orange-500/10 border border-amber-500/20 p-5">
            <div className="relative z-10">
              <h4 className="text-amber-300 font-semibold mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Activity Data
              </h4>
              <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                Reset your progress and start fresh while keeping your account. This will remove all habits, goals, journal entries, and activity history but preserve your login credentials.
              </p>
              <button 
                onClick={() => setIsClearActivityModalOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 text-amber-200 rounded-lg transition-all duration-200 text-sm font-medium hover:scale-105"
              >
                Clear Data
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500/10 via-rose-600/5 to-pink-500/10 border border-red-500/20 p-5">
            <div className="relative z-10">
              <h4 className="text-red-300 font-semibold mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Delete Account
              </h4>
              <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                Permanently and irreversibly delete your entire account. This will remove everything including your login credentials, personal data, and cannot be recovered.
              </p>
              <button 
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-500/30 text-red-200 rounded-lg transition-all duration-200 text-sm font-medium hover:scale-105"
              >
                Delete Account
              </button>
            </div>
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

      <AvatarSelector
        isOpen={isAvatarSelectorOpen}
        onClose={() => setIsAvatarSelectorOpen(false)}
        onSelect={handleAvatarSelect}
        currentAvatar={currentAvatar}
        userName={userData?.name || 'User'}
      />
    </div>
  );
};