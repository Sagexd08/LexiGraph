

import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'bordered' | 'gradient' | 'neon' | 'frosted' | 'minimal';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  interactive?: boolean;
  glowEffect?: boolean;
  borderGradient?: boolean;
}

const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  padding = 'md',
  hover = false,
  interactive = false,
  glowEffect = false,
  borderGradient = false,
  children,
  ...props
}) => {
  const baseClasses = 'rounded-2xl transition-all duration-300 transform-gpu relative overflow-hidden';

  const variants = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl',
    glass: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl',
    elevated: 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-xl hover:shadow-2xl border border-gray-200 dark:border-gray-700',
    bordered: 'bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-400 shadow-lg hover:shadow-xl',
    gradient: 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-xl hover:shadow-2xl border border-white/20',
    neon: 'bg-gray-900 border border-cyan-400 shadow-lg shadow-cyan-400/50 hover:shadow-cyan-400/80 hover:shadow-xl',
    frosted: 'bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 shadow-2xl',
    minimal: 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md'
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-10',
    xl: 'p-12'
  };

  const hoverClasses = hover ? 'hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02]' : '';
  const interactiveClasses = interactive ? 'cursor-pointer hover:scale-[1.03] active:scale-[0.98]' : '';
  const glowClasses = glowEffect ? 'shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40' : '';

  const cardClasses = clsx(
    baseClasses,
    variants[variant],
    paddings[padding],
    hoverClasses,
    interactiveClasses,
    glowClasses,
    className
  );

  if (interactive) {
    return (
      <motion.div
        className={cardClasses}
        whileHover={{
          scale: 1.03,
          y: -8,
          boxShadow: glowEffect ? "0 25px 50px rgba(59, 130, 246, 0.3)" : undefined
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        {...props}
      >
        {/* Border gradient overlay */}
        {borderGradient && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-75 blur-sm -z-10" />
        )}

        {/* Glass morphism overlay */}
        {(variant === 'glass' || variant === 'frosted') && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
        )}

        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className={cardClasses}
      {...props}
    >
      {/* Border gradient overlay */}
      {borderGradient && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-75 blur-sm -z-10" />
      )}

      {/* Glass morphism overlay */}
      {(variant === 'glass' || variant === 'frosted') && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
      )}

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default Card;
