/**
 * Batch Generation Queue Management Component
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Square, 
  Trash2, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  Zap, 
  CheckCircle, 
  XCircle,
  MoreVertical,
  Copy,
  Edit3,
  Download,
  Eye,
  Settings,
  BarChart3
} from 'lucide-react';
import { cn } from '../utils/cn';
import { GlassCard, AdvancedButton } from '../design-system';
import { useAppStore } from '../store';
import { GenerationParams } from '../types/api';
import { useRealTimeGeneration } from '../hooks/useRealTimeGeneration';

interface BatchJob {
  id: string;
  params: GenerationParams;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'paused';
  progress: number;
  result?: any;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  estimatedTime?: number;
  actualTime?: number;
}

interface BatchGenerationQueueProps {
  className?: string;
  maxConcurrentJobs?: number;
  onJobComplete?: (job: BatchJob) => void;
  onJobFailed?: (job: BatchJob) => void;
}

export const BatchGenerationQueue: React.FC<BatchGenerationQueueProps> = ({
  className,
  maxConcurrentJobs = 3,
  onJobComplete,
  onJobFailed,
}) => {
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [showCompleted, setShowCompleted] = useState(true);
  const [sortBy, setSortBy] = useState<'priority' | 'created' | 'status'>('priority');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const { startRealTimeGeneration, cancelGeneration } = useRealTimeGeneration();
  const { showNotification } = useAppStore();

  // Add job to queue
  const addJob = useCallback((params: GenerationParams, priority: number = 1) => {
    const newJob: BatchJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      params,
      priority,
      status: 'pending',
      progress: 0,
      createdAt: Date.now(),
    };
    
    setJobs(prev => [...prev, newJob].sort((a, b) => b.priority - a.priority));
    
    showNotification({
      type: 'info',
      title: 'Job Added',
      message: `Added "${params.prompt.slice(0, 30)}..." to queue`,
      duration: 3000,
    });
  }, [showNotification]);

  // Remove job from queue
  const removeJob = useCallback((jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job?.status === 'processing') {
      cancelGeneration(jobId);
    }
    
    setJobs(prev => prev.filter(j => j.id !== jobId));
    setSelectedJobs(prev => prev.filter(id => id !== jobId));
  }, [jobs, cancelGeneration]);

  // Update job priority
  const updateJobPriority = useCallback((jobId: string, newPriority: number) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, priority: newPriority } : job
    ).sort((a, b) => b.priority - a.priority));
  }, []);

  // Pause/Resume job
  const toggleJobPause = useCallback((jobId: string) => {
    setJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        if (job.status === 'processing') {
          cancelGeneration(jobId);
          return { ...job, status: 'paused' as const };
        } else if (job.status === 'paused') {
          return { ...job, status: 'pending' as const };
        }
      }
      return job;
    }));
  }, [cancelGeneration]);

  // Duplicate job
  const duplicateJob = useCallback((jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      addJob(job.params, job.priority);
    }
  }, [jobs, addJob]);

  // Start processing queue
  const startQueue = useCallback(async () => {
    setIsProcessing(true);
    
    const pendingJobs = jobs.filter(job => job.status === 'pending');
    const processingJobs = jobs.filter(job => job.status === 'processing');
    
    // Start jobs up to the concurrent limit
    const availableSlots = maxConcurrentJobs - processingJobs.length;
    const jobsToStart = pendingJobs.slice(0, availableSlots);
    
    for (const job of jobsToStart) {
      try {
        setJobs(prev => prev.map(j => 
          j.id === job.id ? { ...j, status: 'processing', startedAt: Date.now() } : j
        ));
        
        const { jobId } = await startRealTimeGeneration(job.params, {
          priority: job.priority,
          onProgress: (progress) => {
            setJobs(prev => prev.map(j => 
              j.id === job.id ? { 
                ...j, 
                progress: progress.progress,
                estimatedTime: progress.eta 
              } : j
            ));
          },
          onComplete: (result) => {
            const completedAt = Date.now();
            setJobs(prev => prev.map(j => 
              j.id === job.id ? { 
                ...j, 
                status: 'completed',
                progress: 100,
                result,
                completedAt,
                actualTime: j.startedAt ? completedAt - j.startedAt : 0
              } : j
            ));
            
            onJobComplete?.(jobs.find(j => j.id === job.id)!);
          },
          onError: (error) => {
            setJobs(prev => prev.map(j => 
              j.id === job.id ? { 
                ...j, 
                status: 'failed',
                error,
                completedAt: Date.now()
              } : j
            ));
            
            onJobFailed?.(jobs.find(j => j.id === job.id)!);
          },
        });
        
        // Update job with real job ID
        setJobs(prev => prev.map(j => 
          j.id === job.id ? { ...j, id: jobId } : j
        ));
        
      } catch (error) {
        setJobs(prev => prev.map(j => 
          j.id === job.id ? { 
            ...j, 
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          } : j
        ));
      }
    }
  }, [jobs, maxConcurrentJobs, startRealTimeGeneration, onJobComplete, onJobFailed]);

  // Stop processing queue
  const stopQueue = useCallback(() => {
    setIsProcessing(false);
    
    // Cancel all processing jobs
    jobs.filter(job => job.status === 'processing').forEach(job => {
      cancelGeneration(job.id);
      setJobs(prev => prev.map(j => 
        j.id === job.id ? { ...j, status: 'cancelled' } : j
      ));
    });
  }, [jobs, cancelGeneration]);

  // Clear completed jobs
  const clearCompleted = useCallback(() => {
    setJobs(prev => prev.filter(job => !['completed', 'failed', 'cancelled'].includes(job.status)));
  }, []);

  // Bulk operations
  const bulkRemove = useCallback(() => {
    selectedJobs.forEach(jobId => removeJob(jobId));
    setSelectedJobs([]);
  }, [selectedJobs, removeJob]);

  const bulkPriorityUpdate = useCallback((newPriority: number) => {
    selectedJobs.forEach(jobId => updateJobPriority(jobId, newPriority));
    setSelectedJobs([]);
  }, [selectedJobs, updateJobPriority]);

  // Filter and sort jobs
  const filteredJobs = jobs
    .filter(job => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'active') return ['pending', 'processing', 'paused'].includes(job.status);
      if (filterStatus === 'completed') return ['completed', 'failed', 'cancelled'].includes(job.status);
      return job.status === filterStatus;
    })
    .filter(job => showCompleted || !['completed', 'failed', 'cancelled'].includes(job.status))
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return b.priority - a.priority;
        case 'created':
          return b.createdAt - a.createdAt;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  // Auto-start next jobs when slots become available
  useEffect(() => {
    if (isProcessing) {
      const processingCount = jobs.filter(job => job.status === 'processing').length;
      const pendingCount = jobs.filter(job => job.status === 'pending').length;
      
      if (processingCount < maxConcurrentJobs && pendingCount > 0) {
        startQueue();
      }
      
      // Stop processing if no more jobs
      if (processingCount === 0 && pendingCount === 0) {
        setIsProcessing(false);
      }
    }
  }, [jobs, isProcessing, maxConcurrentJobs, startQueue]);

  // Status icon component
  const StatusIcon = ({ status }: { status: BatchJob['status'] }) => {
    const iconProps = { className: 'w-4 h-4' };
    
    switch (status) {
      case 'pending':
        return <Clock {...iconProps} className="text-gray-500" />;
      case 'processing':
        return <Zap {...iconProps} className="text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle {...iconProps} className="text-green-500" />;
      case 'failed':
        return <XCircle {...iconProps} className="text-red-500" />;
      case 'cancelled':
        return <Square {...iconProps} className="text-gray-500" />;
      case 'paused':
        return <Pause {...iconProps} className="text-yellow-500" />;
      default:
        return <Clock {...iconProps} className="text-gray-500" />;
    }
  };

  // Progress bar component
  const ProgressBar = ({ progress, status }: { progress: number; status: BatchJob['status'] }) => (
    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <motion.div
        className={cn(
          'h-full rounded-full transition-colors duration-300',
          status === 'processing' && 'bg-gradient-to-r from-blue-500 to-purple-500',
          status === 'completed' && 'bg-green-500',
          status === 'failed' && 'bg-red-500',
          status === 'cancelled' && 'bg-gray-500',
          status === 'paused' && 'bg-yellow-500'
        )}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  );

  // Job item component
  const JobItem = ({ job }: { job: BatchJob }) => {
    const isSelected = selectedJobs.includes(job.id);
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          'p-4 bg-white/5 dark:bg-white/3 backdrop-blur-sm rounded-lg border border-white/10 transition-all duration-200',
          isSelected && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-900'
        )}
      >
        <div className="flex items-start space-x-3">
          {/* Selection checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedJobs(prev => [...prev, job.id]);
              } else {
                setSelectedJobs(prev => prev.filter(id => id !== job.id));
              }
            }}
            className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          
          {/* Job content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <StatusIcon status={job.status} />
                <span className="text-sm font-medium capitalize">{job.status}</span>
                <span className="text-xs text-gray-500">Priority: {job.priority}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <AdvancedButton
                  variant="ghost"
                  size="xs"
                  onClick={() => duplicateJob(job.id)}
                  icon={<Copy className="w-3 h-3" />}
                  title="Duplicate"
                />
                
                <AdvancedButton
                  variant="ghost"
                  size="xs"
                  onClick={() => toggleJobPause(job.id)}
                  icon={job.status === 'paused' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                  title={job.status === 'paused' ? 'Resume' : 'Pause'}
                  disabled={!['processing', 'paused'].includes(job.status)}
                />
                
                <AdvancedButton
                  variant="ghost"
                  size="xs"
                  onClick={() => removeJob(job.id)}
                  icon={<Trash2 className="w-3 h-3" />}
                  title="Remove"
                />
              </div>
            </div>
            
            <div className="mb-2">
              <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                {job.params.prompt}
              </p>
            </div>
            
            <ProgressBar progress={job.progress} status={job.status} />
            
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>
                {job.status === 'processing' && job.estimatedTime ? 
                  `ETA: ${Math.ceil(job.estimatedTime / 1000)}s` :
                  job.actualTime ? 
                  `Completed in ${Math.ceil(job.actualTime / 1000)}s` :
                  `Created ${new Date(job.createdAt).toLocaleTimeString()}`
                }
              </span>
              <span>{Math.round(job.progress)}%</span>
            </div>
            
            {job.error && (
              <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
                {job.error}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/10 dark:bg-white/5 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">Batch Generation Queue</h2>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {jobs.filter(j => j.status === 'processing').length} processing, {jobs.filter(j => j.status === 'pending').length} pending
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Queue controls */}
          <AdvancedButton
            variant={isProcessing ? "danger" : "primary"}
            size="sm"
            onClick={isProcessing ? stopQueue : startQueue}
            icon={isProcessing ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            disabled={jobs.filter(j => j.status === 'pending').length === 0 && !isProcessing}
          >
            {isProcessing ? 'Stop Queue' : 'Start Queue'}
          </AdvancedButton>
          
          <AdvancedButton
            variant="ghost"
            size="sm"
            onClick={clearCompleted}
            icon={<Trash2 className="w-4 h-4" />}
            disabled={jobs.filter(j => ['completed', 'failed', 'cancelled'].includes(j.status)).length === 0}
          >
            Clear Completed
          </AdvancedButton>
        </div>
      </div>
      
      {/* Filters and controls */}
      <div className="flex items-center justify-between p-4 bg-white/5 dark:bg-white/3 border-b border-white/10">
        <div className="flex items-center space-x-4">
          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1 bg-white/10 dark:bg-white/5 border border-white/20 rounded text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          
          {/* Sort by */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 bg-white/10 dark:bg-white/5 border border-white/20 rounded text-sm"
          >
            <option value="priority">Sort by Priority</option>
            <option value="created">Sort by Created</option>
            <option value="status">Sort by Status</option>
          </select>
          
          {/* Show completed toggle */}
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span>Show Completed</span>
          </label>
        </div>
        
        {/* Bulk actions */}
        {selectedJobs.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedJobs.length} selected
            </span>
            
            <AdvancedButton
              variant="ghost"
              size="sm"
              onClick={() => bulkPriorityUpdate(5)}
              icon={<ArrowUp className="w-4 h-4" />}
            >
              High Priority
            </AdvancedButton>
            
            <AdvancedButton
              variant="ghost"
              size="sm"
              onClick={() => bulkPriorityUpdate(1)}
              icon={<ArrowDown className="w-4 h-4" />}
            >
              Low Priority
            </AdvancedButton>
            
            <AdvancedButton
              variant="danger"
              size="sm"
              onClick={bulkRemove}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Remove
            </AdvancedButton>
          </div>
        )}
      </div>
      
      {/* Job list */}
      <div className="flex-1 overflow-auto p-4">
        {filteredJobs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No jobs in queue</p>
              <p className="text-sm">Add some generation jobs to get started</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredJobs.map((job) => (
                <JobItem key={job.id} job={job} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Statistics */}
      <div className="p-4 bg-white/5 dark:bg-white/3 border-t border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold">{jobs.length}</div>
            <div className="text-xs text-gray-500">Total Jobs</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-500">
              {jobs.filter(j => j.status === 'processing').length}
            </div>
            <div className="text-xs text-gray-500">Processing</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-500">
              {jobs.filter(j => j.status === 'completed').length}
            </div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-red-500">
              {jobs.filter(j => j.status === 'failed').length}
            </div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchGenerationQueue;
