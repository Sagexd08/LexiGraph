/**
 * Keyboard Shortcuts Component
 * 
 * Display and manage keyboard shortcuts for the application
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Command } from 'lucide-react';
import { Button, Modal, Card } from './ui';

interface Shortcut {
  key: string;
  description: string;
  category: 'generation' | 'navigation' | 'editing' | 'general';
}

const SHORTCUTS: Shortcut[] = [
  // Generation
  { key: 'Ctrl+Enter', description: 'Generate image', category: 'generation' },
  { key: 'Ctrl+R', description: 'Random seed', category: 'generation' },
  { key: 'Ctrl+D', description: 'Download image', category: 'generation' },
  { key: 'Ctrl+C', description: 'Copy image', category: 'generation' },
  
  // Navigation
  { key: 'Ctrl+H', description: 'Toggle history panel', category: 'navigation' },
  { key: 'Ctrl+S', description: 'Toggle settings', category: 'navigation' },
  { key: 'Ctrl+B', description: 'Open batch generator', category: 'navigation' },
  { key: 'Tab', description: 'Navigate between tabs', category: 'navigation' },
  
  // Editing
  { key: 'Ctrl+Z', description: 'Undo last change', category: 'editing' },
  { key: 'Ctrl+Y', description: 'Redo last change', category: 'editing' },
  { key: 'Ctrl+A', description: 'Select all text', category: 'editing' },
  { key: 'Escape', description: 'Clear selection/close modal', category: 'editing' },
  
  // General
  { key: 'Ctrl+/', description: 'Show keyboard shortcuts', category: 'general' },
  { key: 'Ctrl+T', description: 'Toggle theme', category: 'general' },
  { key: 'F11', description: 'Toggle fullscreen', category: 'general' },
];

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(SHORTCUTS.map(s => s.category)))];

  const filteredShortcuts = SHORTCUTS.filter(shortcut => {
    const matchesSearch = shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shortcut.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || shortcut.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  const formatKey = (key: string) => {
    return key.split('+').map((part, index, array) => (
      <React.Fragment key={part}>
        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">
          {part === 'Ctrl' ? (navigator.platform.includes('Mac') ? '⌘' : 'Ctrl') : part}
        </kbd>
        {index < array.length - 1 && <span className="mx-1 text-gray-400">+</span>}
      </React.Fragment>
    ));
  };

  const categoryColors = {
    generation: 'text-blue-600 dark:text-blue-400',
    navigation: 'text-green-600 dark:text-green-400',
    editing: 'text-purple-600 dark:text-purple-400',
    general: 'text-orange-600 dark:text-orange-400'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="lg"
    >
      <div className="space-y-6">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className={`text-lg font-semibold mb-3 capitalize ${categoryColors[category as keyof typeof categoryColors]}`}>
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <motion.div
                    key={`${category}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="text-gray-900 dark:text-white">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center space-x-1">
                      {formatKey(shortcut.key)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredShortcuts.length === 0 && (
          <div className="text-center py-8">
            <Keyboard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No shortcuts found matching your search.
            </p>
          </div>
        )}

        {/* Tips */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <Command className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Pro Tips
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Hold Shift while using shortcuts for additional actions</li>
                <li>• Most shortcuts work globally throughout the application</li>
                <li>• Press Ctrl+/ anytime to open this shortcuts panel</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </Modal>
  );
};

// Hook for managing keyboard shortcuts
export const useKeyboardShortcuts = () => {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return {
    isShortcutsOpen,
    setIsShortcutsOpen,
    openShortcuts: () => setIsShortcutsOpen(true),
    closeShortcuts: () => setIsShortcutsOpen(false)
  };
};

export default KeyboardShortcuts;
