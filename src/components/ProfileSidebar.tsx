import { User, Settings, Award, CreditCard, HelpCircle, Share2, LogOut } from './icons';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const ProfileSidebar = () => {
  const menuItems: MenuItem[] = [
    { icon: <User size={18} />, label: 'Profile' },
    { icon: <Settings size={18} />, label: 'Account Settings' },
    { icon: <Award size={18} />, label: 'Badges' },
    { icon: <CreditCard size={18} />, label: 'Billing & Subscription' },
    { icon: <HelpCircle size={18} />, label: 'Help & Support' },
    { icon: <Share2 size={18} />, label: 'Invite Friends' },
    { icon: <LogOut size={18} />, label: 'Logout' },
  ];

  return (
    <div className="py-2">
      {/* User Info */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <User size={20} className="text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">User</p>
            <p className="text-xs text-gray-500">john@example.com</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="py-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            onClick={item.onClick}
          >
            <span className="text-gray-600">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default ProfileSidebar; 