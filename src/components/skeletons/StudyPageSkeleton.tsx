import { SkeletonWrapper, Skeleton } from './SkeletonConfig';

export const StudyPageSkeleton = () => {
  return (
    <SkeletonWrapper>
      <div 
        className="min-h-screen py-8"
        style={{ backgroundColor: "#1A2537" }}
      >
        <div className="container mx-auto px-4">
          
          {/* Pomodoro Timer Section */}
          <section className="mb-12">
            <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
              <div className="text-center">
                <Skeleton height={32} width={200} className="mb-6 mx-auto" />
                
                {/* Timer circle */}
                <div className="flex justify-center mb-6">
                  <Skeleton height={200} width={200} circle />
                </div>
                
                {/* Timer controls */}
                <div className="flex justify-center gap-4 mb-6">
                  <Skeleton height={48} width={120} />
                  <Skeleton height={48} width={120} />
                  <Skeleton height={48} width={120} />
                </div>
                
                {/* Session info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="text-center">
                      <Skeleton height={16} width={80} className="mb-2" />
                      <Skeleton height={24} width={60} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Quick Notes Section */}
          <section className="mb-12">
            <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <Skeleton height={24} width={120} className="mb-4" />
              
              {/* Editor toolbar */}
              <div className="border-b border-gray-600/30 pb-3 mb-4">
                <div className="flex gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} height={32} width={32} />
                  ))}
                </div>
              </div>
              
              {/* Editor content area */}
              <Skeleton height={200} className="mb-4" />
              
              {/* Save button */}
              <div className="flex justify-end">
                <Skeleton height={36} width={100} />
              </div>
            </div>
          </section>

          {/* Study Tools Section - 3 column grid */}
          <section className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Study Sets Panel */}
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton height={20} width={100} />
                  <Skeleton height={32} width={80} />
                </div>
                
                {/* Study sets list */}
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-3 border border-gray-600/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Skeleton height={16} width={120} />
                        <Skeleton height={20} width={20} />
                      </div>
                      <Skeleton height={12} width={80} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Flashcard Display */}
              <div className="md:col-span-2">
                <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton height={20} width={120} />
                    <Skeleton height={32} width={100} />
                  </div>
                  
                  {/* Flashcard */}
                  <div className="border border-gray-600/30 rounded-lg p-8 mb-4">
                    <div className="text-center">
                      <Skeleton height={16} width={60} className="mb-4" />
                      <Skeleton height={24} width={200} className="mb-6" />
                      <Skeleton height={16} count={3} />
                    </div>
                  </div>
                  
                  {/* Flashcard controls */}
                  <div className="flex justify-center gap-4">
                    <Skeleton height={40} width={100} />
                    <Skeleton height={40} width={100} />
                    <Skeleton height={40} width={100} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Statistics Section */}
          <section className="mb-8">
            <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <Skeleton height={24} width={120} />
                <div className="flex gap-2">
                  <Skeleton height={32} width={60} />
                  <Skeleton height={32} width={60} />
                  <Skeleton height={32} width={60} />
                </div>
              </div>
              
              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center p-4 border border-gray-600/30 rounded-lg">
                    <Skeleton height={16} width={80} className="mb-2" />
                    <Skeleton height={28} width={60} className="mb-1" />
                    <Skeleton height={12} width={40} />
                  </div>
                ))}
              </div>
              
              {/* Charts area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-600/30 rounded-lg p-4">
                  <Skeleton height={16} width={100} className="mb-4" />
                  <Skeleton height={200} />
                </div>
                <div className="border border-gray-600/30 rounded-lg p-4">
                  <Skeleton height={16} width={100} className="mb-4" />
                  <Skeleton height={200} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </SkeletonWrapper>
  );
}; 