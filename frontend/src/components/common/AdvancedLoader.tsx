import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react';
import { cn } from '../../utils/cn';

export interface AdvancedLoaderProps {
  isLoading: boolean;
  progress?: number; // 0-100
  currentStep?: number;
  totalSteps?: number;
  estimatedTimeRemaining?: number; // in seconds
  error?: string | null;
  onCancel?: () => void;
  onRetry?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  isPaused?: boolean;
  canCancel?: boolean;
  canPause?: boolean;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'compact' | 'detailed' | 'minimal';
  className?: string;
  showETA?: boolean;
  showProgress?: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number; // in seconds
  generationSteps?: GenerationStep[];
  currentStepName?: string;
  showDetailedSteps?: boolean;
  processingSpeed?: number; // steps per second
  qualityMetrics?: QualityMetrics;
}

export interface GenerationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress?: number;
  duration?: number;
}

export interface QualityMetrics {
  resolution: string;
  quality: 'draft' | 'standard' | 'high' | 'ultra';
  style: string;
  complexity: 'simple' | 'moderate' | 'complex' | 'ultra-complex';
}

interface RetryState {
  count: number;
  isRetrying: boolean;
  nextRetryIn: number;
}

const AdvancedLoader: React.FC<AdvancedLoaderProps> = ({
  isLoading,
  progress = 0,
  currentStep = 0,
  totalSteps = 100,
  estimatedTimeRemaining,
  error,
  onCancel,
  onRetry,
  onPause,
  onResume,
  isPaused = false,
  canCancel = true,
  canPause = false,
  title = 'Generating Image',
  subtitle = 'Please wait while we create your artwork...',
  variant = 'default',
  className,
  showETA = true,
  showProgress = true,
  autoRetry = false,
  maxRetries = 3,
  retryDelay = 5,
  generationSteps = [],
  currentStepName,
  showDetailedSteps = false,
  processingSpeed,
  qualityMetrics,
}) => {
  const [retryState, setRetryState] = useState<RetryState>({
    count: 0,
    isRetrying: false,
    nextRetryIn: 0,
  });

  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Start timer when loading begins
  useEffect(() => {
    if (isLoading && !startTime) {
      setStartTime(Date.now());
    } else if (!isLoading) {
      setStartTime(null);
      setElapsedTime(0);
    }
  }, [isLoading, startTime]);

  // Update elapsed time
  useEffect(() => {
    if (!isLoading || !startTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, startTime]);

  // Auto-retry logic
  useEffect(() => {
    if (error && autoRetry && retryState.count < maxRetries && !retryState.isRetrying) {
      setRetryState(prev => ({ ...prev, isRetrying: true, nextRetryIn: retryDelay }));

      const countdownInterval = setInterval(() => {
        setRetryState(prev => {
          if (prev.nextRetryIn <= 1) {
            clearInterval(countdownInterval);
            onRetry?.();
            return { count: prev.count + 1, isRetrying: false, nextRetryIn: 0 };
          }
          return { ...prev, nextRetryIn: prev.nextRetryIn - 1 };
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [error, autoRetry, retryState.count, retryState.isRetrying, maxRetries, retryDelay, onRetry]);

  // Reset retry state when loading starts
  useEffect(() => {
    if (isLoading && !error) {
      setRetryState({ count: 0, isRetrying: false, nextRetryIn: 0 });
    }
  }, [isLoading, error]);

  const handleRetry = useCallback(() => {
    setRetryState(prev => ({ ...prev, count: prev.count + 1, isRetrying: false, nextRetryIn: 0 }));
    onRetry?.();
  }, [onRetry]);

  const progressPercentage = useMemo(() => {
    if (totalSteps > 0) {
      return Math.min(100, (currentStep / totalSteps) * 100);
    }
    return Math.min(100, progress);
  }, [progress, currentStep, totalSteps]);

  const formatTime = useCallback((seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }, []);

  const getStatusIcon = () => {
    if (error) return <XCircle className="h-5 w-5 text-red-500" />;
    if (isPaused) return <Pause className="h-5 w-5 text-yellow-500" />;
    if (isLoading) return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getStatusText = () => {
    if (error) return 'Generation Failed';
    if (isPaused) return 'Generation Paused';
    if (isLoading) return title;
    return 'Generation Complete';
  };

  if (!isLoading && !error) return null;

  const compactVariant = variant === 'compact';
  const detailedVariant = variant === 'detailed';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          'bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden',
          compactVariant ? 'p-4' : 'p-6',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h3 className={cn(
                'font-semibold text-gray-900 dark:text-white',
                compactVariant ? 'text-sm' : 'text-lg'
              )}>
                {getStatusText()}
              </h3>
              {!compactVariant && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {error ? error : subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {canPause && isLoading && !error && (
              <button
                onClick={isPaused ? onResume : onPause}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
            )}

            {canCancel && isLoading && (
              <button
                onClick={onCancel}
                className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {showProgress && isLoading && !error && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Progress: {Math.round(progressPercentage)}%
              </span>
              {totalSteps > 0 && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Step {currentStep} of {totalSteps}
                </span>
              )}
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Time Information */}
        {(showETA || detailedVariant) && isLoading && !error && (
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Elapsed: {formatTime(elapsedTime)}
              </span>
            </div>
            {estimatedTimeRemaining && (
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  ETA: {formatTime(estimatedTimeRemaining)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  Generation Failed
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                
                {retryState.isRetrying && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    Auto-retrying in {retryState.nextRetryIn}s... (Attempt {retryState.count + 1}/{maxRetries})
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={handleRetry}
                disabled={retryState.isRetrying}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-200 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn('h-4 w-4 mr-1', retryState.isRetrying && 'animate-spin')} />
                {retryState.isRetrying ? 'Retrying...' : 'Retry'}
              </button>
              
              {retryState.count > 0 && (
                <span className="text-xs text-red-600 dark:text-red-400">
                  Attempts: {retryState.count}/{maxRetries}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Detailed Information */}
        {detailedVariant && isLoading && !error && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {isPaused ? 'Paused' : 'Processing'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Speed:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {processingSpeed ? `${processingSpeed.toFixed(1)} steps/s` :
                   elapsedTime > 0 ? `${(currentStep / elapsedTime).toFixed(1)} steps/s` : '—'}
                </span>
              </div>
              {qualityMetrics && (
                <>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Quality:</span>
                    <span className="ml-2 text-gray-900 dark:text-white capitalize">
                      {qualityMetrics.quality}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Resolution:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {qualityMetrics.resolution}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Detailed Generation Steps */}
        {showDetailedSteps && generationSteps.length > 0 && isLoading && !error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Generation Steps
            </h4>
            <div className="space-y-3">
              {generationSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'flex items-center space-x-3 p-3 rounded-lg transition-all duration-200',
                    step.status === 'active' && 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800',
                    step.status === 'completed' && 'bg-green-50 dark:bg-green-900/20',
                    step.status === 'error' && 'bg-red-50 dark:bg-red-900/20',
                    step.status === 'pending' && 'bg-gray-50 dark:bg-gray-900/20'
                  )}
                >
                  {/* Step Icon */}
                  <div className="flex-shrink-0">
                    {step.status === 'active' && (
                      <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                    )}
                    {step.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                    {step.status === 'error' && (
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                    {step.status === 'pending' && (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {step.name}
                      </h5>
                      {step.duration && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {step.duration}ms
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {step.description}
                    </p>

                    {/* Step Progress Bar */}
                    {step.status === 'active' && step.progress !== undefined && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <motion.div
                            className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${step.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>Progress</span>
                          <span>{step.progress}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Current Step Name */}
        {currentStepName && isLoading && !error && !showDetailedSteps && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-center"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current step: <span className="font-medium text-gray-900 dark:text-white">{currentStepName}</span>
            </p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AdvancedLoader;
