import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Palette,
  Camera,
  Brush,
  Zap
} from 'lucide-react';
import { cn } from '../../utils/cn';

export interface PlaceholderImageProps {
  width: number;
  height: number;
  isGenerating?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  variant?: 'default' | 'skeleton' | 'artistic' | 'minimal';
  className?: string;
  showDimensions?: boolean;
  showShimmer?: boolean;
  customIcon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  progress?: number; // 0-100
}

const PlaceholderImage: React.FC<PlaceholderImageProps> = ({
  width,
  height,
  isGenerating = false,
  hasError = false,
  errorMessage,
  onRetry,
  variant = 'default',
  className,
  showDimensions = true,
  showShimmer = true,
  customIcon,
  title,
  subtitle,
  progress = 0,
}) => {
  const [shimmerPosition, setShimmerPosition] = useState(-100);

  // Calculate aspect ratio
  const aspectRatio = useMemo(() => {
    return height / width;
  }, [width, height]);

  // Shimmer animation
  useEffect(() => {
    if (!showShimmer || !isGenerating) return;

    const interval = setInterval(() => {
      setShimmerPosition(prev => (prev >= 200 ? -100 : prev + 2));
    }, 50);

    return () => clearInterval(interval);
  }, [showShimmer, isGenerating]);

  const getIcon = () => {
    if (customIcon) return customIcon;
    if (hasError) return <AlertCircle className="h-8 w-8 text-red-500" />;
    if (isGenerating) {
      const icons = [
        <Sparkles className="h-8 w-8 text-blue-500" />,
        <Palette className="h-8 w-8 text-purple-500" />,
        <Camera className="h-8 w-8 text-green-500" />,
        <Brush className="h-8 w-8 text-orange-500" />,
        <Zap className="h-8 w-8 text-yellow-500" />
      ];
      const iconIndex = Math.floor((progress / 100) * icons.length);
      return icons[Math.min(iconIndex, icons.length - 1)];
    }
    return <ImageIcon className="h-8 w-8 text-gray-400" />;
  };

  const getTitle = () => {
    if (title) return title;
    if (hasError) return 'Generation Failed';
    if (isGenerating) return 'Creating Your Image';
    return 'Ready to Generate';
  };

  const getSubtitle = () => {
    if (subtitle) return subtitle;
    if (hasError) return errorMessage || 'Something went wrong';
    if (isGenerating) return `${Math.round(progress)}% complete`;
    return 'Enter a prompt to begin';
  };

  const renderSkeletonVariant = () => (
    <div
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-lg',
        className
      )}
      style={{ aspectRatio: `${width}/${height}` }}
    >
      {/* Shimmer effect */}
      {showShimmer && isGenerating && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10"
          style={{
            transform: `translateX(${shimmerPosition}%)`,
            width: '100%',
          }}
        />
      )}

      {/* Skeleton content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        <motion.div
          animate={isGenerating ? { rotate: 360 } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="mb-3"
        >
          {getIcon()}
        </motion.div>

        <div className="text-center space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mx-auto" />
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16 mx-auto" />
        </div>

        {showDimensions && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded">
            {width}×{height}
          </div>
        )}
      </div>
    </div>
  );

  const renderArtisticVariant = () => (
    <div
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700',
        className
      )}
      style={{ aspectRatio: `${width}/${height}` }}
    >
      {/* Animated background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-200/50 to-blue-200/50 dark:from-purple-800/30 dark:to-blue-800/30"
          animate={{
            background: [
              'linear-gradient(45deg, rgba(147, 51, 234, 0.1), rgba(59, 130, 246, 0.1))',
              'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
              'linear-gradient(225deg, rgba(147, 51, 234, 0.1), rgba(59, 130, 246, 0.1))',
              'linear-gradient(315deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        <motion.div
          animate={isGenerating ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-4"
        >
          {getIcon()}
        </motion.div>

        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 text-center">
          {getTitle()}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          {getSubtitle()}
        </p>

        {isGenerating && progress > 0 && (
          <div className="mt-4 w-full max-w-xs">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {showDimensions && (
          <div className="absolute bottom-3 right-3 text-xs text-purple-600 dark:text-purple-400 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-full">
            {width}×{height}
          </div>
        )}
      </div>
    </div>
  );

  const renderMinimalVariant = () => (
    <div
      className={cn(
        'relative bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700',
        className
      )}
      style={{ aspectRatio: `${width}/${height}` }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={isGenerating ? { opacity: [0.5, 1, 0.5] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {getIcon()}
        </motion.div>
      </div>

      {showDimensions && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-500">
          {width}×{height}
        </div>
      )}
    </div>
  );

  const renderDefaultVariant = () => (
    <div
      className={cn(
        'relative bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden',
        className
      )}
      style={{ aspectRatio: `${width}/${height}` }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        <motion.div
          animate={isGenerating ? { rotate: [0, 360] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="mb-4"
        >
          {getIcon()}
        </motion.div>

        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">
          {getTitle()}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
          {getSubtitle()}
        </p>

        {hasError && onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </button>
        )}

        {showDimensions && (
          <div className="absolute bottom-3 right-3 text-xs text-gray-400 dark:text-gray-500 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded">
            {width}×{height}
          </div>
        )}
      </div>
    </div>
  );

  const renderVariant = () => {
    switch (variant) {
      case 'skeleton':
        return renderSkeletonVariant();
      case 'artistic':
        return renderArtisticVariant();
      case 'minimal':
        return renderMinimalVariant();
      default:
        return renderDefaultVariant();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {renderVariant()}
      </motion.div>
    </AnimatePresence>
  );
};

export default PlaceholderImage;
