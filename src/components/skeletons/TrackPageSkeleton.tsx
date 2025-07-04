import { SkeletonWrapper, Skeleton } from './SkeletonConfig';

export const TrackPageSkeleton = () => {
  return (
    <SkeletonWrapper>
      <div 
        className="min-h-screen py-8"
        style={{ backgroundColor: "#1A2537" }}
      >
        <div className="container mx-auto px-4">
          
          {/* Header Section */}
          <header className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <Skeleton height={32} width={250} className="mb-2" />
                <Skeleton height={16} width={350} />
              </div>
              
              {/* Cache Controls */}
              <div className="relative">
                <Skeleton height={40} width={120} />
              </div>
            </div>
          </header>

          {/* Stats Section */}
          <section className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div 
                  key={i}
                  className="rounded-lg p-4 shadow-md"
                  style={{ background: "linear-gradient(135deg, #1F2938 0%, #1E2837 100%)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton height={14} width={80} />
                    <Skeleton height={20} width={20} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton height={32} width={40} />
                    <Skeleton height={16} width={60} />
                    <Skeleton height={20} width={20} />
                  </div>
                  {/* Progress bar for second card */}
                  {i === 1 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <Skeleton height={8} width="60%" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Habit Tracking Section */}
          <section className="mb-8">
            <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              
              {/* Add Habit Input */}
              <div className="mb-6">
                <div className="flex gap-3">
                  <Skeleton height={40} width="100%" />
                  <Skeleton height={40} width={100} />
                </div>
              </div>

              {/* Filter and Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Skeleton height={16} width={120} />
                  <Skeleton height={32} width={120} />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton height={16} width={80} />
                  <Skeleton height={16} width={30} />
                </div>
              </div>

              {/* Habits List */}
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div 
                    key={i}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-lg border border-gray-600/30"
                  >
                    <div className="flex items-center gap-4">
                      <Skeleton height={24} width={24} />
                      <div>
                        <Skeleton height={16} width={120} className="mb-1" />
                        <Skeleton height={12} width={80} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton height={16} width={60} />
                      <Skeleton height={20} width={20} />
                      <Skeleton height={32} width={32} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Mood Tracking Section */}
          <section className="mb-8">
            <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <Skeleton height={24} width={150} />
                <Skeleton height={32} width={100} />
              </div>
              
              {/* Mood Scale */}
              <div className="mb-6">
                <Skeleton height={16} width={100} className="mb-3" />
                <div className="flex justify-between items-center mb-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} height={32} width={32} />
                  ))}
                </div>
                <div className="flex justify-between text-sm mb-4">
                  <Skeleton height={12} width={40} />
                  <Skeleton height={12} width={40} />
                </div>
              </div>

              {/* Additional Mood Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Focus', 'Stress', 'Energy'].map((metric, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton height={16} width={60} />
                    <div className="flex justify-between items-center">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Skeleton key={j} height={24} width={24} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Calendar Section */}
          <section>
            <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Skeleton height={32} width={32} />
                  <Skeleton height={24} width={150} />
                  <Skeleton height={32} width={32} />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton height={32} width={60} />
                  <Skeleton height={32} width={60} />
                </div>
              </div>
              
              {/* Calendar Grid */}
              <div className="mb-6">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="text-center">
                      <Skeleton height={16} width={30} />
                    </div>
                  ))}
                </div>
                
                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-gradient-to-br from-gray-700/50 to-gray-600/50 rounded-lg border border-gray-600/30 p-2">
                      <Skeleton height={14} width={20} className="mb-1" />
                      <div className="space-y-1">
                        <Skeleton height={6} width="100%" />
                        <Skeleton height={6} width="80%" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar Legend */}
              <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-600/30">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton height={16} width={16} />
                    <Skeleton height={12} width={60} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </SkeletonWrapper>
  );
}; 