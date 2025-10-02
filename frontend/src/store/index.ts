/**
 * Main Zustand store with advanced state management features
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Store, AppState, GenerationJob, GenerationHistory, Notification, OfflineAction } from './types';
import { GenerationParams, GenerateImageResponse } from '../types/api';
import { generateId } from '../utils/id';

// Default state values
const defaultUIState = {
  theme: 'system' as const,
  sidebarCollapsed: false,
  activeTab: 'generate',
  showAdvancedSettings: false,
  showHistory: false,
  showFavorites: false,
  notifications: [],
  modals: {
    settings: false,
    help: false,
    about: false,
    imageEditor: false,
  },
};

const defaultPreferences = {
  defaultParams: {
    width: 512,
    height: 512,
    num_inference_steps: 20,
    guidance_scale: 7.5,
    scheduler: 'ddim' as const,
  },
  favoriteStyles: [],
  recentPrompts: [],
  shortcuts: {},
  autoSave: true,
  notifications: {
    enabled: true,
    sound: true,
    desktop: false,
  },
  performance: {
    enableOptimizations: true,
    maxConcurrentJobs: 3,
    cacheSize: 100,
  },
};

const defaultCacheState = {
  entries: new Map(),
  size: 0,
  maxSize: 100,
  hits: 0,
  misses: 0,
};

const defaultApiState = {
  isConnected: false,
  isModelLoaded: false,
  lastPing: 0,
  metrics: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    queueLength: 0,
    isRateLimited: false,
  },
};

const defaultOfflineState = {
  isOnline: navigator.onLine,
  pendingActions: [],
  syncStatus: 'idle' as const,
  lastSync: 0,
};

const initialState: AppState = {
  currentJob: undefined,
  jobQueue: [],
  history: [],
  favorites: [],
  ui: defaultUIState,
  preferences: defaultPreferences,
  cache: defaultCacheState,
  api: defaultApiState,
  offline: defaultOfflineState,
  loading: {
    generation: false,
    history: false,
    preferences: false,
    sync: false,
  },
  errors: {},
};

export const useAppStore = create<Store>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          // Generation Actions
          startGeneration: async (params: GenerationParams, priority = 1): Promise<string> => {
            const jobId = generateId();
            const job: GenerationJob = {
              id: jobId,
              params,
              status: 'pending',
              progress: 0,
              startTime: Date.now(),
              priority,
              retryCount: 0,
              maxRetries: 3,
            };

            set((state) => {
              state.jobQueue.push(job);
              state.jobQueue.sort((a, b) => b.priority - a.priority);
              state.loading.generation = true;
            });

            return jobId;
          },

          cancelGeneration: (jobId: string) => {
            set((state) => {
              const jobIndex = state.jobQueue.findIndex(job => job.id === jobId);
              if (jobIndex !== -1) {
                state.jobQueue[jobIndex].status = 'cancelled';
              }
              if (state.currentJob?.id === jobId) {
                state.currentJob = undefined;
                state.loading.generation = false;
              }
            });
          },

          retryGeneration: async (jobId: string) => {
            set((state) => {
              const job = state.jobQueue.find(j => j.id === jobId);
              if (job && job.retryCount < job.maxRetries) {
                job.status = 'pending';
                job.retryCount += 1;
                job.progress = 0;
                job.error = undefined;
              }
            });
          },

          updateGenerationProgress: (jobId: string, progress: number, eta?: number) => {
            set((state) => {
              const job = state.jobQueue.find(j => j.id === jobId);
              if (job) {
                job.progress = progress;
                job.eta = eta;
                job.status = 'processing';
              }
              if (state.currentJob?.id === jobId) {
                state.currentJob.progress = progress;
                state.currentJob.eta = eta;
              }
            });
          },

          completeGeneration: (jobId: string, result: GenerateImageResponse) => {
            set((state) => {
              const jobIndex = state.jobQueue.findIndex(job => job.id === jobId);
              if (jobIndex !== -1) {
                const job = state.jobQueue[jobIndex];
                job.status = 'completed';
                job.result = result;
                job.endTime = Date.now();
                job.progress = 100;

                // Add to history
                const historyItem: GenerationHistory = {
                  id: generateId(),
                  params: job.params,
                  result,
                  timestamp: Date.now(),
                  isFavorite: false,
                  tags: [],
                  metadata: {
                    generationTime: job.endTime - job.startTime,
                    modelVersion: 'v1.0',
                    settings: job.params,
                  },
                };
                state.history.unshift(historyItem);

                // Remove completed job from queue
                state.jobQueue.splice(jobIndex, 1);
              }

              if (state.currentJob?.id === jobId) {
                state.currentJob = undefined;
              }

              state.loading.generation = state.jobQueue.some(job => job.status === 'processing');
            });
          },

          failGeneration: (jobId: string, error: string) => {
            set((state) => {
              const job = state.jobQueue.find(j => j.id === jobId);
              if (job) {
                job.status = 'failed';
                job.error = error;
                job.endTime = Date.now();
              }
              if (state.currentJob?.id === jobId) {
                state.currentJob = undefined;
              }
              state.loading.generation = false;
              state.errors.generation = error;
            });
          },

          // History Actions
          addToHistory: (item: Omit<GenerationHistory, 'id' | 'timestamp'>) => {
            set((state) => {
              const historyItem: GenerationHistory = {
                ...item,
                id: generateId(),
                timestamp: Date.now(),
              };
              state.history.unshift(historyItem);
              
              // Limit history size
              if (state.history.length > 1000) {
                state.history = state.history.slice(0, 1000);
              }
            });
          },

          removeFromHistory: (id: string) => {
            set((state) => {
              state.history = state.history.filter(item => item.id !== id);
              state.favorites = state.favorites.filter(item => item.id !== id);
            });
          },

          clearHistory: () => {
            set((state) => {
              state.history = [];
              state.favorites = [];
            });
          },

          toggleFavorite: (id: string) => {
            set((state) => {
              const item = state.history.find(h => h.id === id);
              if (item) {
                item.isFavorite = !item.isFavorite;
                if (item.isFavorite) {
                  state.favorites.push(item);
                } else {
                  state.favorites = state.favorites.filter(f => f.id !== id);
                }
              }
            });
          },

          addTags: (id: string, tags: string[]) => {
            set((state) => {
              const item = state.history.find(h => h.id === id);
              if (item) {
                item.tags = [...new Set([...item.tags, ...tags])];
              }
            });
          },

          // UI Actions
          setTheme: (theme) => {
            set((state) => {
              state.ui.theme = theme;
            });
          },

          toggleSidebar: () => {
            set((state) => {
              state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed;
            });
          },

          setActiveTab: (tab: string) => {
            set((state) => {
              state.ui.activeTab = tab;
            });
          },

          showNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
            set((state) => {
              const newNotification: Notification = {
                ...notification,
                id: generateId(),
                timestamp: Date.now(),
              };
              // Ensure notifications array exists
              if (!state.ui.notifications) {
                state.ui.notifications = [];
              }
              state.ui.notifications.push(newNotification);

              // Auto-dismiss after duration
              if (notification.duration) {
                setTimeout(() => {
                  get().dismissNotification(newNotification.id);
                }, notification.duration);
              }
            });
          },

          dismissNotification: (id: string) => {
            set((state) => {
              state.ui.notifications = state.ui.notifications.filter(n => n.id !== id);
            });
          },

          openModal: (modal) => {
            set((state) => {
              state.ui.modals[modal] = true;
            });
          },

          closeModal: (modal) => {
            set((state) => {
              state.ui.modals[modal] = false;
            });
          },

          // Preferences Actions
          updatePreferences: (updates) => {
            set((state) => {
              Object.assign(state.preferences, updates);
            });
          },

          resetPreferences: () => {
            set((state) => {
              state.preferences = defaultPreferences;
            });
          },

          // Cache Actions
          setCache: <T>(key: string, data: T, ttl = 3600000) => {
            set((state) => {
              const entry = {
                data,
                timestamp: Date.now(),
                ttl,
                key,
              };
              state.cache.entries.set(key, entry);
              state.cache.size = state.cache.entries.size;

              // Cleanup expired entries
              if (state.cache.size > state.cache.maxSize) {
                const entries = Array.from(state.cache.entries.entries());
                entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
                const toDelete = entries.slice(0, entries.length - state.cache.maxSize);
                toDelete.forEach(([key]) => state.cache.entries.delete(key));
                state.cache.size = state.cache.entries.size;
              }
            });
          },

          getCache: <T>(key: string): T | null => {
            const state = get();
            const entry = state.cache.entries.get(key);
            
            if (!entry) {
              set((state) => { state.cache.misses++; });
              return null;
            }

            if (Date.now() - entry.timestamp > entry.ttl) {
              set((state) => {
                state.cache.entries.delete(key);
                state.cache.size = state.cache.entries.size;
                state.cache.misses++;
              });
              return null;
            }

            set((state) => { state.cache.hits++; });
            return entry.data as T;
          },

          clearCache: (pattern?: string) => {
            set((state) => {
              if (pattern) {
                const regex = new RegExp(pattern);
                for (const [key] of state.cache.entries) {
                  if (regex.test(key)) {
                    state.cache.entries.delete(key);
                  }
                }
              } else {
                state.cache.entries.clear();
              }
              state.cache.size = state.cache.entries.size;
            });
          },

          // API Actions
          updateApiState: (updates) => {
            set((state) => {
              Object.assign(state.api, updates);
            });
          },

          pingApi: async () => {
            // Implementation will be added with API integration
            set((state) => {
              state.api.lastPing = Date.now();
            });
          },

          // Offline Actions
          setOnlineStatus: (isOnline: boolean) => {
            set((state) => {
              state.offline.isOnline = isOnline;
            });
          },

          addOfflineAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => {
            set((state) => {
              const offlineAction: OfflineAction = {
                ...action,
                id: generateId(),
                timestamp: Date.now(),
                retryCount: 0,
              };
              state.offline.pendingActions.push(offlineAction);
            });
          },

          syncOfflineActions: async () => {
            // Implementation will be added with offline sync
            set((state) => {
              state.offline.syncStatus = 'syncing';
            });
          },

          // Utility Actions
          reset: () => {
            set(initialState);
          },

          hydrate: (state: Partial<AppState>) => {
            set((currentState) => {
              Object.assign(currentState, state);
            });
          },
        }))
      ),
      {
        name: 'lexigraph-store',
        partialize: (state) => ({
          history: state.history,
          favorites: state.favorites,
          preferences: state.preferences,
          ui: {
            theme: state.ui.theme,
            sidebarCollapsed: state.ui.sidebarCollapsed,
            activeTab: state.ui.activeTab,
            notifications: [], // Always reset notifications on persist
          },
        }),
      }
    ),
    {
      name: 'LexiGraph Store',
    }
  )
);

// Selectors for optimized component subscriptions
export const useGenerationState = () => useAppStore((state) => ({
  currentJob: state.currentJob,
  jobQueue: state.jobQueue,
  loading: state.loading.generation,
  error: state.errors.generation,
}));

export const useHistoryState = () => useAppStore((state) => ({
  history: state.history,
  favorites: state.favorites,
}));

export const useUIState = () => useAppStore((state) => state.ui);

export const usePreferences = () => useAppStore((state) => state.preferences);

export const useApiState = () => useAppStore((state) => state.api);

export const useOfflineState = () => useAppStore((state) => state.offline);
