import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { SunIcon, MoonIcon, Cog6ToothIcon, SparklesIcon } from '@heroicons/react/24/outline';

import EnhancedImageGenerator from './components/EnhancedImageGenerator';
import SettingsPanel from './components/SettingsPanel';
import { useLocalStorage } from './hooks/useLocalStorage';

type Theme = 'light' | 'dark' | 'system';

const App: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'system');
  const [isDark, setIsDark] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle theme changes
  useEffect(() => {
    const updateTheme = () => {
      if (theme === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(systemDark);
      } else {
        setIsDark(theme === 'dark');
      }
    };

    updateTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Simulate app initialization
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-6"
          >
            <SparklesIcon className="w-full h-full text-purple-400" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl font-bold text-white mb-4"
          >
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              LexiGraph
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-gray-300 text-lg"
          >
            Initializing AI Engine...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900'
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 relative"
        >
          {/* Theme Toggle */}
          <div className="absolute top-0 right-0 flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`p-3 rounded-xl transition-all duration-200 ${
                isDark
                  ? 'bg-gray-800/50 text-yellow-400 hover:bg-gray-700/50 border border-gray-700'
                  : 'bg-white/80 text-gray-600 hover:bg-white border border-gray-200'
              } backdrop-blur-sm shadow-lg`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(true)}
              className={`p-3 rounded-xl transition-all duration-200 ${
                isDark
                  ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                  : 'bg-white/80 text-gray-600 hover:bg-white border border-gray-200'
              } backdrop-blur-sm shadow-lg`}
              title="Settings"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </motion.button>
          </div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              LexiGraph
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className={`text-xl md:text-2xl max-w-3xl mx-auto mb-6 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            Transform your imagination into stunning visuals with our custom fine-tuned AI model
          </motion.p>

          {/* Feature badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {['Custom LoRA Model', 'Real-time Progress', 'Style Presets', 'Generation History', 'Smart Caching'].map((feature, index) => (
              <motion.span
                key={feature}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-purple-900/30 text-purple-300 border border-purple-700/50 hover:bg-purple-800/40'
                    : 'bg-purple-100/80 text-purple-700 border border-purple-200 hover:bg-purple-200/80'
                } backdrop-blur-sm`}
              >
                {feature}
              </motion.span>
            ))}
          </motion.div>
        </motion.header>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <EnhancedImageGenerator />
        </motion.div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            theme={theme}
            setTheme={setTheme}
            isDark={isDark}
          />
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: isDark ? '#1f2937' : '#ffffff',
            color: isDark ? '#f3f4f6' : '#1f2937',
            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: isDark
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)'
              : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: isDark ? '#1f2937' : '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: isDark ? '#1f2937' : '#ffffff',
            },
          },
        }}
      />
    </div>
  );
};

export default App;
