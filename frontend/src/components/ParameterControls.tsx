/**
 * Parameter Controls Component
 * 
 * Provides UI controls for adjusting image generation parameters
 * including resolution, steps, guidance scale, seed, and scheduler.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  Shuffle, 
  Info,
  Sliders
} from 'lucide-react';

import { 
  GenerationParams, 
  RESOLUTIONS, 
  SCHEDULERS 
} from '../types/api';

interface ParameterControlsProps {
  params: GenerationParams;
  onChange: (params: Partial<GenerationParams>) => void;
  disabled: boolean;
  showAdvanced: boolean;
  onRandomSeed: () => void;
}

const ParameterControls: React.FC<ParameterControlsProps> = ({
  params,
  onChange,
  disabled,
  showAdvanced,
  onRandomSeed,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Sliders className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Parameters
        </h3>
      </div>

      <div className="space-y-4">
        {/* Resolution */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Resolution
          </label>
          <select
            value={`${params.width}x${params.height}`}
            onChange={(e) => {
              const [width, height] = e.target.value.split('x').map(Number);
              onChange({ width, height });
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={disabled}
          >
            {RESOLUTIONS.map((res) => (
              <option key={`${res.width}x${res.height}`} value={`${res.width}x${res.height}`}>
                {res.label}
              </option>
            ))}
          </select>
        </div>

        {/* Negative Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Negative Prompt
          </label>
          <textarea
            value={params.negativePrompt}
            onChange={(e) => onChange({ negativePrompt: e.target.value })}
            placeholder="What to avoid in the image..."
            className="w-full h-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none text-sm"
            disabled={disabled}
          />
        </div>

        {/* Advanced Parameters */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4"
            >
              {/* Steps */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Inference Steps
                  </label>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {params.steps}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={params.steps}
                  onChange={(e) => onChange({ steps: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  disabled={disabled}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>1</span>
                  <span>100</span>
                </div>
              </div>

              {/* Guidance Scale */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Guidance Scale
                  </label>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {params.guidanceScale}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={params.guidanceScale}
                  onChange={(e) => onChange({ guidanceScale: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  disabled={disabled}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>1.0</span>
                  <span>20.0</span>
                </div>
              </div>

              {/* Seed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seed
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={params.seed || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      onChange({ seed: value ? parseInt(value) : null });
                    }}
                    placeholder="Random"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={disabled}
                    min="0"
                    max="2147483647"
                  />
                  <button
                    onClick={onRandomSeed}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                    disabled={disabled}
                    title="Generate random seed"
                  >
                    <Shuffle className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Scheduler */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scheduler
                </label>
                <select
                  value={params.scheduler}
                  onChange={(e) => onChange({ scheduler: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={disabled}
                >
                  {SCHEDULERS.map((scheduler) => (
                    <option key={scheduler.value} value={scheduler.value}>
                      {scheduler.label} - {scheduler.description}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ParameterControls;
