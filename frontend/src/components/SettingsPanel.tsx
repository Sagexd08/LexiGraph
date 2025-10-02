import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  XMarkIcon,
  ComputerDesktopIcon,
  SunIcon,
  MoonIcon,
  Cog6ToothIcon,
  PaintBrushIcon,
  PhotoIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

import { GenerationParams, VALIDATION_CONSTRAINTS, SCHEDULERS } from '../types/api';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { sanitizeGenerationParams } from '../utils/validation';
import { GlassCard, AdvancedButton } from '../design-system';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  isDark: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  theme,
  setTheme,
  isDark
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'generation' | 'advanced'>('general');
  const [defaultParams, setDefaultParams] = useLocalStorage<GenerationParams>('default-generation-params', {
    prompt: '',
    negativePrompt: 'low quality, blurry, distorted',
    width: 512,
    height: 512,
    steps: 20,
    guidanceScale: 7.5,
    seed: null,
    style: '',
    scheduler: 'ddim',
  });

  const themeOptions = [
    { value: 'light', label: 'Light', icon: SunIcon },
    { value: 'dark', label: 'Dark', icon: MoonIcon },
    { value: 'system', label: 'System', icon: ComputerDesktopIcon },
  ] as const;

  const tabs = [
    { id: 'general', label: 'General', icon: Cog6ToothIcon },
    { id: 'generation', label: 'Generation', icon: PhotoIcon },
    { id: 'advanced', label: 'Advanced', icon: PaintBrushIcon },
  ] as const;

  const handleDefaultParamChange = (updates: Partial<GenerationParams>) => {
    const newParams = { ...defaultParams, ...updates };
    const sanitized = sanitizeGenerationParams(newParams);
    setDefaultParams(sanitized);
  };

  const resetToDefaults = () => {
    setDefaultParams({
      prompt: '',
      negativePrompt: 'low quality, blurry, distorted',
      width: 512,
      height: 512,
      steps: 20,
      guidanceScale: 7.5,
      seed: null,
      style: '',
      scheduler: 'ddim',
    });
  };

  return (
    <>
      {}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />

      {}
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-96 z-50 overflow-y-auto"
      >
        <div className="h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
          <div className="h-full bg-gradient-to-tr from-primary-950/20 via-transparent to-secondary-950/20 backdrop-blur-xl">
            <GlassCard className="h-full rounded-none border-l border-white/20" variant="elevated">
        <div className="p-6">
          {}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Settings
                </h2>
                <AdvancedButton
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  icon={<XMarkIcon className="w-5 h-5" />}
                  className="text-neutral-400 hover:text-white"
                />
              </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? isDark
                          ? 'bg-gray-700 text-white'
                          : 'bg-white text-gray-900 shadow-sm'
                        : isDark
                          ? 'text-gray-400 hover:text-gray-300'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Theme Settings */}
              <div>
                <h3 className={`text-sm font-medium mb-3 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Theme
                </h3>
                <div className="space-y-2">
                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                          theme === option.value
                            ? isDark
                              ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
                              : 'bg-purple-100 text-purple-700 border border-purple-200'
                            : isDark
                              ? 'hover:bg-gray-800 text-gray-300 border border-transparent'
                              : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                        } border`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{option.label}</span>
                        {theme === option.value && (
                          <div className={`ml-auto w-2 h-2 rounded-full ${
                            isDark ? 'bg-purple-400' : 'bg-purple-600'
                          }`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Generation Settings Tab */}
          {activeTab === 'generation' && (
            <div className="space-y-6">
              {/* Default Parameters */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-medium ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Default Parameters
                  </h3>
                  <button
                    onClick={resetToDefaults}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      isDark
                        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <ArrowPathIcon className="w-3 h-3 inline mr-1" />
                    Reset
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Dimensions */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Width
                      </label>
                      <select
                        value={defaultParams.width}
                        onChange={(e) => handleDefaultParamChange({ width: parseInt(e.target.value) })}
                        className={`w-full px-3 py-2 text-sm rounded-md border ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        {[512, 576, 640, 704, 768].map(size => (
                          <option key={size} value={size}>{size}px</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Height
                      </label>
                      <select
                        value={defaultParams.height}
                        onChange={(e) => handleDefaultParamChange({ height: parseInt(e.target.value) })}
                        className={`w-full px-3 py-2 text-sm rounded-md border ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        {[512, 576, 640, 704, 768].map(size => (
                          <option key={size} value={size}>{size}px</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Steps */}
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Steps: {defaultParams.steps}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={defaultParams.steps}
                      onChange={(e) => handleDefaultParamChange({ steps: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>Fast (1)</span>
                      <span>Balanced (20)</span>
                      <span>Quality (100)</span>
                    </div>
                  </div>

                  {/* Guidance Scale */}
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Guidance Scale: {defaultParams.guidanceScale}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="0.5"
                      value={defaultParams.guidanceScale}
                      onChange={(e) => handleDefaultParamChange({ guidanceScale: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>Creative (1)</span>
                      <span>Balanced (7.5)</span>
                      <span>Strict (20)</span>
                    </div>
                  </div>

                  {/* Scheduler */}
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Scheduler
                    </label>
                    <select
                      value={defaultParams.scheduler}
                      onChange={(e) => handleDefaultParamChange({ scheduler: e.target.value })}
                      className={`w-full px-3 py-2 text-sm rounded-md border ${
                        isDark
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {SCHEDULERS.map(scheduler => (
                        <option key={scheduler.value} value={scheduler.value}>
                          {scheduler.label} - {scheduler.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Negative Prompt */}
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Default Negative Prompt
                    </label>
                    <textarea
                      value={defaultParams.negativePrompt}
                      onChange={(e) => handleDefaultParamChange({ negativePrompt: e.target.value })}
                      rows={3}
                      className={`w-full px-3 py-2 text-sm rounded-md border resize-none ${
                        isDark
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="Enter default negative prompt..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-sm font-medium mb-3 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Advanced Options
                </h3>
                <div className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <p>Advanced settings will be available in future updates.</p>
                  <p className="mt-2">Features coming soon:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Custom model loading</li>
                    <li>LoRA weight adjustments</li>
                    <li>Memory optimization settings</li>
                    <li>Batch processing preferences</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {}
          <div className="border-t pt-6 mt-6">
            <h3 className={`text-sm font-medium mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              About LexiGraph
            </h3>
            <div className={`text-sm space-y-2 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <p>
                LexiGraph is a production-ready text-to-image generation platform powered by custom fine-tuned Stable Diffusion models.
              </p>
              <p>
                Built with React, FastAPI, and Diffusers for blazing-fast performance and stunning results.
              </p>
            </div>
          </div>

          {}
          <div className={`mt-6 pt-4 border-t text-xs ${
            isDark ? 'text-gray-500 border-gray-800' : 'text-gray-400 border-gray-200'
          }`}>
            <p>Version 1.0.0</p>
            <p>© 2024 LexiGraph. Open Source.</p>
          </div>
        </div>
            </GlassCard>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default SettingsPanel;
