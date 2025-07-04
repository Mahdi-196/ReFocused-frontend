// Centralized icon exports for better tree shaking and consistency
// Import only the icons we actually use to reduce bundle size

// Lucide React Icons (most commonly used)
export {
  User,
  Settings,
  Award,
  CreditCard,
  HelpCircle,
  Share2,
  LogOut,
  Play,
  Pause,
  Clock,
  Box,
  Star,
  Heart,
  Sun,
  Wind,
  Activity,
  Brain,
  ChevronRight,
  ChevronLeft,
  X,
  Trees,
  Waves,
  CloudRain,
  Zap,
  Bird,
  Droplets,
  Flame,
  Coffee,
  Music,
  Infinity,
  RotateCcw,
  ChevronsRight,
  UserRoundCog,
  Sparkles,
  RefreshCw,
  Check,
  Shuffle,
  Palette,
  Bot,
  Lightbulb,
  BarChart3,
  Plus,
  Info,
  Lock,
  Unlock,
  Camera,
  Volume2,
  VolumeX,
  Bell,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  ArrowUp,
  Send
} from 'lucide-react';

// React Icons (FI - Feather Icons)
export {
  FiZap,
  FiTarget,
  FiClock,
  FiBook,
  FiHeart,
  FiBarChart2,
  FiUsers,
  FiTrendingUp,
  FiCheckCircle,
  FiMail,
  FiLock,
  FiUser,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';

// Type definitions for better TypeScript support
export type IconComponent = React.ComponentType<{ 
  size?: number | string; 
  className?: string; 
  color?: string;
}>;

// Common icon size constants
export const IconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48
} as const;

// Common icon style classes
export const IconStyles = {
  primary: 'text-blue-500',
  secondary: 'text-gray-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  danger: 'text-red-500',
  muted: 'text-gray-400'
} as const;

export { default as FireIcon } from './FireIcon';
export { default as CheckIcon } from './CheckIcon'; 