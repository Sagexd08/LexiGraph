

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Paintbrush,
  Eye,
  RotateCcw,
  Download,
  Upload,
  Check
} from 'lucide-react';
import { Button, Card, Modal, Tooltip } from './ui';

interface ColorScheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
}

interface ThemeConfig {
  colorScheme: string;
  mode: 'light' | 'dark' | 'auto';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  spacing: 'compact' | 'normal' | 'comfortable';
  animations: boolean;
  glassMorphism: boolean;
}

const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'default',
    name: 'Default',
    primary: '#4F46E5',
    secondary: '#7C3AED',
    accent: '#06B6D4',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#1F2937'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    primary: '#0EA5E9',
    secondary: '#0284C7',
    accent: '#06B6D4',
    background: '#F0F9FF',
    surface: '#E0F2FE',
    text: '#0C4A6E'
  },
  {
    id: 'forest',
    name: 'Forest',
    primary: '#059669',
    secondary: '#047857',
    accent: '#10B981',
    background: '#F0FDF4',
    surface: '#DCFCE7',
    text: '#064E3B'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    primary: '#EA580C',
    secondary: '#DC2626',
    accent: '#F59E0B',
    background: '#FFF7ED',
    surface: '#FFEDD5',
    text: '#9A3412'
  },
  {
    id: 'purple',
    name: 'Purple',
    primary: '#7C3AED',
    secondary: '#6D28D9',
    accent: '#A855F7',
    background: '#FAF5FF',
    surface: '#F3E8FF',
    text: '#581C87'
  },
  {
    id: 'rose',
    name: 'Rose',
    primary: '#E11D48',
    secondary: '#BE185D',
    accent: '#F43F5E',
    background: '#FFF1F2',
    surface: '#FFE4E6',
    text: '#881337'
  }
];

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeConfig;
  onThemeChange: (theme: ThemeConfig) => void;
}

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange
}) => {
  const [previewTheme, setPreviewTheme] = useState<ThemeConfig>(currentTheme);
  const [customColors, setCustomColors] = useState<Partial<ColorScheme>>({});
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  useEffect(() => {
    setPreviewTheme(currentTheme);
  }, [currentTheme]);

  const handlePreviewChange = (updates: Partial<ThemeConfig>) => {
    setPreviewTheme(prev => ({ ...prev, ...updates }));
  };

  const applyTheme = () => {
    onThemeChange(previewTheme);
    onClose();
  };

  const resetToDefault = () => {
    const defaultTheme: ThemeConfig = {
      colorScheme: 'default',
      mode: 'auto',
      borderRadius: 'medium',
      spacing: 'normal',
      animations: true,
      glassMorphism: false
    };
    setPreviewTheme(defaultTheme);
  };

  const exportTheme = () => {
    const themeData = JSON.stringify(previewTheme, null, 2);
    const blob = new Blob([themeData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lexigraph-theme.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const themeData = JSON.parse(e.target?.result as string);
          setPreviewTheme(themeData);
        } catch (error) {
          console.error('Failed to import theme:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const createCustomScheme = () => {
    if (customColors.name && customColors.primary) {
      const newScheme: ColorScheme = {
        id: `custom-${Date.now()}`,
        name: customColors.name,
        primary: customColors.primary || '#4F46E5',
        secondary: customColors.secondary || '#7C3AED',
        accent: customColors.accent || '#06B6D4',
        background: customColors.background || '#FFFFFF',
        surface: customColors.surface || '#F8FAFC',
        text: customColors.text || '#1F2937'
      };


      COLOR_SCHEMES.push(newScheme);
      setPreviewTheme(prev => ({ ...prev, colorScheme: newScheme.id }));
      setIsCreatingCustom(false);
      setCustomColors({});
    }
  };

  const selectedScheme = COLOR_SCHEMES.find(s => s.id === previewTheme.colorScheme) || COLOR_SCHEMES[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Theme Customizer"
      size="xl"
    >
      <div className="space-y-6">
        {}
        <Card
          className="p-6"
          style={{
            backgroundColor: selectedScheme.background,
            color: selectedScheme.text,
            borderRadius: previewTheme.borderRadius === 'none' ? '0' :
                          previewTheme.borderRadius === 'small' ? '4px' :
                          previewTheme.borderRadius === 'medium' ? '8px' : '16px'
          }}
        >
          <h3 className="text-lg font-semibold mb-4">Theme Preview</h3>
          <div className="grid grid-cols-3 gap-4">
            <div
              className="p-4 rounded"
              style={{ backgroundColor: selectedScheme.primary, color: 'white' }}
            >
              Primary
            </div>
            <div
              className="p-4 rounded"
              style={{ backgroundColor: selectedScheme.secondary, color: 'white' }}
            >
              Secondary
            </div>
            <div
              className="p-4 rounded"
              style={{ backgroundColor: selectedScheme.accent, color: 'white' }}
            >
              Accent
            </div>
          </div>
        </Card>

        {}
        <div>
          <h4 className="font-semibold mb-3">Color Schemes</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {COLOR_SCHEMES.map(scheme => (
              <button
                key={scheme.id}
                onClick={() => handlePreviewChange({ colorScheme: scheme.id })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  previewTheme.colorScheme === scheme.id
                    ? 'border-indigo-500 ring-2 ring-indigo-200'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex space-x-1 mb-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: scheme.primary }}
                  />
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: scheme.secondary }}
                  />
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: scheme.accent }}
                  />
                </div>
                <div className="text-sm font-medium">{scheme.name}</div>
              </button>
            ))}

            <button
              onClick={() => setIsCreatingCustom(true)}
              className="p-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 transition-colors flex flex-col items-center justify-center"
            >
              <Paintbrush className="h-6 w-6 text-gray-400 mb-1" />
              <span className="text-sm">Custom</span>
            </button>
          </div>
        </div>

        {}
        <div>
          <h4 className="font-semibold mb-3">Theme Mode</h4>
          <div className="flex space-x-2">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'auto', label: 'Auto', icon: Monitor }
            ].map(mode => (
              <Button
                key={mode.id}
                variant={previewTheme.mode === mode.id ? 'primary' : 'outline'}
                onClick={() => handlePreviewChange({ mode: mode.id as any })}
                icon={<mode.icon className="h-4 w-4" />}
              >
                {mode.label}
              </Button>
            ))}
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3">Border Radius</h4>
            <select
              value={previewTheme.borderRadius}
              onChange={(e) => handlePreviewChange({ borderRadius: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
            >
              <option value="none">None</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Spacing</h4>
            <select
              value={previewTheme.spacing}
              onChange={(e) => handlePreviewChange({ spacing: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
            >
              <option value="compact">Compact</option>
              <option value="normal">Normal</option>
              <option value="comfortable">Comfortable</option>
            </select>
          </div>
        </div>

        {}
        <div>
          <h4 className="font-semibold mb-3">Advanced Options</h4>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={previewTheme.animations}
                onChange={(e) => handlePreviewChange({ animations: e.target.checked })}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Enable animations</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={previewTheme.glassMorphism}
                onChange={(e) => handlePreviewChange({ glassMorphism: e.target.checked })}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Glass morphism effects</span>
            </label>
          </div>
        </div>

        {}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={applyTheme}
            icon={<Check className="h-4 w-4" />}
          >
            Apply Theme
          </Button>

          <Button
            variant="outline"
            onClick={resetToDefault}
            icon={<RotateCcw className="h-4 w-4" />}
          >
            Reset
          </Button>

          <Button
            variant="outline"
            onClick={exportTheme}
            icon={<Download className="h-4 w-4" />}
          >
            Export
          </Button>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={importTheme}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button
              variant="outline"
              icon={<Upload className="h-4 w-4" />}
            >
              Import
            </Button>
          </div>
        </div>
      </div>

      {}
      <Modal
        isOpen={isCreatingCustom}
        onClose={() => setIsCreatingCustom(false)}
        title="Create Custom Color Scheme"
        size="md"
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Scheme name"
            value={customColors.name || ''}
            onChange={(e) => setCustomColors(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
          />

          {[
            { key: 'primary', label: 'Primary Color' },
            { key: 'secondary', label: 'Secondary Color' },
            { key: 'accent', label: 'Accent Color' }
          ].map(color => (
            <div key={color.key} className="flex items-center space-x-3">
              <label className="w-24 text-sm">{color.label}</label>
              <input
                type="color"
                value={customColors[color.key as keyof ColorScheme] || '#4F46E5'}
                onChange={(e) => setCustomColors(prev => ({ ...prev, [color.key]: e.target.value }))}
                className="w-12 h-8 rounded border border-gray-300"
              />
              <input
                type="text"
                value={customColors[color.key as keyof ColorScheme] || ''}
                onChange={(e) => setCustomColors(prev => ({ ...prev, [color.key]: e.target.value }))}
                className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-sm"
                placeholder="#4F46E5"
              />
            </div>
          ))}

          <div className="flex gap-2 pt-4">
            <Button onClick={createCustomScheme}>Create Scheme</Button>
            <Button variant="outline" onClick={() => setIsCreatingCustom(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};

export default ThemeCustomizer;
