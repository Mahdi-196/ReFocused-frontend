import { SkeletonWrapper, Skeleton } from './SkeletonConfig';

export const RelaxPageSkeleton = () => {
  return (
    <SkeletonWrapper>
      <div className="min-h-screen px-2 py-8">
        
        {/* Main Practice Section */}
        <div className="w-[70vw] max-w-none mx-auto mb-8">
          <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-5">
            
            {/* Toggle Switch */}
            <div className="flex justify-start mb-4">
              <div className="relative bg-gray-700/50 rounded-full p-1 flex w-64">
                <Skeleton height={40} width="50%" />
                <Skeleton height={40} width="50%" />
              </div>
            </div>
            
            {/* Breathing Exercises Section */}
            <div className="space-y-6">
              
              {/* Header */}
              <div className="p-8 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Skeleton height={48} width={48} />
                    <div>
                      <Skeleton height={24} width={180} className="mb-2" />
                      <Skeleton height={16} width={220} />
                    </div>
                  </div>
                  <Skeleton height={32} width={120} />
                </div>
                <Skeleton height={16} width="60%" />
              </div>
              
              {/* Breathing Techniques Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-gradient-to-br from-gray-800/60 to-slate-800/60 border border-gray-700/40 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-200">
                    
                    {/* Technique header */}
                    <div className="flex items-center gap-3 mb-4">
                      <Skeleton height={40} width={40} />
                      <div>
                        <Skeleton height={18} width={120} className="mb-1" />
                        <Skeleton height={14} width={80} />
                      </div>
                    </div>
                    
                    {/* Description */}
                    <Skeleton height={14} count={3} className="mb-4" />
                    
                    {/* Action button */}
                    <Skeleton height={36} width="100%" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Ambient Sounds & Weekly Theme Section */}
        <div className="w-full max-w-6xl mx-auto py-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Ambient Sounds Section - Left & Bigger */}
            <div className="flex-2 lg:w-[65%]">
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Skeleton height={24} width={150} />
                  <Skeleton height={20} width={100} />
                </div>
                
                {/* Sound categories */}
                <div className="flex gap-2 mb-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} height={36} width={80} />
                  ))}
                </div>
                
                {/* Sound grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="p-4 border border-gray-600/30 rounded-lg">
                      <Skeleton height={40} width={40} circle className="mb-3 mx-auto" />
                      <Skeleton height={14} width="100%" className="mb-2" />
                      <Skeleton height={12} width="80%" className="mx-auto" />
                    </div>
                  ))}
                </div>
                
                {/* Volume controls */}
                <div className="flex items-center justify-between">
                  <Skeleton height={16} width={60} />
                  <Skeleton height={32} width={200} />
                  <Skeleton height={16} width={40} />
                </div>
              </div>
            </div>

            {/* Weekly Theme - Right & Smaller */}
            <div className="flex-1 lg:w-[35%]">
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6 h-full">
                
                {/* Header with navigation */}
                <div className="flex items-center justify-between mb-6">
                  <Skeleton height={18} width={100} />
                  <div className="flex gap-2">
                    <Skeleton height={32} width={32} />
                    <Skeleton height={32} width={32} />
                  </div>
                </div>

                {/* Theme content */}
                <div className="text-center">
                  <Skeleton height={32} width={150} className="mb-3 mx-auto" />
                  <Skeleton height={14} count={3} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Practice Suggestions */}
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6">
            
            <Skeleton height={24} width={200} className="mb-6" />
            
            {/* Suggestion cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 border border-gray-600/30 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Skeleton height={40} width={40} />
                    <Skeleton height={18} width={120} />
                  </div>
                  <Skeleton height={14} count={4} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SkeletonWrapper>
  );
}; 