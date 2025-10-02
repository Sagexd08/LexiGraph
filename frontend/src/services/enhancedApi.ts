import axios, { AxiosInstance, AxiosError, CancelTokenSource } from 'axios';
import {
  GenerateImageRequest,
  GenerateImageResponse,
  ValidationResult,
  VALIDATION_CONSTRAINTS,
} from '../types/api';
import { validateGenerationParams, sanitizeGenerationParams } from '../utils/validation';

export interface RequestQueueItem {
  id: string;
  request: GenerateImageRequest;
  resolve: (value: GenerateImageResponse) => void;
  reject: (error: Error) => void;
  cancelToken: CancelTokenSource;
  priority: number;
  timestamp: number;
}

export interface ProgressCallback {
  (progress: number, step: number, totalSteps: number, estimatedTimeRemaining?: number): void;
}

export interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  queueLength: number;
  isRateLimited: boolean;
  lastError?: string;
}

class EnhancedApiService {
  private client: AxiosInstance;
  private requestQueue: RequestQueueItem[] = [];
  private activeRequests = new Map<string, CancelTokenSource>();
  private isProcessingQueue = false;
  private rateLimitDelay = 0;
  private maxConcurrentRequests = 3;
  private requestMetrics: ApiMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    queueLength: 0,
    isRateLimited: false,
  };

  constructor(baseURL: string = '/api/v1', apiKey?: string) {
    this.client = axios.create({
      baseURL,
      timeout: 300000, // 5 minutes
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    });

    this.setupInterceptors();
    this.startQueueProcessor();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleApiError(error: AxiosError): void {
    this.requestMetrics.failedRequests++;

    if (error.response?.status === 429) {
      // Rate limited
      this.requestMetrics.isRateLimited = true;
      const retryAfter = error.response.headers['retry-after'];
      this.rateLimitDelay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
      
      setTimeout(() => {
        this.requestMetrics.isRateLimited = false;
        this.rateLimitDelay = 0;
      }, this.rateLimitDelay);
    }

    const errorMessage = this.getErrorMessage(error);
    this.requestMetrics.lastError = errorMessage;
    console.error('API Error:', errorMessage);
  }

  private getErrorMessage(error: AxiosError): string {
    if (error.response?.status === 401) {
      return 'Authentication failed. Please check your API key.';
    } else if (error.response?.status === 429) {
      return 'Too many requests. Please wait before trying again.';
    } else if (error.response?.status === 503) {
      return 'Service temporarily unavailable. Please try again later.';
    } else if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as any;
      return data.error?.detail || data.message || 'API request failed';
    } else if (error.code === 'ECONNABORTED') {
      return 'Request timeout. The operation took too long to complete.';
    } else if (error.code === 'NETWORK_ERROR') {
      return 'Network error. Please check your connection.';
    }
    return error.message || 'An unexpected error occurred';
  }

  private startQueueProcessor() {
    setInterval(() => {
      if (!this.isProcessingQueue && this.requestQueue.length > 0 && !this.requestMetrics.isRateLimited) {
        this.processQueue();
      }
    }, 100);
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.activeRequests.size >= this.maxConcurrentRequests) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Sort queue by priority and timestamp
      this.requestQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return a.timestamp - b.timestamp; // Earlier timestamp first
      });

      const item = this.requestQueue.shift();
      if (!item) {
        this.isProcessingQueue = false;
        return;
      }

      this.requestMetrics.queueLength = this.requestQueue.length;
      this.activeRequests.set(item.id, item.cancelToken);

      try {
        const startTime = Date.now();
        const response = await this.client.post<GenerateImageResponse>(
          '/generate',
          item.request,
          { cancelToken: item.cancelToken.token }
        );

        const responseTime = Date.now() - startTime;
        this.updateMetrics(responseTime, true);

        item.resolve(response.data);
      } catch (error) {
        this.updateMetrics(0, false);
        item.reject(error as Error);
      } finally {
        this.activeRequests.delete(item.id);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private updateMetrics(responseTime: number, success: boolean) {
    this.requestMetrics.totalRequests++;
    
    if (success) {
      this.requestMetrics.successfulRequests++;
      // Update average response time
      const totalSuccessful = this.requestMetrics.successfulRequests;
      this.requestMetrics.averageResponseTime = 
        (this.requestMetrics.averageResponseTime * (totalSuccessful - 1) + responseTime) / totalSuccessful;
    }
  }

  public async generateImageWithProgress(
    request: GenerateImageRequest,
    progressCallback?: ProgressCallback,
    priority: number = 1
  ): Promise<GenerateImageResponse> {
    // Validate and sanitize request
    const validationResult = this.validateRequest(request);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    const sanitizedRequest = this.sanitizeRequest(request);

    return new Promise((resolve, reject) => {
      const cancelToken = axios.CancelToken.source();
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const queueItem: RequestQueueItem = {
        id: requestId,
        request: sanitizedRequest,
        resolve: (response) => {
          // Simulate progress updates if callback provided
          if (progressCallback) {
            this.simulateProgress(sanitizedRequest.num_inference_steps || 20, progressCallback);
          }
          resolve(response);
        },
        reject,
        cancelToken,
        priority,
        timestamp: Date.now(),
      };

      this.requestQueue.push(queueItem);
      this.requestMetrics.queueLength = this.requestQueue.length;
    });
  }

  private simulateProgress(totalSteps: number, callback: ProgressCallback) {
    let currentStep = 0;
    const startTime = Date.now();

    const interval = setInterval(() => {
      currentStep++;
      const progress = (currentStep / totalSteps) * 100;
      const elapsed = (Date.now() - startTime) / 1000;
      const estimatedTotal = (elapsed / currentStep) * totalSteps;
      const estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsed);

      callback(progress, currentStep, totalSteps, estimatedTimeRemaining);

      if (currentStep >= totalSteps) {
        clearInterval(interval);
      }
    }, 200); // Update every 200ms
  }

  private validateRequest(request: GenerateImageRequest): ValidationResult {
    // Convert request to GenerationParams format for validation
    const params = {
      prompt: request.prompt,
      negativePrompt: request.negative_prompt || '',
      width: request.width || VALIDATION_CONSTRAINTS.dimensions.min,
      height: request.height || VALIDATION_CONSTRAINTS.dimensions.min,
      steps: request.num_inference_steps || VALIDATION_CONSTRAINTS.steps.min,
      guidanceScale: request.guidance_scale || VALIDATION_CONSTRAINTS.guidanceScale.min,
      seed: request.seed,
      style: request.style || '',
      scheduler: request.scheduler || 'ddim',
    };

    return validateGenerationParams(params);
  }

  private sanitizeRequest(request: GenerateImageRequest): GenerateImageRequest {
    // Convert to GenerationParams, sanitize, then convert back
    const params = {
      prompt: request.prompt,
      negativePrompt: request.negative_prompt || '',
      width: request.width || VALIDATION_CONSTRAINTS.dimensions.min,
      height: request.height || VALIDATION_CONSTRAINTS.dimensions.min,
      steps: request.num_inference_steps || VALIDATION_CONSTRAINTS.steps.min,
      guidanceScale: request.guidance_scale || VALIDATION_CONSTRAINTS.guidanceScale.min,
      seed: request.seed,
      style: request.style || '',
      scheduler: request.scheduler || 'ddim',
    };

    const sanitized = sanitizeGenerationParams(params);

    return {
      prompt: sanitized.prompt,
      negative_prompt: sanitized.negativePrompt,
      width: sanitized.width,
      height: sanitized.height,
      num_inference_steps: sanitized.steps,
      guidance_scale: sanitized.guidanceScale,
      seed: sanitized.seed,
      style: sanitized.style,
      scheduler: sanitized.scheduler,
      use_cache: request.use_cache,
    };
  }

  public cancelRequest(requestId: string): boolean {
    // Cancel from queue
    const queueIndex = this.requestQueue.findIndex(item => item.id === requestId);
    if (queueIndex !== -1) {
      const item = this.requestQueue.splice(queueIndex, 1)[0];
      item.cancelToken.cancel('Request cancelled by user');
      item.reject(new Error('Request cancelled'));
      this.requestMetrics.queueLength = this.requestQueue.length;
      return true;
    }

    // Cancel active request
    const activeRequest = this.activeRequests.get(requestId);
    if (activeRequest) {
      activeRequest.cancel('Request cancelled by user');
      this.activeRequests.delete(requestId);
      return true;
    }

    return false;
  }

  public cancelAllRequests(): void {
    // Cancel all queued requests
    this.requestQueue.forEach(item => {
      item.cancelToken.cancel('All requests cancelled');
      item.reject(new Error('Request cancelled'));
    });
    this.requestQueue = [];

    // Cancel all active requests
    this.activeRequests.forEach(cancelToken => {
      cancelToken.cancel('All requests cancelled');
    });
    this.activeRequests.clear();

    this.requestMetrics.queueLength = 0;
  }

  public getMetrics(): ApiMetrics {
    return { ...this.requestMetrics };
  }

  public setMaxConcurrentRequests(max: number): void {
    this.maxConcurrentRequests = Math.max(1, Math.min(10, max));
  }

  // Legacy method for backward compatibility
  public async generateImage(request: GenerateImageRequest): Promise<GenerateImageResponse> {
    return this.generateImageWithProgress(request);
  }
}

// Create singleton instance
const enhancedApiService = new EnhancedApiService();

export default enhancedApiService;
export { EnhancedApiService };
