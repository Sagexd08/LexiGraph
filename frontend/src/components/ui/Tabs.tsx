import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

// Design tokens for consistent spacing and styling
const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
} as const;

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

// Main Tabs component
interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const Tabs: React.FC<TabsProps> = ({
  value,
  onValueChange,
  children,
  className,
  orientation = 'horizontal',
}) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div
        className={cn(
          'w-full',
          orientation === 'vertical' && 'flex gap-6',
          className
        )}
        role="tablist"
        aria-orientation={orientation}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// TabsList component
interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        // Base styles
        'inline-flex items-center justify-center',
        'rounded-xl p-1',
        // Glass morphism effect
        'bg-white/80 dark:bg-gray-800/80',
        'backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50',
        // Shadows
        'shadow-lg shadow-gray-900/5 dark:shadow-gray-900/20',
        // Responsive
        'w-full sm:w-auto',
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
};

// TabsTrigger component
interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  className,
  disabled = false,
}) => {
  const { value: selectedValue, onValueChange } = useTabsContext();
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      aria-controls={`tabpanel-${value}`}
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      onClick={() => !disabled && onValueChange(value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          !disabled && onValueChange(value);
        }
      }}
      className={cn(
        // Base styles
        'relative inline-flex items-center justify-center',
        'px-4 py-2.5 text-sm font-medium',
        'rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/20',
        'whitespace-nowrap',
        // States
        isSelected
          ? [
              // Selected state
              'text-blue-700 dark:text-blue-300',
              'bg-white dark:bg-gray-700',
              'shadow-sm shadow-gray-900/10 dark:shadow-gray-900/20',
              'border border-gray-200/50 dark:border-gray-600/50',
            ]
          : [
              // Unselected state
              'text-gray-600 dark:text-gray-400',
              'hover:text-gray-900 dark:hover:text-gray-200',
              'hover:bg-gray-50/50 dark:hover:bg-gray-700/50',
            ],
        // Disabled state
        disabled && [
          'opacity-50 cursor-not-allowed',
          'hover:text-gray-600 dark:hover:text-gray-400',
          'hover:bg-transparent',
        ],
        className
      )}
    >
      {/* Background animation */}
      {isSelected && (
        <motion.div
          layoutId="tab-background"
          className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
          initial={false}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        />
      )}
      
      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </button>
  );
};

// TabsContent component
interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
  forceMount?: boolean;
}

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  children,
  className,
  forceMount = false,
}) => {
  const { value: selectedValue } = useTabsContext();
  const isSelected = selectedValue === value;

  if (!isSelected && !forceMount) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {isSelected && (
        <motion.div
          key={value}
          role="tabpanel"
          id={`tabpanel-${value}`}
          aria-labelledby={`tab-${value}`}
          tabIndex={0}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{
            duration: 0.2,
            ease: 'easeInOut',
          }}
          className={cn(
            'mt-6 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg',
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Controlled Tabs hook for advanced usage
export const useTabs = (defaultValue: string) => {
  const [value, setValue] = useState(defaultValue);
  
  return {
    value,
    onValueChange: setValue,
  };
};

// Export types
export type {
  TabsProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
};

// Default export for convenience
export default Tabs;
