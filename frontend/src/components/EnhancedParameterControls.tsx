/**
 * Enhanced Parameter Controls Component
 * 
 * Advanced controls for generation parameters with presets, validation, and real-time feedback
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  Shuffle, 
  RotateCcw,
  Sliders,
  Save,
  Bookmark,
  AlertTriangle,
  Info,
  Zap,
  Clock,
  Cpu
} from 'lucide-react';

import { GenerationParams, RESOLUTIONS, SCHEDULERS } from '../types/api';
import { Button, Tooltip, Card } from './ui';

interface ParameterControlsProps {
  params: GenerationParams;
  onChange: (params: Partial<GenerationParams>) => void;
  disabled: boolean;
  styles: Record<string, any>;
}

interface ParameterPreset {
  id: string;
  name: string;
  description: string;
  params: Partial<GenerationParams>;
  category: 'quality' | 'speed' | 'creative' | 'custom';
  estimatedTime: string;
}

const PARAMETER_PRESETS: ParameterPreset[] = [
  {
    id: 'fast',
    name: 'Fast',
    description: 'Quick generation with good quality',
    params: { steps: 15, guidanceScale: 7.0, width: 512, height: 512, scheduler: 'euler' },
    category: 'speed',
    estimatedTime: '~15s'
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Good balance of speed and quality',
    params: { steps: 20, guidanceScale: 7.5, width: 512, height: 512, scheduler: 'ddim' },
    category: 'quality',
    estimatedTime: '~25s'
  },
  {
    id: 'high-quality',
    name: 'High Quality',
    description: 'Best quality, slower generation',
    params: { steps: 30, guidanceScale: 8.0, width: 768, height: 768, scheduler: 'dpm' },
    category: 'quality',
    estimatedTime: '~45s'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'More creative and varied results',
    params: { steps: 25, guidanceScale: 6.0, width: 512, height: 512, scheduler: 'euler_a' },
    category: 'creative',
    estimatedTime: '~30s'
  }
];

const EnhancedParameterControls: React.FC<ParameterControlsProps> = ({
  params,
  onChange,
  disabled,
  styles,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [customPresets, setCustomPresets] = useState<ParameterPreset[]>([]);

  const generateRandomSeed = useCallback(() => {
    onChange({ seed: Math.floor(Math.random() * 2147483647) });
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

  const applyPreset = useCallback((preset: ParameterPreset) => {
    onChange(preset.params);
    setShowPresets(false);
  }, [onChange]);

  const saveAsPreset = useCallback(() => {
    const name = prompt('Enter preset name:');
    if (name) {
      const newPreset: ParameterPreset = {
        id: `custom-${Date.now()}`,
        name,
        description: 'Custom preset',
        params: { ...params },
        category: 'custom',
        estimatedTime: '~?s'
      };
      setCustomPresets(prev => [...prev, newPreset]);
    }
  }, [params]);

  // Validation and warnings
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
    const baseTime = 20; // seconds
    const stepMultiplier = params.steps / 20;
    const resolutionMultiplier = (params.width * params.height) / (512 * 512);
    return Math.round(baseTime * stepMultiplier * resolutionMultiplier);
  }, [params.steps, params.width, params.height]);

  const allPresets = [...PARAMETER_PRESETS, ...customPresets];

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Generation Parameters
            </h3>
            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>~{estimatedTime}s</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Tooltip content="Save current settings as preset">
              <Button
                variant="ghost"
                size="sm"
                onClick={saveAsPreset}
                disabled={disabled}
                icon={<Save className="h-4 w-4" />}
              />
            </Tooltip>
            
            <Tooltip content="Load preset">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPresets(!showPresets)}
                icon={<Bookmark className="h-4 w-4" />}
              />
            </Tooltip>
            
            <Tooltip content="Reset to defaults">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToDefaults}
                disabled={disabled}
                icon={<RotateCcw className="h-4 w-4" />}
              />
            </Tooltip>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              icon={showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            >
              Advanced
            </Button>
          </div>
        </div>

        {/* Warnings */}
        <AnimatePresence>
          {warnings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
            >
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  {warnings.map((warning, index) => (
                    <div key={index}>{warning}</div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Presets Panel */}
        <AnimatePresence>
          {showPresets && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
            >
              <h4 className="font-medium mb-3">Parameter Presets</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    disabled={disabled}
                    className="text-left p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{preset.name}</span>
                      <div className="flex items-center space-x-1">
                        {preset.category === 'speed' && <Zap className="h-3 w-3 text-green-500" />}
                        {preset.category === 'quality' && <Cpu className="h-3 w-3 text-blue-500" />}
                        {preset.category === 'creative' && <Shuffle className="h-3 w-3 text-purple-500" />}
                        <span className="text-xs text-gray-500">{preset.estimatedTime}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{preset.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Basic Parameters */}
      <div className="p-6 space-y-6">
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={disabled}
          >
            {RESOLUTIONS.map((res) => (
              <option key={`${res.width}x${res.height}`} value={`${res.width}x${res.height}`}>
                {res.label}
              </option>
            ))}
          </select>
        </div>

        {/* Style */}
        {Object.keys(styles).length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Style Preset
            </label>
            <select
              value={params.style}
              onChange={(e) => onChange({ style: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={disabled}
            >
              <option value="">No Style</option>
              {Object.entries(styles).map(([key, style]) => (
                <option key={key} value={key}>
                  {style.name || key}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Steps */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Inference Steps
            </label>
            <span className="text-sm text-gray-500 dark:text-gray-400">{params.steps}</span>
          </div>
          <input
            type="range"
            min="10"
            max="50"
            step="1"
            value={params.steps}
            onChange={(e) => onChange({ steps: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            disabled={disabled}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Fast (10)</span>
            <span>Balanced (20)</span>
            <span>Quality (50)</span>
          </div>
        </div>

        {/* Guidance Scale */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Guidance Scale
            </label>
            <span className="text-sm text-gray-500 dark:text-gray-400">{params.guidanceScale}</span>
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
            <span>Creative (1)</span>
            <span>Balanced (7.5)</span>
            <span>Strict (20)</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EnhancedParameterControls;
