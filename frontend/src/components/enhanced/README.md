# Enhanced LexiGraph Components

This directory contains the enhanced components for the LexiGraph image generation application, featuring modern React patterns, comprehensive error handling, and advanced user experience improvements.

## Components Overview

### EnhancedImageGenerator

A comprehensive image generation component that integrates all the enhanced features.

**Features:**
- Real-time progress tracking with ETA calculations
- Advanced parameter validation with user-friendly error messages
- Comprehensive error handling with retry mechanisms
- Generation history and favorites system
- Responsive design for all screen sizes
- Accessibility compliance with ARIA labels and keyboard navigation

**Usage:**
```tsx
import EnhancedImageGenerator from './enhanced/EnhancedImageGenerator';

<EnhancedImageGenerator
  onImageGenerated={(image, metadata) => console.log('Generated:', image)}
  onError={(error) => console.error('Error:', error)}
  showHistory={true}
  showFavorites={true}
  enableBatchGeneration={false}
/>
```

**Props:**
- `className?: string` - Custom CSS classes
- `onImageGenerated?: (image: string, metadata: GenerateImageResponse['metadata']) => void` - Callback when image is generated
- `onError?: (error: string) => void` - Callback when error occurs
- `initialParams?: Partial<GenerationParams>` - Initial parameter values
- `showHistory?: boolean` - Show generation history panel
- `showFavorites?: boolean` - Enable favorites functionality
- `enableBatchGeneration?: boolean` - Enable batch generation features

## Common Components

### AdvancedLoader

An enhanced loading component with real-time progress indicators and comprehensive features.

**Features:**
- Real-time progress indicators showing generation percentage
- Estimated time remaining calculations based on current progress
- Visual feedback with animated loading states and smooth CSS transitions
- Comprehensive error handling with user-friendly error messages
- Automatic retry mechanisms with exponential backoff for failed requests
- Loading state cancellation functionality

**Usage:**
```tsx
import AdvancedLoader from '../common/AdvancedLoader';

<AdvancedLoader
  isLoading={true}
  progress={75}
  currentStep={15}
  totalSteps={20}
  estimatedTimeRemaining={30}
  onCancel={() => console.log('Cancelled')}
  onRetry={() => console.log('Retrying')}
  title="Generating Image"
  subtitle="Creating your masterpiece..."
/>
```

**Props:**
- `isLoading: boolean` - Whether the loader is active
- `progress?: number` - Progress percentage (0-100)
- `currentStep?: number` - Current step number
- `totalSteps?: number` - Total number of steps
- `estimatedTimeRemaining?: number` - ETA in seconds
- `error?: string | null` - Error message to display
- `onCancel?: () => void` - Cancel callback
- `onRetry?: () => void` - Retry callback
- `onPause?: () => void` - Pause callback
- `onResume?: () => void` - Resume callback
- `isPaused?: boolean` - Whether the process is paused
- `canCancel?: boolean` - Whether cancellation is allowed
- `canPause?: boolean` - Whether pausing is allowed
- `title?: string` - Loading title
- `subtitle?: string` - Loading subtitle
- `variant?: 'default' | 'compact' | 'detailed'` - Display variant
- `showETA?: boolean` - Show estimated time remaining
- `showProgress?: boolean` - Show progress bar
- `autoRetry?: boolean` - Enable automatic retry
- `maxRetries?: number` - Maximum retry attempts
- `retryDelay?: number` - Delay between retries in seconds

### PlaceholderImage

A robust placeholder image system with proper aspect ratios and skeleton loading effects.

**Features:**
- Maintains correct aspect ratios matching requested image dimensions
- Skeleton loading effects with shimmer animations
- Fallback images for failed generations
- Multiple visual variants for different use cases
- Accessibility features and proper styling

**Usage:**
```tsx
import PlaceholderImage from '../common/PlaceholderImage';

<PlaceholderImage
  width={512}
  height={512}
  isGenerating={true}
  variant="artistic"
  progress={50}
  showDimensions={true}
  showShimmer={true}
/>
```

**Props:**
- `width: number` - Image width in pixels
- `height: number` - Image height in pixels
- `isGenerating?: boolean` - Whether image is being generated
- `hasError?: boolean` - Whether there's an error
- `errorMessage?: string` - Error message to display
- `onRetry?: () => void` - Retry callback for errors
- `variant?: 'default' | 'skeleton' | 'artistic' | 'minimal'` - Visual variant
- `showDimensions?: boolean` - Show dimension overlay
- `showShimmer?: boolean` - Enable shimmer animation
- `customIcon?: React.ReactNode` - Custom icon to display
- `title?: string` - Custom title
- `subtitle?: string` - Custom subtitle
- `progress?: number` - Progress percentage (0-100)

### StylesDropdown

A comprehensive styles dropdown with predefined art styles, search functionality, and proper TypeScript typing.

