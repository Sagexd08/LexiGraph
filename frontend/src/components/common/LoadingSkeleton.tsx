import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../../design-system';
import { cn } from '../../utils/cn';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'card' | 'text' | 'image' | 'button' | 'avatar' | 'custom';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animate?: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  variant = 'custom',
  width,
  height,
  lines = 3,
  animate = true,
}) => {
  const baseClasses = 'bg-gradient-to-r from-neutral-800/50 via-neutral-700/50 to-neutral-800/50 rounded-lg';
  
  const shimmerAnimation = animate ? {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  } : {};

  const skeletonClasses = cn(
    baseClasses,
    animate && 'animate-pulse',
    className
  );

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  switch (variant) {
    case 'card':
      return (
        <GlassCard className={cn('p-6 space-y-4', className)}>
          <motion.div
            className="h-4 bg-gradient-to-r from-neutral-800/50 via-neutral-700/50 to-neutral-800/50 rounded w-3/4"
            animate={shimmerAnimation}
          />
          <motion.div
            className="h-3 bg-gradient-to-r from-neutral-800/50 via-neutral-700/50 to-neutral-800/50 rounded w-1/2"
            animate={shimmerAnimation}
          />
          <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
              <motion.div
                key={i}
                className="h-3 bg-gradient-to-r from-neutral-800/50 via-neutral-700/50 to-neutral-800/50 rounded"
                style={{ width: `${Math.random() * 40 + 60}%` }}
                animate={shimmerAnimation}
              />
            ))}
          </div>
        </GlassCard>
      );

    case 'text':
      return (
        <div className={cn('space-y-2', className)}>
          {Array.from({ length: lines }).map((_, i) => (
            <motion.div
              key={i}
              className="h-4 bg-gradient-to-r from-neutral-800/50 via-neutral-700/50 to-neutral-800/50 rounded"
              style={{ width: `${Math.random() * 40 + 60}%` }}
              animate={shimmerAnimation}
            />
          ))}
        </div>
      );

    case 'image':
      return (
        <motion.div
          className={cn(
            'bg-gradient-to-r from-neutral-800/50 via-neutral-700/50 to-neutral-800/50 rounded-lg aspect-square',
            className
          )}
          style={style}
          animate={shimmerAnimation}
        />
      );

    case 'button':
      return (
        <motion.div
          className={cn(
            'h-10 bg-gradient-to-r from-neutral-800/50 via-neutral-700/50 to-neutral-800/50 rounded-lg',
            className
          )}
          style={style}
          animate={shimmerAnimation}
        />
      );

    case 'avatar':
      return (
        <motion.div
          className={cn(
            'w-10 h-10 bg-gradient-to-r from-neutral-800/50 via-neutral-700/50 to-neutral-800/50 rounded-full',
            className
          )}
          style={style}
          animate={shimmerAnimation}
        />
      );

    default:
      return (
        <motion.div
          className={skeletonClasses}
          style={style}
          animate={shimmerAnimation}
        />
      );
  }
};

// Preset skeleton components for common use cases
export const ImageSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingSkeleton variant="image" className={cn('w-full h-64', className)} />
);

export const CardSkeleton: React.FC<{ className?: string; lines?: number }> = ({ 
  className, 
  lines = 3 
}) => (
  <LoadingSkeleton variant="card" className={className} lines={lines} />
);

export const TextSkeleton: React.FC<{ className?: string; lines?: number }> = ({ 
  className, 
  lines = 3 
}) => (
  <LoadingSkeleton variant="text" className={className} lines={lines} />
);

export const ButtonSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingSkeleton variant="button" className={className} />
);

export const AvatarSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingSkeleton variant="avatar" className={className} />
);

// Gallery skeleton for image grids
export const GallerySkeleton: React.FC<{ 
  className?: string; 
  count?: number; 
  columns?: number;
}> = ({ 
  className, 
  count = 8, 
  columns = 4 
}) => (
  <div className={cn(
    'grid gap-4',
    {
      'grid-cols-1': columns === 1,
      'grid-cols-2': columns === 2,
      'grid-cols-3': columns === 3,
      'grid-cols-4': columns === 4,
      'grid-cols-5': columns === 5,
      'grid-cols-6': columns === 6,
    },
    className
  )}>
    {Array.from({ length: count }).map((_, i) => (
      <ImageSkeleton key={i} />
    ))}
  </div>
);

// Dashboard skeleton for complex layouts
export const DashboardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-6', className)}>
    {/* Header */}
    <div className="flex items-center justify-between">
      <TextSkeleton lines={1} className="w-48" />
      <div className="flex gap-2">
        <ButtonSkeleton className="w-24" />
        <ButtonSkeleton className="w-24" />
      </div>
    </div>
    
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} lines={2} />
      ))}
    </div>
    
    {/* Main Content */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <CardSkeleton lines={8} />
      </div>
      <div className="space-y-4">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={3} />
      </div>
    </div>
  </div>
);

export { LoadingSkeleton };
export default LoadingSkeleton;
