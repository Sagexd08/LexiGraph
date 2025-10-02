/**
 * Advanced generation hooks with optimistic updates and queue management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useAppStore, useGenerationState } from '../store';
import { GenerationParams, GenerateImageResponse } from '../types/api';
import { queryKeys, useOptimisticUpdate } from '../lib/react-query';
import { apiService } from '../services/api';

// Hook for managing image generation with optimistic updates
export function useImageGeneration() {
  const queryClient = useQueryClient();
  const { startGeneration, completeGeneration, failGeneration, updateGenerationProgress } = useAppStore();
  const { currentJob, jobQueue, loading, error } = useGenerationState();
  const { startGeneration: optimisticStart } = useOptimisticUpdate();
  
  // Mutation for image generation
  const generateMutation = useMutation({
    mutationFn: async (params: GenerationParams): Promise<GenerateImageResponse> => {
      return apiService.generateImage(params);
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.generation.history() });
      queryClient.invalidateQueries({ queryKey: queryKeys.system.metrics() });
    },
    onError: (error, variables) => {
      console.error('Generation failed:', error);
    },
  });

  // Generate image with optimistic updates
  const generate = useCallback(async (params: GenerationParams, priority = 1) => {
    try {
      return await optimisticStart(params, () => generateMutation.mutateAsync(params));
    } catch (error) {
      throw error;
    }
  }, [optimisticStart, generateMutation]);

  // Cancel generation
  const cancel = useCallback((jobId: string) => {
    useAppStore.getState().cancelGeneration(jobId);
    // TODO: Cancel actual API request
  }, []);

  // Retry generation
  const retry = useCallback(async (jobId: string) => {
    const job = jobQueue.find(j => j.id === jobId);
    if (job) {
      await useAppStore.getState().retryGeneration(jobId);
      return generate(job.params, job.priority);
    }
  }, [jobQueue, generate]);

  return {
    generate,
    cancel,
    retry,
    currentJob,
    jobQueue,
    loading,
    error,
    isGenerating: generateMutation.isPending,
  };
}

// Hook for generation progress tracking
export function useGenerationProgress(jobId?: string) {
  const progressRef = useRef<number>(0);
  const etaRef = useRef<number | undefined>();
  
  // Simulate progress for demo (replace with real WebSocket implementation)
  useEffect(() => {
    if (!jobId) return;
    
    const interval = setInterval(() => {
      progressRef.current += Math.random() * 10;
      if (progressRef.current >= 100) {
        progressRef.current = 100;
        clearInterval(interval);
      }
      
      // Calculate ETA
      const elapsed = Date.now() - (Date.now() - 10000); // Mock start time
      const rate = progressRef.current / elapsed;
      etaRef.current = rate > 0 ? (100 - progressRef.current) / rate : undefined;
      
      useAppStore.getState().updateGenerationProgress(jobId, progressRef.current, etaRef.current);
    }, 500);
    
    return () => clearInterval(interval);
  }, [jobId]);
  
  return {
    progress: progressRef.current,
    eta: etaRef.current,
  };
}

// Hook for generation history management
export function useGenerationHistory() {
  const { history, favorites } = useAppStore((state) => ({
    history: state.history,
    favorites: state.favorites,
  }));
  
  const { addToHistory, removeFromHistory, clearHistory, toggleFavorite, addTags } = useAppStore();
  
  // Query for server-side history (if available)
  const historyQuery = useQuery({
    queryKey: queryKeys.generation.history(),
    queryFn: async () => {
      // TODO: Implement server-side history fetching
      return history;
    },
    initialData: history,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Search and filter functions
  const searchHistory = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return history.filter(item => 
      item.params.prompt?.toLowerCase().includes(lowercaseQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }, [history]);
  
  const filterByTags = useCallback((tags: string[]) => {
    return history.filter(item => 
      tags.every(tag => item.tags.includes(tag))
    );
  }, [history]);
  
  const filterByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return history.filter(item => 
      item.timestamp >= startDate.getTime() && 
      item.timestamp <= endDate.getTime()
    );
  }, [history]);
  
  return {
    history: historyQuery.data || [],
    favorites,
    addToHistory,
    removeFromHistory,
    clearHistory,
    toggleFavorite,
    addTags,
    searchHistory,
    filterByTags,
    filterByDateRange,
    isLoading: historyQuery.isLoading,
    error: historyQuery.error,
  };
}

// Hook for batch generation
export function useBatchGeneration() {
  const { generate } = useImageGeneration();
  const { jobQueue } = useGenerationState();
  
  const generateBatch = useCallback(async (
    paramsList: GenerationParams[],
    options: {
      priority?: number;
      maxConcurrent?: number;
      onProgress?: (completed: number, total: number) => void;
    } = {}
  ) => {
    const { priority = 1, maxConcurrent = 3, onProgress } = options;
    const results: (GenerateImageResponse | Error)[] = [];
    let completed = 0;
    
    // Process in batches
    for (let i = 0; i < paramsList.length; i += maxConcurrent) {
      const batch = paramsList.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (params, index) => {
        try {
          const result = await generate(params, priority);
          completed++;
          onProgress?.(completed, paramsList.length);
          return result;
        } catch (error) {
          completed++;
          onProgress?.(completed, paramsList.length);
          return error instanceof Error ? error : new Error('Unknown error');
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : new Error('Batch generation failed')
      ));
    }
    
    return results;
  }, [generate]);
  
  const cancelBatch = useCallback(() => {
    jobQueue.forEach(job => {
      if (job.status === 'pending' || job.status === 'processing') {
        useAppStore.getState().cancelGeneration(job.id);
      }
    });
  }, [jobQueue]);
  
  return {
    generateBatch,
    cancelBatch,
    queueLength: jobQueue.length,
    activeJobs: jobQueue.filter(job => job.status === 'processing').length,
  };
}

// Hook for generation analytics
export function useGenerationAnalytics() {
  const { history } = useGenerationHistory();
  
  const analytics = useCallback(() => {
    const totalGenerations = history.length;
    const totalTime = history.reduce((sum, item) => sum + item.metadata.generationTime, 0);
    const averageTime = totalGenerations > 0 ? totalTime / totalGenerations : 0;
    
    const styleUsage = history.reduce((acc, item) => {
      const style = item.params.style || 'default';
      acc[style] = (acc[style] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const resolutionUsage = history.reduce((acc, item) => {
      const resolution = `${item.params.width}x${item.params.height}`;
      acc[resolution] = (acc[resolution] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const favoriteRate = history.length > 0 ? 
      (history.filter(item => item.isFavorite).length / history.length) * 100 : 0;
    
    return {
      totalGenerations,
      averageTime,
      styleUsage,
      resolutionUsage,
      favoriteRate,
      recentActivity: history.slice(0, 10),
    };
  }, [history]);
  
  return analytics();
}
