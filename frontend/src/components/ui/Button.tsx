import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
  glowEffect?: boolean;
  pulseOnHover?: boolean;
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
  glowEffect = false,
  pulseOnHover = false,
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95';

  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl focus:ring-blue-500 border border-blue-500/20',
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white focus:ring-gray-500 border border-gray-200 dark:border-gray-600',
    outline: 'border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:ring-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500 hover:shadow-md',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl focus:ring-red-500 border border-red-500/20',
    glass: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-white/20 dark:border-gray-700/50 text-gray-900 dark:text-white hover:bg-white/90 dark:hover:bg-gray-800/90 shadow-lg hover:shadow-xl focus:ring-blue-500',
    gradient: 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl focus:ring-purple-500 border border-purple-500/20'
  };

  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  const roundedClasses = rounded ? 'rounded-full' : 'rounded-xl';
  const widthClasses = fullWidth ? 'w-full' : '';
  const glowClasses = glowEffect ? 'shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40' : '';
  const pulseClasses = pulseOnHover ? 'hover:animate-pulse' : '';

  const buttonClasses = clsx(
    baseClasses,
    variants[variant],
    sizes[size],
    roundedClasses,
    widthClasses,
    glowClasses,
    pulseClasses,
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
      whileHover={{
        scale: disabled || loading ? 1 : 1.02,
        boxShadow: glowEffect ? "0 20px 40px rgba(59, 130, 246, 0.3)" : undefined
      }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
      {...props}
    >
      {/* Background gradient overlay for glass effect */}
      {variant === 'glass' && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center">
        {iconElement && iconPosition === 'left' && (
          <span className={children ? 'mr-2' : ''}>{iconElement}</span>
        )}
        {children}
        {iconElement && iconPosition === 'right' && (
          <span className={children ? 'ml-2' : ''}>{iconElement}</span>
        )}
      </span>
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;
