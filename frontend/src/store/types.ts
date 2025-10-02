/**
 * Type definitions for the application state management
 */

import { GenerationParams, GenerateImageResponse } from '../types/api';

// Generation State Types
export interface GenerationJob {
  id: string;
  params: GenerationParams;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  eta?: number;
  startTime: number;
  endTime?: number;
  result?: GenerateImageResponse;
  error?: string;
  priority: number;
  retryCount: number;
  maxRetries: number;
}

export interface GenerationHistory {
  id: string;
  params: GenerationParams;
  result: GenerateImageResponse;
  timestamp: number;
  isFavorite: boolean;
  tags: string[];
  metadata: {
    generationTime: number;
    modelVersion: string;
    settings: Record<string, any>;
  };
}

// UI State Types
export interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  activeTab: string;
  showAdvancedSettings: boolean;
  showHistory: boolean;
  showFavorites: boolean;
  notifications: Notification[];
  modals: {
    settings: boolean;
    help: boolean;
    about: boolean;
    imageEditor: boolean;
  };
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary';
}

// User Preferences Types
export interface UserPreferences {
  defaultParams: Partial<GenerationParams>;
  favoriteStyles: string[];
  recentPrompts: string[];
  shortcuts: Record<string, string>;
  autoSave: boolean;
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
  performance: {
    enableOptimizations: boolean;
    maxConcurrentJobs: number;
    cacheSize: number;
  };
}

// Cache Types
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export interface CacheState {
  entries: Map<string, CacheEntry>;
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
}

// API State Types
export interface ApiState {
  isConnected: boolean;
  isModelLoaded: boolean;
  lastPing: number;
  systemInfo?: {
    memory: Record<string, any>;
    device: Record<string, any>;
    model: Record<string, any>;
  };
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    queueLength: number;
    isRateLimited: boolean;
  };
}

// Offline State Types
export interface OfflineState {
  isOnline: boolean;
  pendingActions: OfflineAction[];
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSync: number;
}

export interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

// Main Store State
export interface AppState {
  // Generation Management
  currentJob?: GenerationJob;
  jobQueue: GenerationJob[];
  history: GenerationHistory[];
  favorites: GenerationHistory[];
  
  // UI State
  ui: UIState;
  
  // User Preferences
  preferences: UserPreferences;
  
  // Cache Management
  cache: CacheState;
  
  // API State
  api: ApiState;
  
  // Offline Support
  offline: OfflineState;
  
  // Loading States
  loading: {
    generation: boolean;
    history: boolean;
    preferences: boolean;
    sync: boolean;
  };
  
  // Error States
  errors: {
    generation?: string;
    api?: string;
    sync?: string;
  };
}

// Action Types
export interface StoreActions {
  // Generation Actions
  startGeneration: (params: GenerationParams, priority?: number) => Promise<string>;
  cancelGeneration: (jobId: string) => void;
  retryGeneration: (jobId: string) => Promise<void>;
  updateGenerationProgress: (jobId: string, progress: number, eta?: number) => void;
  completeGeneration: (jobId: string, result: GenerateImageResponse) => void;
  failGeneration: (jobId: string, error: string) => void;
  
  // History Actions
  addToHistory: (item: Omit<GenerationHistory, 'id' | 'timestamp'>) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  toggleFavorite: (id: string) => void;
  addTags: (id: string, tags: string[]) => void;
  
  // UI Actions
  setTheme: (theme: UIState['theme']) => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  
  // Preferences Actions
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  
  // Cache Actions
  setCache: <T>(key: string, data: T, ttl?: number) => void;
  getCache: <T>(key: string) => T | null;
  clearCache: (pattern?: string) => void;
  
  // API Actions
  updateApiState: (updates: Partial<ApiState>) => void;
  pingApi: () => Promise<void>;
  
  // Offline Actions
  setOnlineStatus: (isOnline: boolean) => void;
  addOfflineAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => void;
  syncOfflineActions: () => Promise<void>;
  
  // Utility Actions
  reset: () => void;
  hydrate: (state: Partial<AppState>) => void;
}

export type Store = AppState & StoreActions;
