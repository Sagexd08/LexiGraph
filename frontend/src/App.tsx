/**
 * Main App Component
 *
 * Root component that sets up the application structure,
 * theme management, and global providers.
 */

import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

import ImageGenerator from './components/ImageGenerator';
import { useLocalStorage } from './hooks/useLocalStorage';

type Theme = 'light' | 'dark' | 'system';

const App: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'system');
  const [isDark, setIsDark] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Main Application */}
      <ImageGenerator />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: isDark ? '#374151' : '#ffffff',
            color: isDark ? '#f9fafb' : '#111827',
            border: isDark ? '1px solid #4b5563' : '1px solid #e5e7eb',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </div>
  );
};

export default App;
