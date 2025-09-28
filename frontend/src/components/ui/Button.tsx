/**
 * Enhanced Button Component
 * 
 * Modern, accessible button component with multiple variants and states
 */

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  rounded = false,
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl focus:ring-indigo-500',
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white focus:ring-gray-500',
    outline: 'border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus:ring-indigo-500',
    ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl focus:ring-red-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  const roundedClasses = rounded ? 'rounded-full' : 'rounded-lg';
  const widthClasses = fullWidth ? 'w-full' : '';

  const buttonClasses = clsx(
    baseClasses,
    variants[variant],
    sizes[size],
    roundedClasses,
    widthClasses,
    className
  );

  const iconElement = loading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : icon;

  return (
    <motion.button
      ref={ref}
      className={buttonClasses}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      {...props}
    >
      {iconElement && iconPosition === 'left' && (
        <span className={children ? 'mr-2' : ''}>{iconElement}</span>
      )}
      {children}
      {iconElement && iconPosition === 'right' && (
        <span className={children ? 'ml-2' : ''}>{iconElement}</span>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;
