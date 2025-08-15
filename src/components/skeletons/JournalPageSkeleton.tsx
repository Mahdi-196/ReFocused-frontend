import { SkeletonWrapper, Skeleton } from './SkeletonConfig';

export const JournalPageSkeleton = () => {
  return (
    <SkeletonWrapper>
      <div className="min-h-screen py-8" style={{ backgroundColor: '#1A2537' }}>
        <div className="max-w-full mx-auto px-6">
          {/* Header (outline only) */}
          <div className="mb-8 text-center">
            <Skeleton height={28} width={180} className="mx-auto mb-2" />
            <Skeleton height={16} width={380} className="mx-auto" />
          </div>

          <div className="flex flex-col xl:flex-row gap-8 min-h-screen">
            {/* Left: main content (outline only) */}
            <div className="flex-1 xl:flex-[2] max-w-none">
              <div className="mb-8">
                <Skeleton height={40} className="mb-4" />
                <div className="flex items-center justify-between">
                  <Skeleton height={40} width={360} />
                  <Skeleton height={40} width={120} />
                </div>
              </div>
              <Skeleton height={480} />
            </div>

            {/* Right: sidebar (outline only) */}
            <div className="flex-1 xl:flex-[1] max-w-none xl:max-w-sm space-y-6">
              {/* Writing Prompts card */}
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                <Skeleton height={24} width={180} className="mb-4" />
                <Skeleton height={140} />
              </div>
              {/* Gratitude card */}
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                <Skeleton height={24} width={140} className="mb-4" />
                <Skeleton height={44} className="mb-4" />
                <Skeleton height={160} className="mb-4" />
                <Skeleton height={44} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SkeletonWrapper>
  );
};