import { BarChart3, Target, Calendar, BookOpen, Brain, Heart, PenTool } from 'lucide-react';

interface UserStats {
  goals_total: number;
  goals_completed: number;
  habits_total: number;
  mood_entries_count: number;
  study_sets_count: number;
  trackings_count: number;
  journal_collections_count: number;
  account_age_days: number;
}

interface UserStatsProps {
  stats: UserStats | null;
  loading: boolean;
}

export const UserStats = ({ stats, loading }: UserStatsProps) => {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800/90 to-slate-800/90 backdrop-blur-lg border border-gray-700/60 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-2 bg-blue-600/20 rounded-xl">
            <BarChart3 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Your Statistics</h3>
            <p className="text-gray-400 text-sm">Track your progress and achievements</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-700 rounded-lg mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2 mt-1"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gradient-to-br from-gray-800/90 to-slate-800/90 backdrop-blur-lg border border-gray-700/60 rounded-2xl p-8 shadow-2xl">
        <div className="text-center text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No statistics available</p>
        </div>
      </div>
    );
  }

  const statItems = [
    {
      icon: Target,
      label: 'Goals',
      value: stats.goals_total,
      subtitle: `${stats.goals_completed} completed`,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      icon: Calendar,
      label: 'Habits',
      value: stats.habits_total,
      subtitle: 'tracked',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      icon: Heart,
      label: 'Mood Entries',
      value: stats.mood_entries_count,
      subtitle: 'logged',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20'
    },
    {
      icon: Brain,
      label: 'Study Sets',
      value: stats.study_sets_count,
      subtitle: 'created',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      icon: BookOpen,
      label: 'trackings',
      value: stats.trackings_count,
      subtitle: 'collected',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20'
    },
    {
      icon: PenTool,
      label: 'Journal Collections',
      value: stats.journal_collections_count,
      subtitle: 'created',
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/20'
    },
    {
      icon: Calendar,
      label: 'Account Age',
      value: stats.account_age_days,
      subtitle: 'days',
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/20'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-800/90 to-slate-800/90 backdrop-blur-lg border border-gray-700/60 rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-2 bg-blue-600/20 rounded-xl">
          <BarChart3 className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Your Statistics</h3>
          <p className="text-gray-400 text-sm">Track your progress and achievements</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((item, index) => (
          <div key={index} className={`${item.bgColor} border border-gray-600/30 rounded-lg p-4 text-center`}>
            <div className="flex justify-center mb-2">
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div className="text-2xl font-bold text-white mb-1">{item.value}</div>
            <div className="text-xs text-gray-400">{item.label}</div>
            <div className="text-xs text-gray-500 mt-1">{item.subtitle}</div>
          </div>
        ))}
      </div>
    </div>
  );
};