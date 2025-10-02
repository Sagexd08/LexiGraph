/**
 * Hook for real-time generation progress tracking
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useWebSocket } from '../services/websocket';
import { useAppStore } from '../store';
import { GenerationParams } from '../types/api';

export interface GenerationProgress {
  jobId: string;
  progress: number;
  step: number;
  totalSteps: number;
  eta: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  startTime: number;
  elapsedTime: number;
  estimatedTotalTime: number;
}

export function useRealTimeGeneration() {
  const { isConnected, emit, on, off, subscribeToGeneration, unsubscribeFromGeneration } = useWebSocket();
  const [activeGenerations, setActiveGenerations] = useState<Map<string, GenerationProgress>>(new Map());
  const { startGeneration, updateGenerationProgress, completeGeneration, failGeneration } = useAppStore();
  
  // Start a new generation with real-time tracking
  const startRealTimeGeneration = useCallback(async (
    params: GenerationParams,
    options: {
      priority?: number;
      onProgress?: (progress: GenerationProgress) => void;
      onComplete?: (result: any) => void;
      onError?: (error: string) => void;
    } = {}
  ) => {
    const { priority = 1, onProgress, onComplete, onError } = options;
    
    // Create job in store
    const jobId = await startGeneration(params, priority);
    
    // Initialize progress tracking
    const initialProgress: GenerationProgress = {
      jobId,
      progress: 0,
      step: 0,
      totalSteps: params.num_inference_steps || 20,
      eta: 0,
      status: 'pending',
      startTime: Date.now(),
      elapsedTime: 0,
      estimatedTotalTime: 0,
    };
    
    setActiveGenerations(prev => new Map(prev).set(jobId, initialProgress));
    
    // Subscribe to real-time updates
    subscribeToGeneration(jobId);
    
    // Set up event listeners for this specific generation
    const handleProgress = (data: any) => {
      if (data.jobId === jobId) {
        const now = Date.now();
        const elapsedTime = now - initialProgress.startTime;
        const estimatedTotalTime = data.eta ? elapsedTime + data.eta : 0;
        
        const updatedProgress: GenerationProgress = {
          ...initialProgress,
          progress: data.progress,
          step: data.step,
          totalSteps: data.totalSteps,
          eta: data.eta,
          status: 'processing',
          elapsedTime,
          estimatedTotalTime,
        };
        
        setActiveGenerations(prev => new Map(prev).set(jobId, updatedProgress));
        updateGenerationProgress(jobId, data.progress, data.eta);
        onProgress?.(updatedProgress);
      }
    };
    
    const handleComplete = (data: any) => {
      if (data.jobId === jobId) {
        const finalProgress: GenerationProgress = {
          ...activeGenerations.get(jobId)!,
          progress: 100,
          status: 'completed',
          elapsedTime: Date.now() - initialProgress.startTime,
        };
        
        setActiveGenerations(prev => {
          const newMap = new Map(prev);
          newMap.delete(jobId);
          return newMap;
        });
        
        completeGeneration(jobId, data.result);
        unsubscribeFromGeneration(jobId);
        onComplete?.(data.result);
      }
    };
    
    const handleError = (data: any) => {
      if (data.jobId === jobId) {
        const errorProgress: GenerationProgress = {
          ...activeGenerations.get(jobId)!,
          status: 'failed',
          elapsedTime: Date.now() - initialProgress.startTime,
        };
        
        setActiveGenerations(prev => {
          const newMap = new Map(prev);
          newMap.delete(jobId);
          return newMap;
        });
        
        failGeneration(jobId, data.error);
        unsubscribeFromGeneration(jobId);
        onError?.(data.error);
      }
    };
    
    // Register event listeners
    on('generation:progress', handleProgress);
    on('generation:completed', handleComplete);
    on('generation:failed', handleError);
    
    // Send generation request via WebSocket
    if (isConnected) {
      emit('generation:start', { jobId, params, priority });
    } else {
      // Fallback to HTTP API if WebSocket not available
      console.warn('WebSocket not connected, falling back to HTTP API');
      // TODO: Implement HTTP fallback
    }
    
    // Cleanup function
    const cleanup = () => {
      off('generation:progress', handleProgress);
      off('generation:completed', handleComplete);
      off('generation:failed', handleError);
      unsubscribeFromGeneration(jobId);
      setActiveGenerations(prev => {
        const newMap = new Map(prev);
        newMap.delete(jobId);
        return newMap;
      });
    };
    
    return {
      jobId,
      cleanup,
      cancel: () => {
        emit('generation:cancel', { jobId });
        cleanup();
      },
    };
  }, [isConnected, emit, on, off, subscribeToGeneration, unsubscribeFromGeneration, startGeneration, updateGenerationProgress, completeGeneration, failGeneration, activeGenerations]);
  
  // Cancel a generation
  const cancelGeneration = useCallback((jobId: string) => {
    emit('generation:cancel', { jobId });
    setActiveGenerations(prev => {
      const newMap = new Map(prev);
      newMap.delete(jobId);
      return newMap;
    });
    unsubscribeFromGeneration(jobId);
  }, [emit, unsubscribeFromGeneration]);
  
  // Get progress for a specific generation
  const getGenerationProgress = useCallback((jobId: string): GenerationProgress | null => {
    return activeGenerations.get(jobId) || null;
  }, [activeGenerations]);
  
  // Get all active generations
  const getAllActiveGenerations = useCallback((): GenerationProgress[] => {
    return Array.from(activeGenerations.values());
  }, [activeGenerations]);
  
  return {
    isConnected,
    activeGenerations: getAllActiveGenerations(),
    startRealTimeGeneration,
    cancelGeneration,
    getGenerationProgress,
  };
}

// Hook for monitoring system status in real-time
export function useRealTimeSystemStatus() {
  const { isConnected, on, off } = useWebSocket();
  const [systemStatus, setSystemStatus] = useState({
    isOnline: false,
    modelLoaded: false,
    queueLength: 0,
    activeConnections: 0,
    totalGenerations: 0,
    averageTime: 0,
  });
  
  useEffect(() => {
    const handleSystemStatus = (data: any) => {
      setSystemStatus(prev => ({ ...prev, ...data }));
    };
    
    const handleSystemMetrics = (data: any) => {
      setSystemStatus(prev => ({ ...prev, ...data }));
    };
    
    on('system:status', handleSystemStatus);
    on('system:metrics', handleSystemMetrics);
    
    return () => {
      off('system:status', handleSystemStatus);
      off('system:metrics', handleSystemMetrics);
    };
  }, [on, off]);
  
  return {
    isConnected,
    systemStatus,
  };
}

// Hook for real-time queue monitoring
export function useRealTimeQueue() {
  const { isConnected, on, off } = useWebSocket();
  const [queueStatus, setQueueStatus] = useState({
    length: 0,
    position: -1,
    estimatedWaitTime: 0,
    processingJobId: null as string | null,
  });
  
  useEffect(() => {
    const handleQueueUpdate = (data: any) => {
      setQueueStatus(prev => ({
        ...prev,
        length: data.queueLength,
        position: data.position,
      }));
    };
    
    const handleQueueProcessing = (data: any) => {
      setQueueStatus(prev => ({
        ...prev,
        processingJobId: data.jobId,
        position: data.position,
      }));
    };
    
    on('queue:updated', handleQueueUpdate);
    on('queue:processing', handleQueueProcessing);
    
    return () => {
      off('queue:updated', handleQueueUpdate);
      off('queue:processing', handleQueueProcessing);
    };
  }, [on, off]);
  
  return {
    isConnected,
    queueStatus,
  };
}

// Hook for real-time notifications
export function useRealTimeNotifications() {
  const { isConnected, on, off } = useWebSocket();
  const { showNotification } = useAppStore();
  
  useEffect(() => {
    const handleNotification = (data: any) => {
      showNotification({
        type: data.type,
        title: data.title,
        message: data.message,
        duration: data.duration || 5000,
      });
    };
    
    const handleRateLimit = (data: any) => {
      showNotification({
        type: 'warning',
        title: 'Rate Limited',
        message: `${data.remaining} requests remaining. Resets in ${Math.ceil(data.resetTime / 1000)}s`,
        duration: 10000,
      });
    };
    
    on('user:notification', handleNotification);
    on('user:rateLimit', handleRateLimit);
    
    return () => {
      off('user:notification', handleNotification);
      off('user:rateLimit', handleRateLimit);
    };
  }, [on, off, showNotification]);
  
  return {
    isConnected,
  };
}
