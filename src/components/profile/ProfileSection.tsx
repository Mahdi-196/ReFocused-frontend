import { User, Camera } from 'lucide-react';

interface UserData {
  id: number;
  email: string;
  name: string;
  username?: string;
  createdAt: string;
  avatar?: string;
}

interface ProfileSectionProps {
  userData: UserData | null;
  currentAvatar: string;
  loading: boolean;
  error: string | null;
  avatarSaving: boolean;
  showAvatarSuccess: boolean;
  onAvatarClick: () => void;
  onChangeAvatar: () => void;
}

export const ProfileSection = ({
  userData,
  currentAvatar,
  loading,
  error,
  avatarSaving,
  showAvatarSuccess,
  onAvatarClick,
  onChangeAvatar
}: ProfileSectionProps) => {
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
                  onClick={onAvatarClick}
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700/50 border-2 border-gray-600/50 group-hover:border-blue-500/50 transition-colors">
                    <img 
                      src={currentAvatar} 
                      alt="Profile Avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {avatarSaving ? (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                
                <button
                  onClick={onChangeAvatar}
                  disabled={avatarSaving}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-sm rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                >
                  {avatarSaving ? (
                    <>
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    'Change Avatar'
                  )}
                </button>
                
                {showAvatarSuccess && (
                  <div className="mt-2 px-3 py-2 bg-green-900/30 border border-green-700/50 rounded-lg text-green-400 text-xs flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Avatar saved successfully!
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-6 w-full lg:w-auto">
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-700 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                  </div>
                ) : error ? (
                  <div className="text-red-400 text-sm">{error}</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-xl font-semibold text-white">
                          {userData?.name || userData?.username || 'User'}
                        </h4>
                        <svg className="w-4 h-4 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                      <p className="text-gray-300 text-sm">{userData?.email}</p>
                      <p className="text-gray-400 text-sm">
                        Member since {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        }) : 'Unknown'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};