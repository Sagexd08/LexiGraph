/**
 * Floating Input Component
 * Advanced form input with floating labels and validation states
 */

import React, { forwardRef, useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';

interface FloatingInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string;
  success?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'minimal';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  showPasswordToggle?: boolean;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(({
  label,
  error,
  success,
  hint,
  size = 'md',
  variant = 'default',
  icon,
  iconPosition = 'left',
  showPasswordToggle = false,
  type = 'text',
  className,
  value,
  onChange,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');
  const id = useId();
  
  const hasValue = Boolean(internalValue) || Boolean(value);
  const isFloating = isFocused || hasValue;
  const inputType = type === 'password' && showPassword ? 'text' : type;

  const sizeClasses = {
    sm: {
      input: 'h-10 px-3 text-sm',
      label: 'text-xs',
      icon: 'h-4 w-4',
    },
    md: {
      input: 'h-12 px-4 text-base',
      label: 'text-sm',
      icon: 'h-5 w-5',
    },
    lg: {
      input: 'h-14 px-5 text-lg',
      label: 'text-base',
      icon: 'h-6 w-6',
    },
  };

  const variantClasses = {
    default: {
      container: 'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600',
      focused: 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20',
      error: 'border-red-500 dark:border-red-400 ring-2 ring-red-500/20',
      success: 'border-green-500 dark:border-green-400 ring-2 ring-green-500/20',
    },
    glass: {
      container: 'bg-white/10 backdrop-blur-md border border-white/20',
      focused: 'border-white/40 ring-2 ring-white/20',
      error: 'border-red-400/60 ring-2 ring-red-400/20',
      success: 'border-green-400/60 ring-2 ring-green-400/20',
    },
    minimal: {
      container: 'bg-transparent border-b-2 border-neutral-300 dark:border-neutral-600 rounded-none',
      focused: 'border-blue-500 dark:border-blue-400',
      error: 'border-red-500 dark:border-red-400',
      success: 'border-green-500 dark:border-green-400',
    },
  };

  const getContainerClasses = () => {
    const base = 'relative w-full transition-all duration-200 rounded-lg';
    const variantClass = variantClasses[variant].container;
    
    if (error) return cn(base, variantClass, variantClasses[variant].error);
    if (success) return cn(base, variantClass, variantClasses[variant].success);
    if (isFocused) return cn(base, variantClass, variantClasses[variant].focused);
    return cn(base, variantClass);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
    onChange?.(e);
  };

  return (
    <div className="w-full">
      <div className={getContainerClasses()}>
        {/* Input */}
        <input
          ref={ref}
          id={id}
          type={inputType}
          value={value !== undefined ? value : internalValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            'w-full bg-transparent outline-none peer',
            sizeClasses[size].input,
            icon && iconPosition === 'left' ? 'pl-10' : '',
            (icon && iconPosition === 'right') || showPasswordToggle ? 'pr-10' : '',
            'placeholder-transparent',
            className
          )}
          placeholder={label}
          {...props}
        />

        {/* Floating Label */}
        <motion.label
          htmlFor={id}
          className={cn(
            'absolute left-4 text-neutral-500 dark:text-neutral-400 pointer-events-none',
            sizeClasses[size].label,
            variant === 'glass' ? 'text-white/70' : ''
          )}
          animate={{
            y: isFloating ? -24 : 0,
            scale: isFloating ? 0.85 : 1,
            color: isFocused 
              ? error ? '#ef4444' : success ? '#22c55e' : '#3b82f6'
              : undefined
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            transformOrigin: 'left center',
            top: '50%',
          }}
        >
          {label}
        </motion.label>

        {/* Left Icon */}
        {icon && iconPosition === 'left' && (
          <div className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400',
            sizeClasses[size].icon
          )}>
            {icon}
          </div>
        )}

        {/* Right Icon or Password Toggle */}
        {((icon && iconPosition === 'right') || showPasswordToggle) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            {showPasswordToggle && type === 'password' && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={cn(
                  'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors',
                  sizeClasses[size].icon
                )}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            )}
            
            {icon && iconPosition === 'right' && (
              <div className={cn('text-neutral-400', sizeClasses[size].icon)}>
                {icon}
              </div>
            )}
          </div>
        )}

        {/* Status Icons */}
        {(error || success) && (
          <div className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2',
            sizeClasses[size].icon,
            showPasswordToggle || (icon && iconPosition === 'right') ? 'mr-8' : ''
          )}>
            {error && <AlertCircle className="text-red-500" />}
            {success && <CheckCircle className="text-green-500" />}
          </div>
        )}
      </div>

      {/* Helper Text */}
      <AnimatePresence mode="wait">
        {(error || success || hint) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-2 text-xs"
          >
            {error && (
              <span className="text-red-500 dark:text-red-400 flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
              </span>
            )}
            {success && !error && (
              <span className="text-green-500 dark:text-green-400 flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>{success}</span>
              </span>
            )}
            {hint && !error && !success && (
              <span className="text-neutral-500 dark:text-neutral-400">{hint}</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

FloatingInput.displayName = 'FloatingInput';

export { FloatingInput };
export default FloatingInput;
