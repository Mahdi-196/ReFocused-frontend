import { SkeletonWrapper, Skeleton } from './SkeletonConfig';

export const HomePageSkeleton = () => {
  return (
    <SkeletonWrapper>
      <div
        className="min-h-screen py-8"
        style={{ backgroundColor: '#1A2537' }}
      >
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Momentum (outline only) */}
            <section className="lg:col-span-2">
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6">
                <Skeleton height={24} width={200} className="mb-6" />
                <Skeleton height={52} className="mb-6" />
                <Skeleton height={200} className="mb-6" />
                <Skeleton height={52} className="mb-4" />
                <Skeleton height={140} />
              </div>
            </section>

            {/* Right column cards (outline only) */}
            <section className="lg:col-span-1 flex flex-col gap-6">
              {/* Quote of the Day outline */}
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6 h-[19rem] flex flex-col justify-between">
                <Skeleton height={20} width={160} className="mb-4" />
                <Skeleton height={120} />
                <Skeleton height={12} width={160} className="mt-4" />
              </div>

              {/* Word of the Day outline */}
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6 h-[19rem] flex flex-col justify-between">
                <Skeleton height={20} width={160} className="mb-4" />
                <Skeleton height={120} />
                <Skeleton height={12} width={180} className="mt-4" />
              </div>
            </section>

            {/* Goal Tracker (outline only) */}
            <section className="lg:col-span-2">
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6">
                <Skeleton height={24} width={140} className="mb-4" />
                <Skeleton height={32} width={200} className="mb-6" />
                <Skeleton height={160} />
              </div>
            </section>

            {/* Mind Fuel (outline only) */}
            <section className="lg:col-span-1">
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6 h-full">
                <Skeleton height={24} width={140} className="mb-4" />
                <Skeleton height={180} />
              </div>
            </section>

            {/* Productivity Score (outline only) */}
            <section className="lg:col-span-3">
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6">
                <Skeleton height={24} width={160} className="mb-6" />
                <div className="flex items-center justify-center">
                  <Skeleton height={100} width={100} circle />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </SkeletonWrapper>
  );
};