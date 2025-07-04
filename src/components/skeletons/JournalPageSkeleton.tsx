import { SkeletonWrapper, Skeleton } from './SkeletonConfig';

export const JournalPageSkeleton = () => {
  return (
    <SkeletonWrapper>
      <div 
        className="min-h-screen py-8"
        style={{ backgroundColor: "#1A2537" }}
      >
        <div className="max-w-full mx-auto px-6">
          
          {/* Header Section */}
          <div className="mb-8 text-center">
            <Skeleton height={32} width={100} className="mb-3 mx-auto" />
            <Skeleton height={20} width={400} className="mx-auto" />
          </div>

          {/* Main Layout - Three Columns */}
          <div className="flex flex-col xl:flex-row gap-8 min-h-screen">
            
            {/* Left Column - Main Journal Content */}
            <div className="flex-1 xl:flex-[2] max-w-none">
              <div className="mb-8">
                
                {/* Collection Navigation Tabs */}
                <div className="flex space-x-1 mb-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} height={40} width={120} />
                  ))}
                  <Skeleton height={40} width={40} />
                </div>
                
                {/* Search and Actions Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <Skeleton height={40} width={300} />
                    <Skeleton height={40} width={100} />
                    <Skeleton height={40} width={100} />
                  </div>
                  <Skeleton height={40} width={120} />
                </div>
              </div>

              {/* Entry Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                    
                    {/* Entry header */}
                    <div className="flex items-center justify-between mb-4">
                      <Skeleton height={16} width={80} />
                      <Skeleton height={20} width={20} />
                    </div>
                    
                    {/* Entry title */}
                    <Skeleton height={20} width={150} className="mb-3" />
                    
                    {/* Entry content preview */}
                    <Skeleton height={14} count={3} className="mb-4" />
                    
                    {/* Entry metadata */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-600/30">
                      <Skeleton height={12} width={60} />
                      <div className="flex items-center gap-2">
                        <Skeleton height={16} width={16} />
                        <Skeleton height={16} width={16} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="flex-1 xl:flex-[1] max-w-none xl:max-w-sm">
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                
                {/* Gratitude Section Header */}
                <div className="flex items-center justify-between mb-6">
                  <Skeleton height={24} width={120} />
                  <Skeleton height={32} width={80} />
                </div>
                
                {/* Gratitude Input */}
                <div className="mb-6">
                  <Skeleton height={40} width="100%" className="mb-3" />
                  <Skeleton height={36} width={100} />
                </div>
                
                {/* Gratitude List */}
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-3 border border-gray-600/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Skeleton height={16} width={120} />
                        <Skeleton height={16} width={16} />
                      </div>
                      <Skeleton height={14} count={2} />
                    </div>
                  ))}
                </div>
                
                {/* Stats */}
                <div className="mt-6 pt-6 border-t border-gray-600/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <Skeleton height={24} width={40} className="mb-2" />
                      <Skeleton height={16} width={60} />
                    </div>
                    <div className="text-center">
                      <Skeleton height={24} width={40} className="mb-2" />
                      <Skeleton height={16} width={80} />
                    </div>
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