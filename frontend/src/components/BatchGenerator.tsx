

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  Plus,
  Minus,
  Shuffle,
  Download,
  Grid,
  List,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

import { GlassCard, AdvancedButton } from '../design-system';
import { Button, Card, Modal, Input, Tooltip } from './ui';
import { GenerationParams, GenerateImageResponse } from '../types/api';

interface BatchJob {
  id: string;
  prompt: string;
  params: GenerationParams;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  result?: GenerateImageResponse;
  error?: string;
  startTime?: number;
  endTime?: number;
}

interface BatchGeneratorProps {
  baseParams: GenerationParams;
  onGenerate: (params: GenerationParams) => Promise<GenerateImageResponse>;
  disabled?: boolean;
}

const BatchGenerator: React.FC<BatchGeneratorProps> = ({
  baseParams,
  onGenerate,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [batchSize, setBatchSize] = useState(4);
  const [variationMode, setVariationMode] = useState<'seed' | 'prompt' | 'params'>('seed');
  const [promptVariations, setPromptVariations] = useState<string[]>(['']);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const generateVariations = useCallback(() => {
    const variations: BatchJob[] = [];

    switch (variationMode) {
      case 'seed':
        for (let i = 0; i < batchSize; i++) {
          variations.push({
            id: `seed-${i}-${Date.now()}`,
            prompt: baseParams.prompt,
            params: {
              ...baseParams,
              seed: Math.floor(Math.random() * 2147483647)
            },
            status: 'pending'
          });
        }
        break;

      case 'prompt':
        promptVariations.filter(p => p.trim()).forEach((prompt, i) => {
          variations.push({
            id: `prompt-${i}-${Date.now()}`,
            prompt,
            params: {
              ...baseParams,
              prompt
            },
            status: 'pending'
          });
        });
        break;

      case 'params':
        const guidanceScales = [6.0, 7.5, 9.0, 12.0];
        const steps = [15, 20, 25, 30];

        for (let i = 0; i < Math.min(batchSize, 4); i++) {
          variations.push({
            id: `params-${i}-${Date.now()}`,
            prompt: baseParams.prompt,
            params: {
              ...baseParams,
              guidanceScale: guidanceScales[i],
              steps: steps[i],
              seed: Math.floor(Math.random() * 2147483647)
            },
            status: 'pending'
          });
        }
        break;
    }

    setJobs(variations);
  }, [baseParams, batchSize, variationMode, promptVariations]);

  const startBatch = useCallback(async () => {
    if (jobs.length === 0) return;

    setIsRunning(true);
    setCurrentJobIndex(0);

    for (let i = 0; i < jobs.length; i++) {
      if (!isRunning) break;

      setCurrentJobIndex(i);
      setJobs(prev => prev.map((job, index) =>
        index === i ? { ...job, status: 'generating', startTime: Date.now() } : job
      ));

      try {
        const result = await onGenerate(jobs[i].params);
        setJobs(prev => prev.map((job, index) =>
          index === i ? {
            ...job,
            status: 'completed',
            result,
            endTime: Date.now()
          } : job
        ));
      } catch (error) {
        setJobs(prev => prev.map((job, index) =>
          index === i ? {
            ...job,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            endTime: Date.now()
          } : job
        ));
      }
    }

    setIsRunning(false);
  }, [jobs, onGenerate, isRunning]);

  const stopBatch = useCallback(() => {
    setIsRunning(false);
  }, []);

  const clearJobs = useCallback(() => {
    setJobs([]);
    setCurrentJobIndex(0);
  }, []);

  const downloadAll = useCallback(() => {
    jobs.forEach((job, index) => {
      if (job.result?.image) {
        const link = document.createElement('a');
        link.href = job.result.image;
        link.download = `batch-${index + 1}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  }, [jobs]);

  const addPromptVariation = () => {
    setPromptVariations(prev => [...prev, '']);
  };

  const removePromptVariation = (index: number) => {
    setPromptVariations(prev => prev.filter((_, i) => i !== index));
  };

  const updatePromptVariation = (index: number, value: string) => {
    setPromptVariations(prev => prev.map((p, i) => i === index ? value : p));
  };

  const completedJobs = jobs.filter(job => job.status === 'completed').length;
  const failedJobs = jobs.filter(job => job.status === 'failed').length;
  const progress = jobs.length > 0 ? (completedJobs + failedJobs) / jobs.length * 100 : 0;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        icon={<Grid className="h-4 w-4" />}
        disabled={disabled}
      >
        Batch Generate
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Batch Generation"
        size="xl"
      >
        <div className="space-y-6">
          {}
          <Card className="p-4">
            <h4 className="font-semibold mb-4">Batch Configuration</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Variation Mode</label>
                <select
                  value={variationMode}
                  onChange={(e) => setVariationMode(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
                >
                  <option value="seed">Different Seeds</option>
                  <option value="prompt">Different Prompts</option>
                  <option value="params">Different Parameters</option>
                </select>
              </div>

              {variationMode !== 'prompt' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Batch Size</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
                  />
                </div>
              )}
            </div>

            {}
            {variationMode === 'prompt' && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Prompt Variations</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addPromptVariation}
                    icon={<Plus className="h-4 w-4" />}
                  >
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {promptVariations.map((prompt, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={prompt}
                        onChange={(e) => updatePromptVariation(index, e.target.value)}
                        placeholder={`Prompt variation ${index + 1}...`}
                      />
                      {promptVariations.length > 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removePromptVariation(index)}
                          icon={<Minus className="h-4 w-4" />}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <AdvancedButton
                onClick={generateVariations}
                icon={<Shuffle className="h-4 w-4" />}
                disabled={isRunning}
                variant="secondary"
              >
                Generate Variations
              </AdvancedButton>

              {jobs.length > 0 && (
                <>
                  <AdvancedButton
                    onClick={isRunning ? stopBatch : startBatch}
                    variant={isRunning ? 'danger' : 'primary'}
                    icon={isRunning ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  >
                    {isRunning ? 'Stop' : 'Start Batch'}
                  </AdvancedButton>

                  <AdvancedButton
                    onClick={clearJobs}
                    variant="ghost"
                    disabled={isRunning}
                  >
                    Clear
                  </AdvancedButton>
                </>
              )}
            </div>
          </Card>

          {}
          {jobs.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Progress</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={viewMode === 'grid' ? 'primary' : 'outline'}
                      onClick={() => setViewMode('grid')}
                      icon={<Grid className="h-4 w-4" />}
                    />
                    <Button
                      size="sm"
                      variant={viewMode === 'list' ? 'primary' : 'outline'}
                      onClick={() => setViewMode('list')}
                      icon={<List className="h-4 w-4" />}
                    />
                  </div>

                  {completedJobs > 0 && (
                    <Button
                      size="sm"
                      onClick={downloadAll}
                      icon={<Download className="h-4 w-4" />}
                    >
                      Download All
                    </Button>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>{completedJobs + failedJobs} / {jobs.length} completed</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{completedJobs} completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>{failedJobs} failed</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span>{jobs.length - completedJobs - failedJobs} pending</span>
                </div>
              </div>
            </Card>
          )}

          {}
          {jobs.length > 0 && (
            <Card className="p-4">
              <h4 className="font-semibold mb-4">Results</h4>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {jobs.map((job, index) => (
                    <div key={job.id} className="relative">
                      <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        {job.result?.image ? (
                          <img
                            src={job.result.image}
                            alt={`Batch result ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {job.status === 'generating' && (
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                            )}
                            {job.status === 'pending' && (
                              <Clock className="h-8 w-8 text-gray-400" />
                            )}
                            {job.status === 'failed' && (
                              <XCircle className="h-8 w-8 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="absolute top-2 right-2">
                        {job.status === 'completed' && (
                          <CheckCircle className="h-5 w-5 text-green-500 bg-white rounded-full" />
                        )}
                        {job.status === 'failed' && (
                          <XCircle className="h-5 w-5 text-red-500 bg-white rounded-full" />
                        )}
                        {job.status === 'generating' && (
                          <div className="h-5 w-5 bg-indigo-600 rounded-full animate-pulse" />
                        )}
                      </div>

                      {index === currentJobIndex && isRunning && (
                        <div className="absolute inset-0 border-2 border-indigo-500 rounded-lg" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {jobs.map((job, index) => (
                    <div
                      key={job.id}
                      className={`p-3 border rounded-lg ${
                        index === currentJobIndex && isRunning
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {job.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {job.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                            {job.status === 'generating' && <div className="h-4 w-4 bg-indigo-600 rounded-full animate-pulse" />}
                            {job.status === 'pending' && <Clock className="h-4 w-4 text-gray-400" />}
                          </div>
                          <span className="text-sm font-medium">Job {index + 1}</span>
                        </div>

                        <div className="text-sm text-gray-500">
                          {job.endTime && job.startTime && (
                            <span>{((job.endTime - job.startTime) / 1000).toFixed(1)}s</span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                        {job.prompt}
                      </p>

                      {job.error && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          Error: {job.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </Modal>
    </>
  );
};

export default BatchGenerator;
