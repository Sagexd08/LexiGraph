/**
 * Advanced Batch Processor Component
 * Professional-grade batch image generation with queue management and optimization
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  RotateCcw,
  Plus,
  Minus,
  Upload,
  Download,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Edit3,
  Copy,
  Grid,
  List,
  Filter,
  Search,
  BarChart3,
  Zap,
  Target,
  Layers
} from 'lucide-react';
import { GlassCard, AdvancedButton } from '../../design-system';
import { cn } from '../../lib/utils';

interface BatchProcessorProps {
  className?: string;
}

interface BatchJob {
  id: string;
  prompt: string;
  negativePrompt?: string;
  params: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  progress: number;
  estimatedTime?: number;
  startTime?: Date;
  endTime?: Date;
  resultUrl?: string;
  error?: string;
  priority: 'low' | 'normal' | 'high';
}

interface BatchStats {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  pending: number;
  avgTime: number;
  totalTime: number;
  successRate: number;
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({ className }) => {
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [batchSettings, setBatchSettings] = useState({
    maxConcurrent: 1,
    autoRetry: true,
    retryAttempts: 3,
    priorityMode: true,
    saveResults: true,
    notifyOnComplete: true
  });

  // Mock batch jobs for demonstration
  useEffect(() => {
    const mockJobs: BatchJob[] = [
      {
        id: '1',
        prompt: 'A majestic dragon soaring through clouds, fantasy art style',
        params: { steps: 30, cfg_scale: 7.5, width: 512, height: 512 },
        status: 'completed',
        progress: 100,
        startTime: new Date(Date.now() - 120000),
        endTime: new Date(Date.now() - 60000),
        resultUrl: 'https://picsum.photos/512/512?random=1',
        priority: 'normal'
      },
      {
        id: '2',
        prompt: 'Cyberpunk cityscape at night with neon lights',
        params: { steps: 25, cfg_scale: 8.0, width: 768, height: 512 },
        status: 'processing',
        progress: 65,
        startTime: new Date(Date.now() - 30000),
        estimatedTime: 45,
        priority: 'high'
      },
      {
        id: '3',
        prompt: 'Serene mountain landscape with lake reflection',
        params: { steps: 20, cfg_scale: 7.0, width: 512, height: 512 },
        status: 'pending',
        progress: 0,
        priority: 'normal'
      },
      {
        id: '4',
        prompt: 'Abstract geometric patterns in vibrant colors',
        params: { steps: 35, cfg_scale: 9.0, width: 1024, height: 1024 },
        status: 'failed',
        progress: 0,
        error: 'GPU memory exceeded',
        priority: 'low'
      }
    ];
    setJobs(mockJobs);
  }, []);

  // Calculate batch statistics
  const stats: BatchStats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    pending: jobs.filter(j => j.status === 'pending').length,
    avgTime: 45, // Mock average
    totalTime: jobs.reduce((acc, job) => {
      if (job.startTime && job.endTime) {
        return acc + (job.endTime.getTime() - job.startTime.getTime()) / 1000;
      }
      return acc;
    }, 0),
    successRate: jobs.length > 0 ? (jobs.filter(j => j.status === 'completed').length / jobs.length) * 100 : 0
  };

  // Filter jobs based on search and status
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const startBatchProcessing = () => {
    setIsProcessing(true);
    // Simulate batch processing
    const pendingJobs = jobs.filter(j => j.status === 'pending');
    if (pendingJobs.length > 0) {
      setCurrentJobId(pendingJobs[0].id);
      simulateJobProcessing(pendingJobs[0].id);
    }
  };

  const pauseBatchProcessing = () => {
    setIsProcessing(false);
    setCurrentJobId(null);
  };

  const stopBatchProcessing = () => {
    setIsProcessing(false);
    setCurrentJobId(null);
    // Reset all processing jobs to pending
    setJobs(prev => prev.map(job => 
      job.status === 'processing' ? { ...job, status: 'pending', progress: 0 } : job
    ));
  };

  const simulateJobProcessing = (jobId: string) => {
    const interval = setInterval(() => {
      setJobs(prev => prev.map(job => {
        if (job.id === jobId && job.status === 'processing') {
          const newProgress = Math.min(job.progress + Math.random() * 10, 100);
          if (newProgress >= 100) {
            clearInterval(interval);
            return {
              ...job,
              status: 'completed',
              progress: 100,
              endTime: new Date(),
              resultUrl: `https://picsum.photos/512/512?random=${Date.now()}`
            };
          }
          return { ...job, progress: newProgress };
        }
        return job;
      }));
    }, 500);
  };

  const addJob = () => {
    const newJob: BatchJob = {
      id: Date.now().toString(),
      prompt: 'New generation prompt',
      params: { steps: 20, cfg_scale: 7.5, width: 512, height: 512 },
      status: 'pending',
      progress: 0,
      priority: 'normal'
    };
    setJobs(prev => [...prev, newJob]);
  };

  const removeJob = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const duplicateJob = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      const newJob = {
        ...job,
        id: Date.now().toString(),
        status: 'pending' as const,
        progress: 0,
        startTime: undefined,
        endTime: undefined,
        resultUrl: undefined,
        error: undefined
      };
      setJobs(prev => [...prev, newJob]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'processing': return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-400" />;
      default: return <Clock className="h-4 w-4 text-neutral-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'processing': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      case 'paused': return 'text-yellow-400';
      default: return 'text-neutral-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'normal': return 'text-blue-400';
      case 'low': return 'text-neutral-400';
      default: return 'text-neutral-400';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4" variant="subtle">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-neutral-400">Total Jobs</div>
            </div>
            <BarChart3 className="h-8 w-8 text-primary-400" />
          </div>
        </GlassCard>

        <GlassCard className="p-4" variant="subtle">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
              <div className="text-sm text-neutral-400">Completed</div>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </GlassCard>

        <GlassCard className="p-4" variant="subtle">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-400">{stats.processing}</div>
              <div className="text-sm text-neutral-400">Processing</div>
            </div>
            <Loader2 className="h-8 w-8 text-blue-400" />
          </div>
        </GlassCard>

        <GlassCard className="p-4" variant="subtle">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{stats.successRate.toFixed(1)}%</div>
              <div className="text-sm text-neutral-400">Success Rate</div>
            </div>
            <Target className="h-8 w-8 text-primary-400" />
          </div>
        </GlassCard>
      </div>

      {/* Controls */}
      <GlassCard className="p-6" variant="elevated">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-white">Batch Processor</h3>
          </div>

          <div className="flex items-center gap-2">
            <AdvancedButton
              onClick={() => setShowSettings(!showSettings)}
              variant="ghost"
              size="sm"
              icon={<Settings className="h-4 w-4" />}
            >
              Settings
            </AdvancedButton>
          </div>
        </div>

        {/* Batch Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {!isProcessing ? (
              <AdvancedButton
                onClick={startBatchProcessing}
                variant="primary"
                icon={<Play className="h-4 w-4" />}
                disabled={stats.pending === 0}
              >
                Start Batch
              </AdvancedButton>
            ) : (
              <AdvancedButton
                onClick={pauseBatchProcessing}
                variant="secondary"
                icon={<Pause className="h-4 w-4" />}
              >
                Pause
              </AdvancedButton>
            )}
            
            <AdvancedButton
              onClick={stopBatchProcessing}
              variant="ghost"
              icon={<Square className="h-4 w-4" />}
              disabled={!isProcessing}
            >
              Stop
            </AdvancedButton>

            <AdvancedButton
              onClick={addJob}
              variant="ghost"
              icon={<Plus className="h-4 w-4" />}
            >
              Add Job
            </AdvancedButton>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-neutral-800/50 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-neutral-800/50 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>

            <div className="flex items-center border border-white/20 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-neutral-400 hover:text-white'
                )}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-neutral-400 hover:text-white'
                )}
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Job Queue */}
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <motion.div
              key={job.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 bg-neutral-800/30 rounded-lg border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(job.status)}
                    <span className={cn('text-sm font-medium', getStatusColor(job.status))}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                    <span className={cn('text-xs px-2 py-1 rounded', getPriorityColor(job.priority))}>
                      {job.priority} priority
                    </span>
                  </div>
                  
                  <div className="text-white font-medium mb-1">{job.prompt}</div>
                  
                  <div className="flex items-center gap-4 text-sm text-neutral-400">
                    <span>{job.params.width}×{job.params.height}</span>
                    <span>{job.params.steps} steps</span>
                    <span>CFG: {job.params.cfg_scale}</span>
                    {job.estimatedTime && (
                      <span>~{job.estimatedTime}s remaining</span>
                    )}
                  </div>

                  {job.status === 'processing' && (
                    <div className="mt-2">
                      <div className="w-full bg-neutral-700 rounded-full h-2">
                        <motion.div
                          className="bg-blue-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${job.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <div className="text-xs text-neutral-400 mt-1">
                        {job.progress.toFixed(1)}% complete
                      </div>
                    </div>
                  )}

                  {job.error && (
                    <div className="mt-2 text-sm text-red-400">
                      Error: {job.error}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <AdvancedButton
                    onClick={() => duplicateJob(job.id)}
                    variant="ghost"
                    size="sm"
                    icon={<Copy className="h-4 w-4" />}
                  />
                  <AdvancedButton
                    onClick={() => removeJob(job.id)}
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="h-4 w-4" />}
                    className="text-red-400 hover:text-red-300"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Layers className="h-12 w-12 mx-auto mb-4 text-neutral-400 opacity-50" />
            <h3 className="text-lg font-semibold text-white mb-2">No jobs found</h3>
            <p className="text-neutral-400 mb-4">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Add your first batch job to get started'
              }
            </p>
            <AdvancedButton
              onClick={addJob}
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
            >
              Add Job
            </AdvancedButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
