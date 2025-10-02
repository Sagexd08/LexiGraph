import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Type,
  AlertTriangle,
  CheckCircle,
  Maximize2,
  Minimize2,
  Copy,
  Wand2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { SPACING } from '../../design-system/tokens';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  minLength?: number;
  showCharacterCount?: boolean;
  showValidation?: boolean;
  error?: string;
  className?: string;
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  suggestions?: string[];
  showSuggestions?: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  placeholder = "Describe the image you want to generate...",
  disabled = false,
  maxLength = 2000,
  minLength = 1,
  showCharacterCount = true,
  showValidation = true,
  error,
  className,
  autoResize = true,
  minRows = 3,
  maxRows = 8,
  onFocus,
  onBlur,
  suggestions = [],
  showSuggestions = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Character count and validation
  const characterCount = value.length;
  const isValid = characterCount >= minLength && characterCount <= maxLength && !error;
  const isWarning = characterCount > maxLength * 0.9;
  const isError = characterCount > maxLength || !!error;

  // Auto-resize functionality
  const adjustHeight = useCallback(() => {
    if (textareaRef.current && autoResize) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      
      const lineHeight = 24; // 1.5rem
      const minHeight = lineHeight * minRows;
      const maxHeight = lineHeight * maxRows;
      const scrollHeight = textarea.scrollHeight;
      
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [autoResize, minRows, maxRows]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  }, [onChange, maxLength]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setShowSuggestionsPanel(false);
    onBlur?.();
  }, [onBlur]);

  // Handle expand/collapse
  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    onChange(suggestion);
    setShowSuggestionsPanel(false);
    textareaRef.current?.focus();
  }, [onChange]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      // Show success feedback (implement toast system)
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  }, [value]);

  // Handle clear
  const handleClear = useCallback(() => {
    onChange('');
    textareaRef.current?.focus();
  }, [onChange]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter to submit (if parent handles it)
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      // Parent can listen for this event
      textareaRef.current?.dispatchEvent(new CustomEvent('submit'));
    }
    
    // Escape to blur
    if (e.key === 'Escape') {
      textareaRef.current?.blur();
    }
  }, []);

  return (
    <div className={cn('relative', className)}>
      {/* Label and Actions */}
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Type className="h-4 w-4" />
          <span>Prompt</span>
          {showValidation && (
            <span className="text-xs text-gray-500">
              ({minLength}-{maxLength} characters)
            </span>
          )}
        </label>
        
        <div className="flex items-center space-x-1">
          {/* Suggestions toggle */}
          {showSuggestions && suggestions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSuggestionsPanel(!showSuggestionsPanel)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Show suggestions"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          )}
          
          {/* Copy button */}
          {value && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Copy prompt"
            >
              <Copy className="h-4 w-4" />
            </button>
          )}
          
          {/* Clear button */}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Clear prompt"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          
          {/* Expand/collapse button */}
          <button
            type="button"
            onClick={toggleExpanded}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Input Container */}
      <div className="relative">
        <motion.div
          animate={{
            scale: isFocused ? 1.01 : 1,
          }}
          transition={{ duration: 0.2 }}
          className={cn(
            // Base styles
            'relative rounded-xl border-2 transition-all duration-200',
            'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md',
            'shadow-lg hover:shadow-xl',

            // Glass morphism effects
            'border-white/20 dark:border-white/10',

            // Focus states
            isFocused && [
              'ring-4 ring-blue-500/20',
              'border-blue-500/50 dark:border-blue-400/50',
              'bg-white/90 dark:bg-gray-800/90',
              'shadow-2xl',
            ],

            // Validation states
            !isFocused && isError && [
              'border-red-500/50 dark:border-red-400/50',
              'ring-4 ring-red-500/20',
              'bg-red-50/50 dark:bg-red-900/20',
            ],
            !isFocused && isValid && value && [
              'border-green-500/50 dark:border-green-400/50',
              'bg-green-50/50 dark:bg-green-900/20',
            ],
            !isFocused && !isError && !isValid && [
              'border-white/20 dark:border-white/10',
            ],

            // Disabled state
            disabled && 'opacity-50 cursor-not-allowed',

            // Custom glass styling from parent
            className?.includes('bg-white/') && 'bg-transparent',
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={isExpanded ? maxRows : minRows}
            className={cn(
              // Base styles
              'w-full px-4 py-3 text-base',
              'bg-transparent border-none outline-none resize-none',
              'text-gray-900 dark:text-white',
              'placeholder-gray-500 dark:placeholder-gray-400',
              
              // Font and spacing
              'font-medium leading-relaxed',
              
              // Scrollbar
              'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
              'scrollbar-track-transparent',
            )}
            style={{
              minHeight: autoResize ? undefined : `${24 * minRows}px`,
              maxHeight: autoResize ? undefined : `${24 * maxRows}px`,
            }}
          />
          
          {/* Validation Icon */}
          <div className="absolute top-3 right-3">
            <AnimatePresence>
              {showValidation && value && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  {isError ? (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  ) : isValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Character Count */}
        {showCharacterCount && (
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Press Ctrl+Enter to generate
            </div>
            <div
              className={cn(
                'text-xs font-medium',
                isError && 'text-red-500',
                isWarning && !isError && 'text-yellow-500',
                !isWarning && !isError && 'text-gray-500 dark:text-gray-400',
              )}
            >
              {characterCount}/{maxLength}
            </div>
          </div>
        )}



        {/* Suggestions Panel */}
        <AnimatePresence>
          {showSuggestionsPanel && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10"
            >
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Suggested prompts:
              </div>
              <div className="space-y-1">
                {suggestions.slice(0, 5).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PromptInput;
export type { PromptInputProps };
