/**
 * Tab Navigation Component
 * Modern tabbed interface for different generation modes
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Wand2, Grid3X3, Settings2, Zap } from 'lucide-react';
import { GlassCard } from '../../design-system';
import { cn } from '../../utils/cn';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  badge?: string | number;
}

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const tabs: Tab[] = [
  {
    id: 'single',
    label: 'Single Generation',
    icon: Wand2,
    description: 'Generate individual images with full control',
  },
  {
    id: 'batch',
    label: 'Batch Process',
    icon: Grid3X3,
    description: 'Generate multiple images efficiently',
    badge: 'Pro',
  },
  {
    id: 'advanced',
    label: 'Advanced Mode',
    icon: Settings2,
    description: 'Fine-tune every parameter',
  },
  {
    id: 'quick',
    label: 'Quick Generate',
    icon: Zap,
    description: 'Fast generation with presets',
  },
];

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  className,
}) => {
  return (
    <GlassCard 
      variant="elevated" 
      className={cn('p-2', className)}
      hover={false}
    >
      <div className="flex space-x-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative flex-1 flex flex-col items-center p-4 rounded-xl transition-all duration-200',
                'hover:bg-white/10 dark:hover:bg-white/5',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
                isActive && 'bg-gradient-to-br from-primary-500/20 to-secondary-500/20'
              )}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center space-y-2">
                <div className="relative">
                  <Icon 
                    className={cn(
                      'h-6 w-6 transition-colors duration-200',
                      isActive 
                        ? 'text-primary-400 dark:text-primary-300' 
                        : 'text-neutral-400 dark:text-neutral-500'
                    )} 
                  />
                  
                  {tab.badge && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full font-medium"
                    >
                      {tab.badge}
                    </motion.span>
                  )}
                </div>

                <div className="text-center">
                  <h3 className={cn(
                    'text-sm font-medium transition-colors duration-200',
                    isActive 
                      ? 'text-white' 
                      : 'text-neutral-300 dark:text-neutral-400'
                  )}>
                    {tab.label}
                  </h3>
                  
                  <p className={cn(
                    'text-xs mt-1 transition-colors duration-200',
                    isActive 
                      ? 'text-neutral-300 dark:text-neutral-400' 
                      : 'text-neutral-500 dark:text-neutral-600'
                  )}>
                    {tab.description}
                  </p>
                </div>
              </div>

              {/* Hover glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 rounded-xl opacity-0"
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            </motion.button>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="mt-4 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
          initial={{ width: '0%' }}
          animate={{ 
            width: `${((tabs.findIndex(t => t.id === activeTab) + 1) / tabs.length) * 100}%` 
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </GlassCard>
  );
};

export default TabNavigation;
