/**
 * Refactored Parameter Controls Component
 * Focused on technical parameters only - collapsible accordion design
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  ChevronDown,
  Shuffle,
  RotateCcw,
  Sliders,
  AlertTriangle,
  Info,
  Monitor,
  Hash,
  Clock,
  Cpu
} from 'lucide-react';

import { GenerationParams, RESOLUTIONS, SCHEDULERS, VALIDATION_CONSTRAINTS } from '../types/api';
import { validateGenerationParams, getValidationErrorMessage } from '../utils/validation';
import { Button, Tooltip, Card } from './ui';
import { cn } from '../utils/cn';

interface ParameterControlsProps {
  params: GenerationParams;
  onChange: (params: Partial<GenerationParams>) => void;
  disabled?: boolean;
  className?: string;
  showValidation?: boolean;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

// Technical parameter controls only - no presets (moved to TemplateSelector)
const ParameterControls: React.FC<ParameterControlsProps> = ({
  params,
  onChange,
  disabled = false,
  className,
  showValidation = true,
  onValidationChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Utility functions for parameter manipulation
  const generateRandomSeed = useCallback(() => {
    const maxSeed = VALIDATION_CONSTRAINTS.seed.max;
    onChange({ seed: Math.floor(Math.random() * maxSeed) });
  }, [onChange]);

  const resetToDefaults = useCallback(() => {
    onChange({
      width: 512,
      height: 512,
      steps: 20,
      guidanceScale: 7.5,
      seed: null,
      scheduler: 'ddim',
    });
  }, [onChange]);

  // Validation logic
  const validationResult = useMemo(() => {
    return validateGenerationParams(params);
  }, [params]);

  const warnings = useMemo(() => {
    const warnings = [];
    if (params.steps > 50) warnings.push('High step count may be slow');
    if (params.guidanceScale > 15) warnings.push('Very high guidance may reduce quality');
    if (params.width * params.height > 1024 * 1024) warnings.push('Large resolution requires more memory');
    if (params.guidanceScale < 3) warnings.push('Low guidance may produce unexpected results');
    return warnings;
  }, [params]);

  // Estimated generation time
  const estimatedTime = useMemo(() => {
    const baseTime = 20;
    const stepMultiplier = params.steps / 20;
    const resolutionMultiplier = (params.width * params.height) / (512 * 512);
    return Math.round(baseTime * stepMultiplier * resolutionMultiplier);
  }, [params.steps, params.width, params.height]);

  return (
    <div className={cn('w-full', className)}>
      <Card 
        variant="glass" 
        className="relative overflow-hidden"
        padding="none"
      >
        {/* Collapsible Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          className={cn(
            'w-full px-6 py-4 flex items-center justify-between',
            'bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20',
            'border-b border-gray-200/50 dark:border-gray-700/50',
            'hover:bg-gradient-to-r hover:from-blue-100/50 hover:to-purple-100/50 dark:hover:from-blue-800/20 dark:hover:to-purple-800/20',
            'transition-all duration-200',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Technical Parameters
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Estimated: ~{estimatedTime}s
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Actions */}
            <Tooltip content="Generate random seed">
              <Button
                variant="glass"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  generateRandomSeed();
                }}
                disabled={disabled}
                icon={<Shuffle className="h-4 w-4" />}
                className="text-gray-600 dark:text-gray-400"
              />
            </Tooltip>

            <Tooltip content="Reset to defaults">
              <Button
                variant="glass"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  resetToDefaults();
                }}
                disabled={disabled}
                icon={<RotateCcw className="h-4 w-4" />}
                className="text-gray-600 dark:text-gray-400"
              />
            </Tooltip>

            {/* Expand/Collapse Icon */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </motion.div>
          </div>
        </button>

        {/* Collapsible Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 space-y-6">


                {/* Parameter Controls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Resolution */}
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Monitor className="h-4 w-4" />
                      <span>Resolution</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Width</label>
                        <input
                          type="number"
                          value={params.width}
                          onChange={(e) => onChange({ width: parseInt(e.target.value) || 512 })}
                          disabled={disabled}
                          min={VALIDATION_CONSTRAINTS.width.min}
                          max={VALIDATION_CONSTRAINTS.width.max}
                          step={8}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Height</label>
                        <input
                          type="number"
                          value={params.height}
                          onChange={(e) => onChange({ height: parseInt(e.target.value) || 512 })}
                          disabled={disabled}
                          min={VALIDATION_CONSTRAINTS.height.min}
                          max={VALIDATION_CONSTRAINTS.height.max}
                          step={8}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    {/* Quick Resolution Presets */}
                    <div className="flex flex-wrap gap-2">
                      {RESOLUTIONS.map((res) => (
                        <button
                          key={`${res.width}x${res.height}`}
                          onClick={() => onChange({ width: res.width, height: res.height })}
                          disabled={disabled}
                          className={cn(
                            'px-3 py-1 text-xs rounded-lg border transition-all',
                            params.width === res.width && params.height === res.height
                              ? 'bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          )}
                        >
                          {res.width}×{res.height}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Sliders className="h-4 w-4" />
                      <span>Steps: {params.steps}</span>
                    </label>
                    <input
                      type="range"
                      value={params.steps}
                      onChange={(e) => onChange({ steps: parseInt(e.target.value) })}
                      disabled={disabled}
                      min={VALIDATION_CONSTRAINTS.steps.min}
                      max={VALIDATION_CONSTRAINTS.steps.max}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Fast ({VALIDATION_CONSTRAINTS.steps.min})</span>
                      <span>Quality ({VALIDATION_CONSTRAINTS.steps.max})</span>
                    </div>
                  </div>

                  {/* Guidance Scale */}
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Cpu className="h-4 w-4" />
                      <span>Guidance Scale: {params.guidanceScale}</span>
                    </label>
                    <input
                      type="range"
                      value={params.guidanceScale}
                      onChange={(e) => onChange({ guidanceScale: parseFloat(e.target.value) })}
                      disabled={disabled}
                      min={VALIDATION_CONSTRAINTS.guidanceScale.min}
                      max={VALIDATION_CONSTRAINTS.guidanceScale.max}
                      step={0.1}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Creative ({VALIDATION_CONSTRAINTS.guidanceScale.min})</span>
                      <span>Precise ({VALIDATION_CONSTRAINTS.guidanceScale.max})</span>
                    </div>
                  </div>

                  {/* Scheduler */}
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Settings className="h-4 w-4" />
                      <span>Scheduler</span>
                    </label>
                    <select
                      value={params.scheduler}
                      onChange={(e) => onChange({ scheduler: e.target.value as any })}
                      disabled={disabled}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {SCHEDULERS.map((scheduler) => (
                        <option key={String(scheduler)} value={String(scheduler)}>
                          {String(scheduler).toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Seed Control */}
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Hash className="h-4 w-4" />
                      <span>Seed (Optional)</span>
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={params.seed || ''}
                        onChange={(e) => onChange({ seed: e.target.value ? parseInt(e.target.value) : null })}
                        disabled={disabled}
                        placeholder="Random"
                        min={VALIDATION_CONSTRAINTS.seed.min}
                        max={VALIDATION_CONSTRAINTS.seed.max}
                        className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateRandomSeed}
                        disabled={disabled}
                        icon={<Shuffle className="h-4 w-4" />}
                      >
                        Random
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Use the same seed to reproduce identical results
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
};

export default ParameterControls;
export type { ParameterControlsProps };
