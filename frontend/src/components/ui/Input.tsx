

import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { AlertCircle, Check } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outline';
  inputSize?: 'sm' | 'md' | 'lg';
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  className,
  label,
  error,
  success,
  hint,
  leftIcon,
  rightIcon,
  variant = 'default',
  inputSize = 'md',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseClasses = 'w-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';

  const variants = {
    default: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-indigo-500 focus:ring-indigo-200 dark:focus:ring-indigo-800',
    filled: 'border-0 bg-gray-100 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 focus:ring-indigo-200 dark:focus:ring-indigo-800',
    outline: 'border-2 border-gray-200 dark:border-gray-700 bg-transparent focus:border-indigo-500 focus:ring-indigo-200 dark:focus:ring-indigo-800'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-md',
    md: 'px-4 py-3 text-sm rounded-lg',
    lg: 'px-5 py-4 text-base rounded-lg'
  };

  const stateClasses = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-800'
    : success
    ? 'border-green-500 focus:border-green-500 focus:ring-green-200 dark:focus:ring-green-800'
    : '';

  const paddingClasses = leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '';

  const inputClasses = clsx(
    baseClasses,
    variants[variant],
    sizes[inputSize],
    stateClasses,
    paddingClasses,
    'text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
    className
  );

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">
              {leftIcon}
            </div>
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          {...props}
        />

        {rightIcon && !error && !success && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">
              {rightIcon}
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}

        {success && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Check className="h-5 w-5 text-green-500" />
          </div>
        )}
      </div>

      {(error || success || hint) && (
        <div className="mt-2">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
              <Check className="h-4 w-4 mr-1" />
              {success}
            </p>
          )}
          {hint && !error && !success && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
