import { SkeletonWrapper, Skeleton } from './SkeletonConfig';

interface GenericSkeletonProps {
  lines?: number;
  height?: number;
}

export const GenericSkeleton = ({ lines = 3, height = 16 }: GenericSkeletonProps) => {
  return (
    <SkeletonWrapper>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} height={height} />
        ))}
      </div>
    </SkeletonWrapper>
  );
}; 