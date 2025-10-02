import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  focusVisible: boolean;
  screenReader: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  announceToScreenReader: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    reducedMotion: false,
    highContrast: false,
    fontSize: 'medium',
    focusVisible: true,
    screenReader: false,
  });

  const [announcements, setAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    // Detect user preferences
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
    };

    // Check for screen reader
    const hasScreenReader = window.navigator.userAgent.includes('NVDA') ||
                           window.navigator.userAgent.includes('JAWS') ||
                           window.speechSynthesis !== undefined;

    setSettings(prev => ({
      ...prev,
      reducedMotion: mediaQueries.reducedMotion.matches,
      highContrast: mediaQueries.highContrast.matches,
      screenReader: hasScreenReader,
    }));

    // Listen for changes
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, reducedMotion: e.matches }));
    };

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, highContrast: e.matches }));
    };

    mediaQueries.reducedMotion.addEventListener('change', handleReducedMotionChange);
    mediaQueries.highContrast.addEventListener('change', handleHighContrastChange);

    return () => {
      mediaQueries.reducedMotion.removeEventListener('change', handleReducedMotionChange);
      mediaQueries.highContrast.removeEventListener('change', handleHighContrastChange);
    };
  }, []);

  useEffect(() => {
    // Apply CSS custom properties based on settings
    const root = document.documentElement;
    
    root.style.setProperty('--animation-duration', settings.reducedMotion ? '0ms' : '300ms');
    root.style.setProperty('--transition-duration', settings.reducedMotion ? '0ms' : '200ms');
    
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '20px',
    };
    root.style.setProperty('--base-font-size', fontSizeMap[settings.fontSize]);

    // Add accessibility classes
    document.body.classList.toggle('reduced-motion', settings.reducedMotion);
    document.body.classList.toggle('high-contrast', settings.highContrast);
    document.body.classList.toggle('focus-visible', settings.focusVisible);
  }, [settings]);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const announceToScreenReader = (message: string) => {
    setAnnouncements(prev => [...prev, message]);
    
    // Remove announcement after a delay
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1));
    }, 1000);
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings, announceToScreenReader }}>
      {children}
      
      {/* Screen Reader Announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcements.map((announcement, index) => (
          <div key={index}>{announcement}</div>
        ))}
      </div>
      
      {/* Skip Links */}
      <div className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50">
        <a
          href="#main-content"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium"
        >
          Skip to main content
        </a>
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// HOC for adding accessibility features to components
export function withAccessibility<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AccessibleComponent(props: P) {
    const { settings } = useAccessibility();
    
    return (
      <Component
        {...props}
        data-reduced-motion={settings.reducedMotion}
        data-high-contrast={settings.highContrast}
        data-font-size={settings.fontSize}
      />
    );
  };
}

// Accessibility utility hooks
export const useReducedMotion = () => {
  const { settings } = useAccessibility();
  return settings.reducedMotion;
};

export const useHighContrast = () => {
  const { settings } = useAccessibility();
  return settings.highContrast;
};

export const useScreenReader = () => {
  const { settings } = useAccessibility();
  return settings.screenReader;
};

// Focus management utilities
export const useFocusManagement = () => {
  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  };

  const trapFocus = (containerRef: React.RefObject<HTMLElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  };

  return { focusElement, trapFocus };
};

export default AccessibilityProvider;
