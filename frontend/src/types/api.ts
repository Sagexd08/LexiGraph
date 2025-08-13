/**
 * TypeScript type definitions for Lexigraph API
 */

export interface GenerateImageRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  seed?: number;
  style?: string;
  scheduler?: string;
}

export interface GenerateImageResponse {
  success: boolean;
  image?: string;
  error?: string;
  metadata: {
    prompt: string;
    negative_prompt?: string;
    width: number;
    height: number;
    num_inference_steps: number;
    guidance_scale: number;
    seed?: number;
    style?: string;
    scheduler: string;
    model_type: string;
  };
  generation_time?: number;
}

export interface ModelInfo {
  is_loaded: boolean;
  model_type: string;
  device: string;
  torch_dtype: string;
  current_scheduler: string;
  base_model: string;
  model_path: string;
  optimizations: {
    xformers_enabled: boolean;
    attention_slicing: boolean;
    cpu_offload: boolean;
  };
}

export interface SystemInfo {
  memory_info: {
    system_memory: {
      total: number;
      available: number;
      percent: number;
    };
    gpu_memory?: {
      total: number;
      allocated: number;
      cached: number;
    };
  };
  device_info: {
    device: string;
    cuda_available: boolean;
    cuda_device_count: number;
    cuda_device_name?: string;
    cuda_capability?: [number, number];
  };
  model_info: ModelInfo;
  settings: {
    model_type: string;
    base_model: string;
    max_concurrent_requests: number;
    enable_xformers: boolean;
    enable_cpu_offload: boolean;
    enable_attention_slicing: boolean;
  };
}

export interface StylePreset {
  name: string;
  positive_suffix: string;
  negative_prompt: string;
}

export interface StylesResponse {
  success: boolean;
  styles: Record<string, StylePreset>;
  count: number;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  model_loaded: boolean;
  timestamp: number;
}

export interface ApiError {
  error: {
    type: string;
    status_code: number;
    detail: string;
    path: string;
    method: string;
    timestamp: number;
    errors?: any[];
  };
}

// Generation parameters with validation
export interface GenerationParams {
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  steps: number;
  guidanceScale: number;
  seed: number | null;
  style: string;
  scheduler: string;
}

// UI State types
export interface GenerationState {
  isGenerating: boolean;
  progress: number;
  currentImage: string | null;
  error: string | null;
  generationTime: number | null;
  metadata: GenerateImageResponse['metadata'] | null;
}

export interface AppSettings {
  apiBaseUrl: string;
  apiKey?: string;
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
  showAdvanced: boolean;
  defaultParams: Partial<GenerationParams>;
}

// History types
export interface GenerationHistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  negativePrompt?: string;
  image: string;
  metadata: GenerateImageResponse['metadata'];
  generationTime: number;
  favorite: boolean;
}

export interface HistoryFilter {
  search: string;
  style?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  favorites: boolean;
}

// Component props types
export interface ImageDisplayProps {
  image: string | null;
  isGenerating: boolean;
  metadata: GenerateImageResponse['metadata'] | null;
  onDownload: () => void;
  onSave: () => void;
}

export interface ParameterControlsProps {
  params: GenerationParams;
  onChange: (params: Partial<GenerationParams>) => void;
  disabled: boolean;
  styles: Record<string, StylePreset>;
}

export interface HistoryPanelProps {
  history: GenerationHistoryItem[];
  filter: HistoryFilter;
  onFilterChange: (filter: Partial<HistoryFilter>) => void;
  onItemSelect: (item: GenerationHistoryItem) => void;
  onItemDelete: (id: string) => void;
  onItemToggleFavorite: (id: string) => void;
}

// Utility types
export type Resolution = {
  width: number;
  height: number;
  label: string;
};

export type Scheduler = {
  value: string;
  label: string;
  description: string;
};

// Constants
export const RESOLUTIONS: Resolution[] = [
  { width: 512, height: 512, label: '512×512 (Square)' },
  { width: 768, height: 768, label: '768×768 (Square HD)' },
  { width: 1024, height: 1024, label: '1024×1024 (Square FHD)' },
  { width: 512, height: 768, label: '512×768 (Portrait)' },
  { width: 768, height: 512, label: '768×512 (Landscape)' },
  { width: 1024, height: 768, label: '1024×768 (Landscape HD)' },
  { width: 768, height: 1024, label: '768×1024 (Portrait HD)' },
];

export const SCHEDULERS: Scheduler[] = [
  { value: 'ddim', label: 'DDIM', description: 'Fast and stable' },
  { value: 'dpm', label: 'DPM++', description: 'High quality, slower' },
  { value: 'euler', label: 'Euler', description: 'Balanced speed/quality' },
  { value: 'euler_a', label: 'Euler A', description: 'Ancestral sampling' },
];

export const DEFAULT_PARAMS: GenerationParams = {
  prompt: '',
  negativePrompt: 'low quality, blurry, distorted',
  width: 512,
  height: 512,
  steps: 20,
  guidanceScale: 7.5,
  seed: null,
  style: '',
  scheduler: 'ddim',
};
