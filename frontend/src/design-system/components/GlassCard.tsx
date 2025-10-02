/**
 * Glass Card Component
 * Modern glassmorphism card with advanced animations and effects
 */

import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'interactive' | 'gradient';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  glow?: boolean;
  hover?: boolean;
  className?: string;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(({
  children,
  variant = 'default',
  blur = 'md',
  border = true,
  glow = false,
  hover = true,
  className,
  ...props
}, ref) => {
  const baseClasses = 'relative overflow-hidden';
  
  const variantClasses = {
    default: 'bg-white/10 dark:bg-white/5',
    elevated: 'bg-white/20 dark:bg-white/10 shadow-2xl',
    interactive: 'bg-white/15 dark:bg-white/8 cursor-pointer',
    gradient: 'bg-gradient-to-br from-white/20 to-white/5 dark:from-white/10 dark:to-white/2',
  };
  
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };
  
  const borderClasses = border 
    ? 'border border-white/20 dark:border-white/10' 
    : '';
  
  const glowClasses = glow 
    ? 'shadow-[0_0_50px_rgba(59,130,246,0.3)] dark:shadow-[0_0_50px_rgba(59,130,246,0.2)]' 
    : '';

  const hoverAnimation = hover ? {
    whileHover: { 
      scale: 1.02,
      y: -2,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    whileTap: { 
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  } : {};

  return (
    <motion.div
      ref={ref}
      className={cn(
        baseClasses,
        variantClasses[variant],
        blurClasses[blur],
        borderClasses,
        glowClasses,
        'rounded-2xl',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      {...hoverAnimation}
      {...props}
    >
      {/* Glass reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Border highlight */}
      {border && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-transparent p-px pointer-events-none">
          <div className="w-full h-full rounded-2xl bg-transparent" />
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
});

GlassCard.displayName = 'GlassCard';

export { GlassCard };
export default GlassCard;
