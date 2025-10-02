/**
 * Real-time progress tracking component
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Pause, 
  Play, 
  X,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react';
import { useRealTimeGeneration, useRealTimeSystemStatus, useRealTimeQueue } from '../hooks/useRealTimeGeneration';
import { cn } from '../utils/cn';

interface RealTimeProgressProps {
  jobId?: string;
  className?: string;
  showSystemStatus?: boolean;
  showQueueStatus?: boolean;
  compact?: boolean;
}

export const RealTimeProgress: React.FC<RealTimeProgressProps> = ({
  jobId,
  className,
  showSystemStatus = true,
  showQueueStatus = true,
  compact = false,
}) => {
  const { isConnected, activeGenerations, getGenerationProgress, cancelGeneration } = useRealTimeGeneration();
  const { systemStatus } = useRealTimeSystemStatus();
  const { queueStatus } = useRealTimeQueue();
  
  const currentProgress = jobId ? getGenerationProgress(jobId) : null;
  const hasActiveGenerations = activeGenerations.length > 0;

  // Format time helper
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Progress bar component
  const ProgressBar = ({ progress, status, className: barClassName }: { 
    progress: number; 
    status: string; 
    className?: string; 
  }) => (
    <div className={cn('relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden', barClassName)}>
      <motion.div
        className={cn(
          'h-full rounded-full transition-colors duration-300',
          status === 'processing' && 'bg-gradient-to-r from-blue-500 to-purple-500',
          status === 'completed' && 'bg-green-500',
          status === 'failed' && 'bg-red-500',
          status === 'cancelled' && 'bg-gray-500'
        )}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      {status === 'processing' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </div>
  );

  // Status icon component
  const StatusIcon = ({ status, className: iconClassName }: { status: string; className?: string }) => {
    const iconProps = { className: cn('w-4 h-4', iconClassName) };
    
    switch (status) {
      case 'processing':
        return <Zap {...iconProps} className={cn(iconProps.className, 'text-blue-500 animate-pulse')} />;
      case 'completed':
        return <CheckCircle {...iconProps} className={cn(iconProps.className, 'text-green-500')} />;
      case 'failed':
        return <XCircle {...iconProps} className={cn(iconProps.className, 'text-red-500')} />;
      case 'cancelled':
        return <X {...iconProps} className={cn(iconProps.className, 'text-gray-500')} />;
      default:
        return <Clock {...iconProps} className={cn(iconProps.className, 'text-gray-500')} />;
    }
  };

  if (compact) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {/* Connection status */}
        <div className="flex items-center space-x-1">
          {isConnected ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
        </div>
        
        {/* Active generations count */}
        {hasActiveGenerations && (
          <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
            <Activity className="w-3 h-3" />
            <span>{activeGenerations.length}</span>
          </div>
        )}
        
        {/* Current progress */}
        {currentProgress && (
          <div className="flex items-center space-x-1">
            <StatusIcon status={currentProgress.status} className="w-3 h-3" />
            <span className="text-xs font-medium">{Math.round(currentProgress.progress)}%</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Connection Status */}
      <div className="flex items-center justify-between p-3 bg-white/5 dark:bg-white/3 backdrop-blur-sm rounded-lg border border-white/10">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-600 dark:text-red-400">Disconnected</span>
            </>
          )}
        </div>
        
        {showSystemStatus && (
          <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
            <span>Model: {systemStatus.modelLoaded ? 'Loaded' : 'Loading...'}</span>
            <span>Queue: {systemStatus.queueLength}</span>
          </div>
        )}
      </div>

      {/* Current Generation Progress */}
      <AnimatePresence>
        {currentProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl border border-white/20"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <StatusIcon status={currentProgress.status} />
                <span className="font-medium">
                  {currentProgress.status === 'processing' ? 'Generating...' : 
                   currentProgress.status === 'completed' ? 'Complete' :
                   currentProgress.status === 'failed' ? 'Failed' : 'Pending'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {currentProgress.status === 'processing' && (
                  <button
                    onClick={() => cancelGeneration(currentProgress.jobId)}
                    className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                    title="Cancel generation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <span className="text-sm font-bold">{Math.round(currentProgress.progress)}%</span>
              </div>
            </div>
            
            <ProgressBar 
              progress={currentProgress.progress} 
              status={currentProgress.status}
              className="mb-3"
            />
            
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Step {currentProgress.step} of {currentProgress.totalSteps}</span>
              <div className="flex items-center space-x-4">
                <span>Elapsed: {formatTime(currentProgress.elapsedTime)}</span>
                {currentProgress.eta > 0 && (
                  <span>ETA: {formatTime(currentProgress.eta)}</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue Status */}
      {showQueueStatus && queueStatus.length > 0 && (
        <div className="p-3 bg-white/5 dark:bg-white/3 backdrop-blur-sm rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Queue Status</span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {queueStatus.position >= 0 ? `Position: ${queueStatus.position + 1}` : 'Not in queue'}
            </div>
          </div>
          
          {queueStatus.length > 0 && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {queueStatus.length} job{queueStatus.length !== 1 ? 's' : ''} in queue
            </div>
          )}
        </div>
      )}

      {/* Active Generations List */}
      {activeGenerations.length > 1 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Active Generations ({activeGenerations.length})
          </h4>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {activeGenerations.map((generation) => (
              <motion.div
                key={generation.jobId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-2 bg-white/5 dark:bg-white/3 rounded-lg border border-white/10"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <StatusIcon status={generation.status} className="w-3 h-3" />
                    <span className="text-xs font-medium truncate">
                      Job {generation.jobId.slice(-8)}
                    </span>
                  </div>
                  <span className="text-xs">{Math.round(generation.progress)}%</span>
                </div>
                
                <ProgressBar 
                  progress={generation.progress} 
                  status={generation.status}
                  className="h-1"
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeProgress;
