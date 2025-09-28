/**
 * Enhanced Tooltip Component
 * 
 * Modern tooltip with multiple positions and animations
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 500,
  disabled = false,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (disabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const positions = {
    top: {
      tooltip: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      arrow: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900'
    },
    bottom: {
      tooltip: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      arrow: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900'
    },
    left: {
      tooltip: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      arrow: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900'
    },
    right: {
      tooltip: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
      arrow: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900'
    }
  };

  const tooltipClasses = clsx(
    'absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg',
    'max-w-xs break-words',
    positions[position].tooltip,
    className
  );

  const arrowClasses = clsx(
    'absolute w-0 h-0 border-4',
    positions[position].arrow
  );

  const animations = {
    top: { y: 10, opacity: 0 },
    bottom: { y: -10, opacity: 0 },
    left: { x: 10, opacity: 0 },
    right: { x: -10, opacity: 0 }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            initial={animations[position]}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={animations[position]}
            transition={{ duration: 0.2 }}
            className={tooltipClasses}
          >
            {content}
            <div className={arrowClasses} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
