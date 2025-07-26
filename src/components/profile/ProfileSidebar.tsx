import { User, Settings, Volume2, MessageSquare, LogOut } from 'lucide-react';

interface UserData {
  id: number;
  email: string;
  name: string;
  username?: string;
  createdAt: string;
  avatar?: string;
}

interface MenuItem {
  id: string;
  icon: React.ReactElement;
  label: string;
}

interface ProfileSidebarProps {
  userData: UserData | null;
  currentAvatar: string;
  activeTab: string;
  loading: boolean;
  avatarLoading?: boolean;
  onTabChange: (tab: string) => void;
  onFeedbackClick: () => void;
  onLogout: () => void;
}

const menuItems: MenuItem[] = [
  { id: 'profile', icon: <User size={18} />, label: 'Profile' },
  { id: 'settings', icon: <Settings size={18} />, label: 'Account Settings' },
  { id: 'app-settings', icon: <Volume2 size={18} />, label: 'Audio' },
];

export const ProfileSidebar = ({
  userData,
  currentAvatar,
  activeTab,
  loading,
  avatarLoading = false,
  onTabChange,
  onFeedbackClick,
  onLogout
}: ProfileSidebarProps) => {
  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 sticky top-8">
      <div className="text-center mb-6 pb-6 border-b border-gray-700/50">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700/50 border-2 border-gray-600/50 mx-auto mb-3 relative">
          {avatarLoading && (
            <div className="absolute inset-0 bg-gray-700/50 flex items-center justify-center z-10">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <img 
            src={currentAvatar} 
            alt="Profile Avatar" 
            className={`w-full h-full object-cover transition-opacity duration-300 ${avatarLoading ? 'opacity-0' : 'opacity-100'}`}
          />
        </div>
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-700 rounded w-24 mx-auto"></div>
            <div className="h-3 bg-gray-700 rounded w-32 mx-auto"></div>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-white">
              {userData?.name || userData?.username || 'User'}
            </h3>
            <p className="text-sm text-gray-400">{userData?.email}</p>
          </>
        )}
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
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
          onClick={onFeedbackClick}
          className="w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left text-gray-300 hover:text-white hover:bg-gray-700/50 border-t border-gray-700/50 mt-4 pt-4"
        >
          <MessageSquare size={18} />
          <span className="text-sm font-medium">Give Feedback</span>
        </button>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </nav>
    </div>
  );
};