import 'react-loading-skeleton/dist/skeleton.css';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

interface SkeletonWrapperProps {
  children: React.ReactNode;
}

export const SkeletonWrapper: React.FC<SkeletonWrapperProps> = ({ children }) => {
  return (
    <SkeletonTheme
      baseColor="#374151"     // gray-700 - matches your dark theme
      highlightColor="#4B5563" // gray-600 - slightly lighter for animation
      borderRadius="0.5rem"    // rounded-lg
      duration={1.5}           // smooth animation duration
    >
      {children}
    </SkeletonTheme>
  );
};

export { Skeleton }; 