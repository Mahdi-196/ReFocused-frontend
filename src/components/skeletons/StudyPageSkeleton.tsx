import { SkeletonWrapper, Skeleton } from './SkeletonConfig';

export const StudyPageSkeleton = () => {
  return (
    <SkeletonWrapper>
      <div className="min-h-screen py-8" style={{ backgroundColor: '#1A2537' }}>
        <div className="container mx-auto px-4">
          {/* Pomodoro (outline only) */}
          <section className="mb-12">
            <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
              <Skeleton height={28} width={220} className="mb-6 mx-auto" />
              <div className="flex justify-center mb-6">
                <Skeleton height={180} width={180} circle />
              </div>
              <Skeleton height={44} width={320} className="mx-auto" />
            </div>
          </section>

          {/* Quick Notes (outline only) */}
          <section className="mb-12">
            <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <Skeleton height={24} width={140} className="mb-4" />
              <Skeleton height={200} />
            </div>
          </section>

          {/* Study Tools (outline only) */}
          <section className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                <Skeleton height={24} width={160} className="mb-4" />
                <Skeleton height={160} />
              </div>
              <div className="md:col-span-2 bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                <Skeleton height={24} width={180} className="mb-4" />
                <Skeleton height={220} className="mb-4" />
                <Skeleton height={40} width={240} className="mx-auto" />
              </div>
            </div>
          </section>

          {/* Statistics (outline only, mirror real component) */}
          <section className="mb-8">
            <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="inline-flex gap-2">
                  <Skeleton height={28} width={32} />
                  <Skeleton height={28} width={32} />
                  <Skeleton height={28} width={32} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 text-center border border-gray-600/30 rounded-lg">
                    <Skeleton height={16} width={100} className="mx-auto mb-2" />
                    <Skeleton height={24} width={80} className="mx-auto" />
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