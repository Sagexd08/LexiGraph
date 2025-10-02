/**
 * Advanced Button Component
 * Modern button with animations, loading states, and visual feedback
 */

import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AdvancedButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'gradient' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  glow?: boolean;
  className?: string;
}

const AdvancedButton = forwardRef<HTMLButtonElement, AdvancedButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  glow = false,
  className,
  ...props
}, ref) => {
  const baseClasses = [
    'relative inline-flex items-center justify-center',
    'font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'overflow-hidden',
  ].join(' ');

  const variantClasses = {
    primary: [
      'bg-gradient-to-r from-blue-500 to-purple-600',
      'text-white shadow-lg',
      'hover:from-blue-600 hover:to-purple-700',
      'focus:ring-blue-500',
      'active:scale-95',
    ].join(' '),
    
    secondary: [
      'bg-white dark:bg-neutral-800',
      'text-neutral-900 dark:text-white',
      'border border-neutral-300 dark:border-neutral-600',
      'hover:bg-neutral-50 dark:hover:bg-neutral-700',
      'focus:ring-neutral-500',
    ].join(' '),
    
    ghost: [
      'bg-transparent',
      'text-neutral-700 dark:text-neutral-300',
      'hover:bg-neutral-100 dark:hover:bg-neutral-800',
      'focus:ring-neutral-500',
    ].join(' '),
    
    glass: [
      'bg-white/10 backdrop-blur-md',
      'text-white border border-white/20',
      'hover:bg-white/20',
      'focus:ring-white/50',
    ].join(' '),
    
    gradient: [
      'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500',
      'text-white shadow-lg',
      'hover:shadow-xl hover:scale-105',
      'focus:ring-purple-500',
    ].join(' '),
    
    outline: [
      'bg-transparent border-2',
      'border-blue-500 text-blue-500',
      'hover:bg-blue-500 hover:text-white',
      'focus:ring-blue-500',
    ].join(' '),
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-xl',
    xl: 'px-8 py-4 text-lg rounded-xl',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6',
  };

  const glowClasses = glow && variant === 'primary' 
    ? 'shadow-[0_0_20px_rgba(59,130,246,0.5)]' 
    : '';

  const widthClasses = fullWidth ? 'w-full' : '';

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.02,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    tap: { 
      scale: 0.98,
      transition: { duration: 0.1 }
    },
  };

  const rippleVariants = {
    initial: { scale: 0, opacity: 0.5 },
    animate: { 
      scale: 4, 
      opacity: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    },
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;
    
    // Create ripple effect
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    `;
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <>
      <style>{`
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
      
      <motion.button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          glowClasses,
          widthClasses,
          className
        )}
        variants={buttonVariants}
        initial="initial"
        whileHover={!disabled && !loading ? "hover" : undefined}
        whileTap={!disabled && !loading ? "tap" : undefined}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {/* Background gradient animation */}
        {variant === 'gradient' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 opacity-0"
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
        
        {/* Content */}
        <span className="relative flex items-center justify-center space-x-2">
          {loading && (
            <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
          )}
          
          {!loading && icon && iconPosition === 'left' && (
            <span className={iconSizes[size]}>{icon}</span>
          )}
          
          <span>{children}</span>
          
          {!loading && icon && iconPosition === 'right' && (
            <span className={iconSizes[size]}>{icon}</span>
          )}
        </span>
      </motion.button>
    </>
  );
});

AdvancedButton.displayName = 'AdvancedButton';

export { AdvancedButton };
export default AdvancedButton;
