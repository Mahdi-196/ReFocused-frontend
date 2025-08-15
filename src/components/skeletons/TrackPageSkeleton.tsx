import { SkeletonWrapper, Skeleton } from './SkeletonConfig';

export const TrackPageSkeleton = () => {
  return (
    <SkeletonWrapper>
      <div className="min-h-screen py-8" style={{ backgroundColor: '#1A2537' }}>
        <div className="container mx-auto px-4">
          {/* Header */}
          <header className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <Skeleton height={28} width={240} className="mb-2" />
                <Skeleton height={14} width={320} />
              </div>
              <Skeleton height={40} width={120} />
            </div>
          </header>

          {/* Stats (outline only) */}
          <section className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg p-4 border border-gray-700/40 bg-gray-800/30">
                  <Skeleton height={22} className="mb-3" />
                  <Skeleton height={18} width="60%" />
                </div>
              ))}
            </div>
          </section>

          {/* Habit Tracking (outline only) */}
          <section className="mb-8">
            <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <Skeleton height={24} width={200} className="mb-4" />
              <Skeleton height={40} className="mb-4" />
              <Skeleton height={160} />
            </div>
          </section>

          {/* Mood Tracking (outline only) */}
          <section className="mb-8">
            <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <Skeleton height={24} width={180} className="mb-6" />
              <Skeleton height={80} className="mb-4" />
              <Skeleton height={40} />
            </div>
          </section>

          {/* Calendar (outline only) */}
          <section>
            <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <Skeleton height={24} width={160} className="mb-6" />
              <Skeleton height={360} className="mb-4" />
              <Skeleton height={20} width={240} className="mx-auto" />
            </div>
          </section>
        </div>
      </div>
    </SkeletonWrapper>
  );
};