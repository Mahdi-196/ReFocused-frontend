import { SkeletonWrapper, Skeleton } from './SkeletonConfig';

export const HomePageSkeleton = () => {
  return (
    <SkeletonWrapper>
      <div 
        className="min-h-screen py-8"
        style={{ backgroundColor: "#1A2537" }}
      >
        <div className="container mx-auto px-6 max-w-7xl">
          {/* Home page uses lg:grid-cols-3 layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Daily Momentum - Large card spanning full width on mobile */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton height={24} width={150} />
                  <Skeleton height={20} width={80} />
                </div>
                
                {/* Progress bars */}
                <div className="space-y-4 mb-6">
                  <div>
                    <Skeleton height={16} width={100} className="mb-2" />
                    <Skeleton height={8} />
                  </div>
                  <div>
                    <Skeleton height={16} width={120} className="mb-2" />
                    <Skeleton height={8} />
                  </div>
                </div>
                
                {/* Task input area */}
                <div className="border-t border-gray-600/30 pt-4">
                  <Skeleton height={40} className="mb-3" />
                  <div className="space-y-2">
                    <Skeleton height={32} />
                    <Skeleton height={32} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Access & Word of the Day - Right column */}
            <div className="lg:col-span-1">
              <div className="flex flex-col gap-6">
                {/* Quick Access */}
                <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <Skeleton height={20} width={100} className="mb-4" />
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton height={60} />
                    <Skeleton height={60} />
                    <Skeleton height={60} />
                    <Skeleton height={60} />
                  </div>
                </div>
                
                {/* Word of the Day */}
                <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <Skeleton height={20} width={120} className="mb-4" />
                  <Skeleton height={32} width={150} className="mb-2" />
                  <Skeleton height={16} count={2} />
                </div>
              </div>
            </div>

            {/* Goal Tracker - Full width row */}
            <div className="lg:col-span-3">
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <Skeleton height={24} width={100} />
                  <Skeleton height={32} width={120} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="p-4 border border-gray-600/30 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <Skeleton height={16} width={80} />
                        <Skeleton height={20} width={60} />
                      </div>
                      <Skeleton height={12} count={2} className="mb-2" />
                      <Skeleton height={6} className="mb-2" />
                      <div className="flex justify-between text-xs">
                        <Skeleton height={12} width={40} />
                        <Skeleton height={12} width={50} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mind Fuel - Single column */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                <Skeleton height={24} width={100} className="mb-4" />
                
                {/* Content sections */}
                <div className="space-y-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton height={14} width={80} className="mb-2" />
                      <Skeleton height={12} count={i === 0 ? 2 : 1} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Productivity Score - Full width */}
            <div className="lg:col-span-3">
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Skeleton height={24} width={180} />
                </div>
                
                <div className="flex flex-col items-center">
                  {/* Circular progress */}
                  <Skeleton height={96} width={96} circle className="mb-2" />
                  <Skeleton height={14} width={120} className="mb-2" />

                  {/* Stats Grid */}
                  <div className="w-full grid grid-cols-2 gap-4 mt-2 bg-gray-700/30 p-3 rounded-lg">
                    <div className="text-center">
                      <Skeleton height={32} width={30} className="mb-1 mx-auto" />
                      <Skeleton height={14} width={70} />
                    </div>
                    <div className="text-center">
                      <Skeleton height={32} width={30} className="mb-1 mx-auto" />
                      <Skeleton height={14} width={80} />
                    </div>
                  </div>

                  {/* Points Breakdown */}
                  <div className="w-full mt-2 space-y-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className={`flex justify-between text-sm ${i === 3 ? 'pt-1 border-t border-gray-600/50' : ''}`}>
                        <Skeleton height={14} width={120} />
                        <Skeleton height={14} width={30} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SkeletonWrapper>
  );
}; 