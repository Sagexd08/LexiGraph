/**
 * Advanced Controls Component
 * Professional-grade generation controls with advanced features
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Sliders,
  Layers,
  Palette,
  Zap,
  Target,
  Microscope,
  Atom,
  Cpu,
  Brain,
  Workflow,
  Gauge,
  RotateCcw,
  Save,
  Upload,
  Download,
  Copy,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { GlassCard, AdvancedButton } from '../../design-system';
import { cn } from '../../lib/utils';

interface AdvancedControlsProps {
  params: any;
  onChange: (params: any) => void;
  onPresetLoad: (preset: any) => void;
  className?: string;
}

interface ControlSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  locked: boolean;
}

interface AdvancedParameter {
  id: string;
  label: string;
  type: 'slider' | 'select' | 'toggle' | 'input' | 'color';
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: any; label: string }>;
  description: string;
  advanced?: boolean;
  warning?: string;
}

export const AdvancedControls: React.FC<AdvancedControlsProps> = ({
  params,
  onChange,
  onPresetLoad,
  className
}) => {
  const [sections, setSections] = useState<ControlSection[]>([
    { id: 'generation', title: 'Generation', icon: <Zap className="h-4 w-4" />, expanded: true, locked: false },
    { id: 'sampling', title: 'Sampling', icon: <Target className="h-4 w-4" />, expanded: false, locked: false },
    { id: 'conditioning', title: 'Conditioning', icon: <Brain className="h-4 w-4" />, expanded: false, locked: false },
    { id: 'postprocessing', title: 'Post-Processing', icon: <Layers className="h-4 w-4" />, expanded: false, locked: false },
    { id: 'advanced', title: 'Advanced', icon: <Microscope className="h-4 w-4" />, expanded: false, locked: true }
  ]);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [presets, setPresets] = useState([]);
  const [currentPreset, setCurrentPreset] = useState('custom');

  const advancedParameters: Record<string, AdvancedParameter[]> = {
    generation: [
      {
        id: 'steps',
        label: 'Sampling Steps',
        type: 'slider',
        value: params.steps || 20,
        min: 1,
        max: 150,
        step: 1,
        description: 'Number of denoising steps. More steps = higher quality but slower generation.'
      },
      {
        id: 'cfg_scale',
        label: 'CFG Scale',
        type: 'slider',
        value: params.cfg_scale || 7.5,
        min: 1,
        max: 30,
        step: 0.1,
        description: 'How closely to follow the prompt. Higher values = more prompt adherence.'
      },
      {
        id: 'width',
        label: 'Width',
        type: 'select',
        value: params.width || 512,
        options: [
          { value: 512, label: '512px' },
          { value: 768, label: '768px' },
          { value: 1024, label: '1024px' },
          { value: 1536, label: '1536px' }
        ],
        description: 'Output image width in pixels.'
      },
      {
        id: 'height',
        label: 'Height',
        type: 'select',
        value: params.height || 512,
        options: [
          { value: 512, label: '512px' },
          { value: 768, label: '768px' },
          { value: 1024, label: '1024px' },
          { value: 1536, label: '1536px' }
        ],
        description: 'Output image height in pixels.'
      }
    ],
    sampling: [
      {
        id: 'sampler',
        label: 'Sampler',
        type: 'select',
        value: params.sampler || 'DPM++ 2M Karras',
        options: [
          { value: 'Euler', label: 'Euler' },
          { value: 'Euler a', label: 'Euler Ancestral' },
          { value: 'DPM++ 2M', label: 'DPM++ 2M' },
          { value: 'DPM++ 2M Karras', label: 'DPM++ 2M Karras' },
          { value: 'DPM++ SDE Karras', label: 'DPM++ SDE Karras' },
          { value: 'DDIM', label: 'DDIM' }
        ],
        description: 'Sampling algorithm. Different samplers produce different results.'
      },
      {
        id: 'eta',
        label: 'Eta (η)',
        type: 'slider',
        value: params.eta || 0.0,
        min: 0,
        max: 1,
        step: 0.01,
        description: 'Stochasticity parameter. 0 = deterministic, 1 = maximum randomness.',
        advanced: true
      },
      {
        id: 'sigma_min',
        label: 'Sigma Min',
        type: 'slider',
        value: params.sigma_min || 0.0292,
        min: 0.001,
        max: 0.1,
        step: 0.001,
        description: 'Minimum noise level for sampling.',
        advanced: true,
        warning: 'Changing this may affect generation quality'
      }
    ],
    conditioning: [
      {
        id: 'clip_skip',
        label: 'CLIP Skip',
        type: 'slider',
        value: params.clip_skip || 1,
        min: 1,
        max: 12,
        step: 1,
        description: 'Skip layers in CLIP text encoder. Higher values = more artistic interpretation.'
      },
      {
        id: 'prompt_strength',
        label: 'Prompt Strength',
        type: 'slider',
        value: params.prompt_strength || 1.0,
        min: 0.1,
        max: 2.0,
        step: 0.1,
        description: 'Overall strength of prompt conditioning.'
      },
      {
        id: 'negative_prompt_strength',
        label: 'Negative Prompt Strength',
        type: 'slider',
        value: params.negative_prompt_strength || 1.0,
        min: 0.1,
        max: 2.0,
        step: 0.1,
        description: 'Strength of negative prompt conditioning.'
      }
    ],
    postprocessing: [
      {
        id: 'upscale',
        label: 'Upscale',
        type: 'toggle',
        value: params.upscale || false,
        description: 'Apply AI upscaling to the generated image.'
      },
      {
        id: 'face_restoration',
        label: 'Face Restoration',
        type: 'toggle',
        value: params.face_restoration || false,
        description: 'Enhance faces in the generated image.'
      },
      {
        id: 'color_correction',
        label: 'Color Correction',
        type: 'toggle',
        value: params.color_correction || false,
        description: 'Apply automatic color correction.'
      }
    ],
    advanced: [
      {
        id: 'vae',
        label: 'VAE',
        type: 'select',
        value: params.vae || 'auto',
        options: [
          { value: 'auto', label: 'Auto' },
          { value: 'vae-ft-mse-840000-ema-pruned', label: 'MSE VAE' },
          { value: 'vae-ft-ema-560000-ema-pruned', label: 'EMA VAE' }
        ],
        description: 'Variational Autoencoder for image encoding/decoding.',
        advanced: true
      },
      {
        id: 'tiling',
        label: 'Tiling',
        type: 'toggle',
        value: params.tiling || false,
        description: 'Generate tileable/seamless images.',
        advanced: true
      },
      {
        id: 'karras_sigmas',
        label: 'Karras Sigmas',
        type: 'toggle',
        value: params.karras_sigmas || true,
        description: 'Use Karras noise schedule for better quality.',
        advanced: true
      }
    ]
  };

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, expanded: !section.expanded }
        : section
    ));
  };

  const toggleSectionLock = (sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, locked: !section.locked }
        : section
    ));
  };

  const updateParameter = (parameterId: string, value: any) => {
    onChange({ ...params, [parameterId]: value });
  };

  const resetToDefaults = () => {
    onChange({
      steps: 20,
      cfg_scale: 7.5,
      width: 512,
      height: 512,
      sampler: 'DPM++ 2M Karras',
      eta: 0.0,
      clip_skip: 1,
      prompt_strength: 1.0,
      negative_prompt_strength: 1.0,
      upscale: false,
      face_restoration: false,
      color_correction: false,
      vae: 'auto',
      tiling: false,
      karras_sigmas: true
    });
  };

  const renderParameter = (param: AdvancedParameter) => {
    if (param.advanced && !showAdvanced) return null;

    return (
      <motion.div
        key={param.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-neutral-300">
              {param.label}
            </label>
            {param.warning && (
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            )}
            {param.advanced && (
              <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                Advanced
              </span>
            )}
          </div>
          <div className="text-sm text-neutral-400">
            {typeof param.value === 'boolean' ? (param.value ? 'On' : 'Off') : param.value}
          </div>
        </div>

        {param.type === 'slider' && (
          <div className="space-y-1">
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step}
              value={param.value}
              onChange={(e) => updateParameter(param.id, parseFloat(e.target.value))}
              className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-neutral-500">
              <span>{param.min}</span>
              <span>{param.max}</span>
            </div>
          </div>
        )}

        {param.type === 'select' && (
          <select
            value={param.value}
            onChange={(e) => updateParameter(param.id, e.target.value)}
            className="w-full bg-neutral-800/50 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {param.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {param.type === 'toggle' && (
          <button
            onClick={() => updateParameter(param.id, !param.value)}
            className={cn(
              'w-full p-3 rounded-lg border transition-colors',
              param.value
                ? 'bg-primary-500/20 border-primary-500/50 text-primary-300'
                : 'bg-neutral-800/50 border-white/20 text-neutral-400'
            )}
          >
            <div className="flex items-center justify-center gap-2">
              {param.value ? <CheckCircle className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {param.value ? 'Enabled' : 'Disabled'}
            </div>
          </button>
        )}

        <p className="text-xs text-neutral-500">{param.description}</p>
        {param.warning && (
          <p className="text-xs text-yellow-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {param.warning}
          </p>
        )}
      </motion.div>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      <GlassCard className="p-6" variant="elevated">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-white">Advanced Controls</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <AdvancedButton
              onClick={() => setShowAdvanced(!showAdvanced)}
              variant="ghost"
              size="sm"
              icon={showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            >
              {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
            </AdvancedButton>
            
            <AdvancedButton
              onClick={resetToDefaults}
              variant="ghost"
              size="sm"
              icon={<RotateCcw className="h-4 w-4" />}
            >
              Reset
            </AdvancedButton>
          </div>
        </div>

        {/* Control Sections */}
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="border border-white/10 rounded-lg overflow-hidden">
              <div className="w-full flex items-center justify-between p-4 bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center gap-3 flex-1"
                >
                  {section.icon}
                  <span className="font-medium text-white">{section.title}</span>
                  {section.locked && <Lock className="h-4 w-4 text-yellow-400" />}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionLock(section.id);
                    }}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    {section.locked ? (
                      <Lock className="h-4 w-4 text-yellow-400" />
                    ) : (
                      <Unlock className="h-4 w-4 text-neutral-400" />
                    )}
                  </button>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    {section.expanded ? (
                      <ChevronUp className="h-4 w-4 text-neutral-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-neutral-400" />
                    )}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {section.expanded && !section.locked && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-4 bg-neutral-900/20">
                      {advancedParameters[section.id]?.map(renderParameter)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {section.locked && (
                <div className="p-4 bg-neutral-900/20 text-center">
                  <Lock className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
                  <p className="text-sm text-neutral-400">
                    This section is locked. Click the lock icon to unlock.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Preset Management */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <h4 className="text-sm font-medium text-neutral-300 mb-3">Presets</h4>
          <div className="flex gap-2">
            <AdvancedButton
              variant="ghost"
              size="sm"
              icon={<Save className="h-4 w-4" />}
            >
              Save Preset
            </AdvancedButton>
            <AdvancedButton
              variant="ghost"
              size="sm"
              icon={<Upload className="h-4 w-4" />}
            >
              Load Preset
            </AdvancedButton>
            <AdvancedButton
              variant="ghost"
              size="sm"
              icon={<Download className="h-4 w-4" />}
            >
              Export Settings
            </AdvancedButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
