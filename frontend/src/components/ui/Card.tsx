/**
 * Enhanced Card Component
 * 
 * Modern card component with glass morphism and hover effects
 */

import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  interactive?: boolean;
}

const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  padding = 'md',
  hover = false,
  interactive = false,
  children,
  ...props
}) => {
  const baseClasses = 'rounded-xl transition-all duration-200';
  
  const variants = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm',
    glass: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 shadow-lg',
    elevated: 'bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl border border-gray-100 dark:border-gray-700',
    bordered: 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600'
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const hoverClasses = hover ? 'hover:shadow-lg hover:-translate-y-1' : '';
  const interactiveClasses = interactive ? 'cursor-pointer hover:scale-[1.02]' : '';

  const cardClasses = clsx(
    baseClasses,
    variants[variant],
    paddings[padding],
    hoverClasses,
    interactiveClasses,
    className
  );

  const MotionComponent = interactive ? motion.div : 'div';

  return (
    <MotionComponent
      className={cardClasses}
      whileHover={interactive ? { scale: 1.02 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      {...props}
    >
      {children}
    </MotionComponent>
  );
};

export default Card;