**Features:**
- Predefined art styles including photorealistic, cartoon, oil painting, watercolor, digital art, anime, sketch, abstract, vintage, modern
- Search/filter functionality for easy style discovery
- Category-based organization
- Style preview thumbnails or detailed text descriptions
- Integration with existing parameter validation system
- Responsive design that works on mobile and desktop

**Usage:**
```tsx
import StylesDropdown from '../common/StylesDropdown';

<StylesDropdown
  value="photorealistic"
  onChange={(styleId) => console.log('Selected:', styleId)}
  showSearch={true}
  showCategories={true}
  showThumbnails={false}
  placeholder="Choose an art style..."
/>
```

**Props:**
- `value: string` - Currently selected style ID
- `onChange: (styleId: string) => void` - Selection change callback
- `disabled?: boolean` - Whether the dropdown is disabled
- `placeholder?: string` - Placeholder text
- `showSearch?: boolean` - Enable search functionality
- `showCategories?: boolean` - Show category filters
- `showThumbnails?: boolean` - Show style thumbnails
- `maxHeight?: string` - Maximum dropdown height

## Enhanced Parameter Controls

The `ParameterControls.tsx` component has been enhanced with:

### New Features:
1. **Real-time Validation**: Live validation with user-friendly error messages
2. **Character Counting**: Real-time character count for prompts with limits
3. **Enhanced Controls**: Number inputs alongside sliders for precise control
4. **Advanced Seed Management**: Random seed generation with proper validation
5. **Scheduler Selection**: Dropdown for scheduler options
6. **Validation Feedback**: Visual indicators for validation errors and warnings

### Validation Features:
- **Prompt Validation**: 1-2000 characters with real-time counting
- **Dimension Validation**: 64-1024px, multiples of 8, with visual feedback
- **Steps Validation**: 1-100 with number input and slider
- **Guidance Scale Validation**: 1.0-20.0 with decimal precision
- **Seed Validation**: 0 to 2^32-1 with random generation option
- **Scheduler Validation**: Dropdown with valid options (ddim, dpm, euler, euler_a)

## API Integration Enhancements

### Enhanced API Service

The `enhancedApi.ts` service provides:

**Features:**
- Request queuing and rate limiting to prevent API overload
- Comprehensive error handling for different failure scenarios
- Progress tracking for long-running generations
- Request cancellation and retry mechanisms
- Performance metrics and monitoring
- Automatic request sanitization and validation

**Usage:**
```tsx
import enhancedApiService from '../services/enhancedApi';

// Generate with progress tracking
const response = await enhancedApiService.generateImageWithProgress(
  request,
  (progress, step, totalSteps, eta) => {
    console.log(`Progress: ${progress}%, Step: ${step}/${totalSteps}, ETA: ${eta}s`);
  },
  1 // priority
);

// Get API metrics
const metrics = enhancedApiService.getMetrics();
console.log('API Performance:', metrics);

// Cancel all requests
enhancedApiService.cancelAllRequests();
```

## Accessibility Features

All components include comprehensive accessibility features:

### ARIA Support:
- Proper ARIA labels and descriptions
- Role attributes for interactive elements
- Live regions for dynamic content updates
- Focus management for keyboard navigation

### Keyboard Navigation:
- Tab navigation through all interactive elements
- Enter/Space activation for buttons
- Escape key to close dropdowns and modals
- Arrow key navigation in lists and dropdowns

### Screen Reader Support:
- Descriptive text for all visual elements
- Progress announcements for loading states
- Error message announcements
- Status updates for generation progress

### Visual Accessibility:
- High contrast color schemes
- Scalable text and icons
- Clear visual hierarchy
- Consistent interaction patterns

## Performance Optimizations

### React Optimizations:
- `useMemo` and `useCallback` for expensive computations
- Proper dependency arrays to prevent unnecessary re-renders
- Component memoization where appropriate
- Lazy loading for heavy components

### API Optimizations:
- Request queuing to prevent overwhelming the backend
- Automatic retry with exponential backoff
- Response caching for repeated requests
- Connection pooling and timeout management

### Animation Optimizations:
- Hardware-accelerated CSS animations
- Framer Motion optimizations for smooth transitions
- Reduced motion support for accessibility
- Efficient re-rendering strategies

## Testing

Comprehensive unit tests are provided for all components:

### Test Coverage:
- Component rendering and props handling
- User interaction testing (clicks, keyboard input)
- Error state handling
- Accessibility compliance
- Performance characteristics

### Running Tests:
```bash
npm test
# or
npm run test:ui
```

## Browser Support

The enhanced components support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

When contributing to these enhanced components:

1. Follow the existing TypeScript patterns
2. Include comprehensive prop documentation
3. Add unit tests for new functionality
4. Ensure accessibility compliance
5. Test on multiple screen sizes and devices
6. Follow the established naming conventions
