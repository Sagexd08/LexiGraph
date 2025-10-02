
/**
 * Enhanced LexiGraph Components
 *
 * This module exports all the enhanced components for the LexiGraph application.
 * These components feature modern React patterns, comprehensive error handling,
 * and advanced user experience improvements.
 */

// Main enhanced components
export { default as EnhancedImageGenerator } from './EnhancedImageGenerator';
export { default as IntegrationExample } from './IntegrationExample';

// Common enhanced components
export { default as AdvancedLoader } from '../common/AdvancedLoader';
export { default as PlaceholderImage } from '../common/PlaceholderImage';
export { default as StylesDropdown } from '../common/StylesDropdown';

// Enhanced parameter controls
export { default as ParameterControls } from '../ParameterControls';

// Legacy components (for backward compatibility)
// Note: ImageGenerator has been replaced by EnhancedImageGenerator
export { default as PromptBuilder } from '../PromptBuilder';
export { default as ImageViewer } from '../ImageViewer';
export { default as BatchGenerator } from '../BatchGenerator';
export { default as KeyboardShortcuts, useKeyboardShortcuts } from '../KeyboardShortcuts';
export { default as PerformanceMonitor, usePerformanceTracking } from '../PerformanceMonitor';
export { default as ThemeCustomizer } from '../ThemeCustomizer';

// UI components
export * from '../ui';

// Type exports
export type { ButtonProps } from '../ui/Button';
export type { CardProps } from '../ui/Card';
export type { InputProps } from '../ui/Input';
export type { ModalProps } from '../ui/Modal';
export type { TooltipProps } from '../ui/Tooltip';
