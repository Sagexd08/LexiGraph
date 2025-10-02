/**
 * Keyboard Shortcuts Component
 * Overlay showing all available keyboard shortcuts
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Command, 
  Search, 
  Plus, 
  Save, 
  Download, 
  Copy, 
  Undo, 
  Redo,
  HelpCircle,
  X,
  Keyboard,
} from 'lucide-react';
import { GlassCard, AdvancedButton } from '../../design-system';
import { cn } from '../../utils/cn';

interface Shortcut {
  category: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
    icon?: React.ComponentType<any>;
  }>;
}

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts: Shortcut[] = [
  {
    category: 'General',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Quick search', icon: Search },
      { keys: ['⌘', '?'], description: 'Show keyboard shortcuts', icon: HelpCircle },
      { keys: ['Esc'], description: 'Close modal/overlay' },
      { keys: ['⌘', ','], description: 'Open settings' },
    ],
  },
  {
    category: 'Generation',
    shortcuts: [
      { keys: ['⌘', 'N'], description: 'New generation', icon: Plus },
      { keys: ['⌘', 'Enter'], description: 'Start generation' },
      { keys: ['⌘', 'R'], description: 'Regenerate with same settings' },
      { keys: ['Space'], description: 'Quick preview' },
    ],
  },
  {
    category: 'File Operations',
    shortcuts: [
      { keys: ['⌘', 'S'], description: 'Save current work', icon: Save },
      { keys: ['⌘', 'D'], description: 'Download image', icon: Download },
      { keys: ['⌘', 'C'], description: 'Copy image', icon: Copy },
      { keys: ['⌘', 'Shift', 'S'], description: 'Save as template' },
    ],
  },
  {
    category: 'Editing',
    shortcuts: [
      { keys: ['⌘', 'Z'], description: 'Undo', icon: Undo },
      { keys: ['⌘', 'Shift', 'Z'], description: 'Redo', icon: Redo },
      { keys: ['⌘', 'A'], description: 'Select all' },
      { keys: ['Delete'], description: 'Delete selected' },
    ],
  },
  {
    category: 'Navigation',
    shortcuts: [
      { keys: ['⌘', '1'], description: 'Go to Generate' },
      { keys: ['⌘', '2'], description: 'Go to Batch' },
      { keys: ['⌘', '3'], description: 'Go to Gallery' },
      { keys: ['⌘', '4'], description: 'Go to Templates' },
      { keys: ['Tab'], description: 'Next input field' },
      { keys: ['Shift', 'Tab'], description: 'Previous input field' },
    ],
  },
  {
    category: 'View',
    shortcuts: [
      { keys: ['⌘', '+'], description: 'Zoom in' },
      { keys: ['⌘', '-'], description: 'Zoom out' },
      { keys: ['⌘', '0'], description: 'Reset zoom' },
      { keys: ['F'], description: 'Toggle fullscreen' },
      { keys: ['⌘', 'B'], description: 'Toggle sidebar' },
    ],
  },
];

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredShortcuts, setFilteredShortcuts] = useState(shortcuts);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Filter shortcuts based on search
  useEffect(() => {
    if (!searchQuery) {
      setFilteredShortcuts(shortcuts);
      return;
    }

    const filtered = shortcuts.map(category => ({
      ...category,
      shortcuts: category.shortcuts.filter(shortcut =>
        shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shortcut.keys.some(key => key.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    })).filter(category => category.shortcuts.length > 0);

    setFilteredShortcuts(filtered);
  }, [searchQuery]);

  const renderKey = (key: string) => (
    <kbd
      key={key}
      className={cn(
        'inline-flex items-center justify-center',
        'min-w-[2rem] h-8 px-2 py-1',
        'bg-neutral-700 dark:bg-neutral-800',
        'text-neutral-300 dark:text-neutral-400',
        'text-sm font-medium',
        'border border-neutral-600 dark:border-neutral-700',
        'rounded-lg shadow-sm'
      )}
    >
      {key}
    </kbd>
  );

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <GlassCard variant="elevated" className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl">
                <Keyboard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
                <p className="text-neutral-400">Master LexiGraph with these shortcuts</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="h-6 w-6 text-neutral-400" />
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search shortcuts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full pl-10 pr-4 py-3',
                  'bg-white/10 border border-white/20 rounded-xl',
                  'text-white placeholder-neutral-400',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
                  'transition-all duration-200'
                )}
              />
            </div>
          </div>

          {/* Shortcuts Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence>
                {filteredShortcuts.map((category, categoryIndex) => (
                  <motion.div
                    key={category.category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: categoryIndex * 0.1 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
                      {category.category}
                    </h3>

                    <div className="space-y-3">
                      {category.shortcuts.map((shortcut, shortcutIndex) => {
                        const Icon = shortcut.icon;
                        
                        return (
                          <motion.div
                            key={shortcutIndex}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: (categoryIndex * 0.1) + (shortcutIndex * 0.05) }}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              {Icon && (
                                <Icon className="h-4 w-4 text-primary-400" />
                              )}
                              <span className="text-neutral-300">{shortcut.description}</span>
                            </div>

                            <div className="flex items-center space-x-1">
                              {shortcut.keys.map((key, keyIndex) => (
                                <React.Fragment key={keyIndex}>
                                  {keyIndex > 0 && (
                                    <span className="text-neutral-500 mx-1">+</span>
                                  )}
                                  {renderKey(key)}
                                </React.Fragment>
                              ))}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredShortcuts.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-400 mb-2">No shortcuts found</h3>
                <p className="text-neutral-500">Try searching for something else</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400">
                Press <kbd className="px-2 py-1 bg-neutral-700 rounded text-xs">Esc</kbd> to close
              </p>
              
              <AdvancedButton
                variant="primary"
                onClick={onClose}
              >
                Got it!
              </AdvancedButton>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

export default KeyboardShortcuts;
