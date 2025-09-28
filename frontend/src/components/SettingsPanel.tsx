import React from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, ComputerDesktopIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

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
  const themeOptions = [
    { value: 'light', label: 'Light', icon: SunIcon },
    { value: 'dark', label: 'Dark', icon: MoonIcon },
    { value: 'system', label: 'System', icon: ComputerDesktopIcon },
  ] as const;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />
      
      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`fixed top-0 right-0 h-full w-80 z-50 ${
          isDark ? 'bg-gray-900' : 'bg-white'
        } shadow-2xl`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Settings
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark 
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Theme Selection */}
          <div className="mb-6">
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

          {/* About Section */}
          <div className="border-t pt-6">
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

          {/* Version Info */}
          <div className={`mt-6 pt-4 border-t text-xs ${
            isDark ? 'text-gray-500 border-gray-800' : 'text-gray-400 border-gray-200'
          }`}>
            <p>Version 1.0.0</p>
            <p>© 2024 LexiGraph. Open Source.</p>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default SettingsPanel;
