/**
 * Sidebar Navigation Component
 * Modern collapsible sidebar with icons, tooltips, and smooth animations
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Wand2,
  Grid3X3,
  History,
  Settings,
  BarChart3,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Image,
  Palette,
  Layers,
  Users,
  Bookmark,
} from 'lucide-react';
import { GlassCard } from '../../design-system';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeItem: string;
  onItemChange: (item: string) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  section: 'main' | 'tools' | 'settings';
}

const navigationItems: NavigationItem[] = [
  // Main Section
  { id: 'dashboard', label: 'Dashboard', icon: Home, section: 'main' },
  { id: 'generate', label: 'Generate', icon: Wand2, section: 'main' },
  { id: 'batch', label: 'Batch Process', icon: Grid3X3, section: 'main' },
  { id: 'gallery', label: 'Gallery', icon: Image, section: 'main' },
  
  // Tools Section
  { id: 'styles', label: 'Style Manager', icon: Palette, section: 'tools' },
  { id: 'templates', label: 'Templates', icon: Layers, section: 'tools' },
  { id: 'history', label: 'History', icon: History, badge: '12', section: 'tools' },
  { id: 'favorites', label: 'Favorites', icon: Bookmark, section: 'tools' },
  
  // Settings Section
  { id: 'analytics', label: 'Analytics', icon: BarChart3, section: 'settings' },
  { id: 'collaboration', label: 'Collaboration', icon: Users, section: 'settings' },
  { id: 'settings', label: 'Settings', icon: Settings, section: 'settings' },
  { id: 'help', label: 'Help & Support', icon: HelpCircle, section: 'settings' },
];

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle,
  activeItem,
  onItemChange,
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 80 },
  };

  const contentVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 },
  };

  const renderNavigationSection = (section: 'main' | 'tools' | 'settings') => {
    const items = navigationItems.filter(item => item.section === section);
    const sectionTitles = {
      main: 'Main',
      tools: 'Tools',
      settings: 'Settings',
    };

    return (
      <div key={section} className="mb-8">
        {!isCollapsed && (
          <motion.h3
            variants={contentVariants}
            className="px-6 mb-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
          >
            {sectionTitles[section]}
          </motion.h3>
        )}
        
        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            const isHovered = hoveredItem === item.id;

            return (
              <div key={item.id} className="relative">
                <motion.button
                  onClick={() => onItemChange(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    'w-full flex items-center px-4 py-3 mx-2 rounded-xl transition-all duration-200',
                    'hover:bg-white/10 dark:hover:bg-white/5',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
                    isActive && 'bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-primary-600 dark:text-primary-400',
                    !isActive && 'text-neutral-600 dark:text-neutral-400'
                  )}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative">
                    <Icon className={cn(
                      'h-5 w-5 transition-colors duration-200',
                      isActive && 'text-primary-600 dark:text-primary-400'
                    )} />
                    
                    {item.badge && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </div>

                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        variants={contentVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        className="ml-3 flex-1 text-left"
                      >
                        <span className="font-medium">{item.label}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary-500 to-secondary-500 rounded-r-full"
                    />
                  )}
                </motion.button>

                {/* Tooltip for collapsed state */}
                <AnimatePresence>
                  {isCollapsed && isHovered && (
                    <motion.div
                      initial={{ opacity: 0, x: -10, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -10, scale: 0.9 }}
                      className="absolute left-full top-1/2 -translate-y-1/2 ml-4 z-50"
                    >
                      <GlassCard className="px-3 py-2 whitespace-nowrap">
                        <span className="text-sm font-medium text-white">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </GlassCard>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
      </div>
    );
  };

  return (
    <motion.div
      variants={sidebarVariants}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative h-full"
    >
      <div className="relative h-full">
        {/* Enhanced glassmorphism background */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/95 via-neutral-800/95 to-neutral-900/95 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-secondary-500/5" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />

        <div className="relative h-full flex flex-col border-r border-white/10 z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 dark:border-white/5">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                variants={contentVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="flex items-center space-x-3"
              >
                <div className="p-2 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">LexiGraph</h1>
                  <p className="text-xs text-neutral-400">AI Image Studio</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5 text-neutral-400" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-neutral-400" />
            )}
          </motion.button>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-6 overflow-y-auto">
          <motion.div
            variants={contentVariants}
            animate={isCollapsed ? 'collapsed' : 'expanded'}
          >
            {renderNavigationSection('main')}
            {renderNavigationSection('tools')}
            {renderNavigationSection('settings')}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 dark:border-white/5">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                variants={contentVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="text-center"
              >
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Version 2.0.0
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  © 2024 LexiGraph
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
