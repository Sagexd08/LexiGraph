/**
 * API service for Lexigraph frontend
 * Handles all communication with the backend API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  GenerateImageRequest,
  GenerateImageResponse,
  ModelInfo,
  SystemInfo,
  StylesResponse,
  HealthResponse,
  ApiError,
} from '../types/api';

class ApiService {
  private client: AxiosInstance;
  private baseURL: string;
  private apiKey?: string;

  constructor(baseURL: string = '/api/v1', apiKey?: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;

    this.client = axios.create({
      baseURL,
      timeout: 300000, // 5 minutes for image generation
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    });

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
      (error: AxiosError<ApiError>) => {
        console.error('API Response Error:', error);
        
        // Handle specific error cases
        if (error.response?.status === 401) {
          throw new Error('Authentication failed. Please check your API key.');
        } else if (error.response?.status === 429) {
          throw new Error('Too many requests. Please wait before trying again.');
        } else if (error.response?.status === 503) {
          throw new Error('Service temporarily unavailable. Please try again later.');
        } else if (error.response?.data?.error) {
          throw new Error(error.response.data.error.detail || 'API request failed');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. The operation took too long to complete.');
        } else if (error.code === 'NETWORK_ERROR') {
          throw new Error('Network error. Please check your connection.');
        }
        
        throw new Error(error.message || 'An unexpected error occurred');
      }
    );
  }

  /**
   * Update API configuration
   */
  updateConfig(baseURL?: string, apiKey?: string) {
    if (baseURL) {
      this.baseURL = baseURL;
      this.client.defaults.baseURL = baseURL;
    }
    
    if (apiKey !== undefined) {
      this.apiKey = apiKey;
      if (apiKey) {
        this.client.defaults.headers['X-API-Key'] = apiKey;
      } else {
        delete this.client.defaults.headers['X-API-Key'];
      }
    }
  }

  /**
   * Generate an image from a text prompt
   */
  async generateImage(request: GenerateImageRequest): Promise<GenerateImageResponse> {
    try {
      const response = await this.client.post<GenerateImageResponse>('/generate', request);
      return response.data;
    } catch (error) {
      console.error('Image generation failed:', error);
      throw error;
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(): Promise<ModelInfo> {
    try {
      const response = await this.client.get<ModelInfo>('/model/info');
      return response.data;
    } catch (error) {
      console.error('Failed to get model info:', error);
      throw error;
    }
  }

  /**
   * Load model
   */
  async loadModel(modelPath?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.post('/model/load', 
        modelPath ? { model_path: modelPath } : {}
      );
      return response.data;
    } catch (error) {
      console.error('Failed to load model:', error);
      throw error;
    }
  }

  /**
   * Unload model
   */
  async unloadModel(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.post('/model/unload');
      return response.data;
    } catch (error) {
      console.error('Failed to unload model:', error);
      throw error;
    }
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<SystemInfo> {
    try {
      const response = await this.client.get<SystemInfo>('/system/info');
      return response.data;
    } catch (error) {
      console.error('Failed to get system info:', error);
      throw error;
    }
  }

  /**
   * Clean up system memory
   */
  async cleanupMemory(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.post('/system/cleanup');
      return response.data;
    } catch (error) {
      console.error('Failed to cleanup memory:', error);
      throw error;
    }
  }

  /**
   * Get available style presets
   */
  async getStyles(): Promise<StylesResponse> {
    try {
      const response = await this.client.get<StylesResponse>('/styles');
      return response.data;
    } catch (error) {
      console.error('Failed to get styles:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<HealthResponse> {
    try {
      const response = await this.client.get<HealthResponse>('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get API status with detailed information
   */
  async getStatus(): Promise<{
    connected: boolean;
    modelLoaded: boolean;
    systemInfo?: SystemInfo;
    error?: string;
  }> {
    try {
      const [health, systemInfo] = await Promise.all([
        this.healthCheck(),
        this.getSystemInfo().catch(() => null),
      ]);

      return {
        connected: true,
        modelLoaded: health.model_loaded,
        systemInfo: systemInfo || undefined,
      };
    } catch (error) {
      return {
        connected: false,
        modelLoaded: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Download image from base64 data
   */
  downloadImage(imageData: string, filename: string = 'generated-image.png') {
    try {
      // Extract base64 data
      const base64Data = imageData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
      throw new Error('Failed to download image');
    }
  }

  /**
   * Copy image to clipboard
   */
  async copyImageToClipboard(imageData: string): Promise<void> {
    try {
      if (!navigator.clipboard || !window.ClipboardItem) {
        throw new Error('Clipboard API not supported');
      }

      // Extract base64 data and convert to blob
      const base64Data = imageData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
    } catch (error) {
      console.error('Failed to copy image to clipboard:', error);
      throw new Error('Failed to copy image to clipboard');
    }
  }
}

// Create and export singleton instance
const apiService = new ApiService();

export default apiService;
export { ApiService };
