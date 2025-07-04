import { SkeletonWrapper, Skeleton } from './SkeletonConfig';

interface CardSkeletonProps {
  showHeader?: boolean;
  showFooter?: boolean;
  contentLines?: number;
}

export const CardSkeleton = ({ 
  showHeader = true, 
  showFooter = false,
  contentLines = 3 
}: CardSkeletonProps) => {
  return (
    <SkeletonWrapper>
      <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <Skeleton height={20} width={120} />
            <Skeleton height={16} width={60} />
          </div>
        )}
        
        <div className="space-y-2 mb-4">
          {Array.from({ length: contentLines }).map((_, i) => (
            <Skeleton key={i} height={16} />
          ))}
        </div>
        
        {showFooter && (
          <div className="flex justify-between items-center pt-4 border-t border-gray-600/30">
            <Skeleton height={14} width={80} />
            <Skeleton height={32} width={80} />
          </div>
        )}
      </div>
    </SkeletonWrapper>
  );
}; 