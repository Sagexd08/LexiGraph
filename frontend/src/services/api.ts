

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

  constructor(baseURL: string = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1', apiKey?: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;

    this.client = axios.create({
      baseURL,
      timeout: 300000,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    });


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


    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError<ApiError>) => {
        console.error('API Response Error:', error);


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


  async generateImage(request: GenerateImageRequest): Promise<GenerateImageResponse> {
    try {
      const response = await this.client.post<GenerateImageResponse>('/generate', request);
      return response.data;
    } catch (error) {
      console.error('Image generation failed:', error);
      throw error;
    }
  }


  async getModelInfo(): Promise<ModelInfo> {
    try {
      const response = await this.client.get<ModelInfo>('/model/info');
      return response.data;
    } catch (error) {
      console.error('Failed to get model info:', error);
      throw error;
    }
  }


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


  async unloadModel(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.post('/model/unload');
      return response.data;
    } catch (error) {
      console.error('Failed to unload model:', error);
      throw error;
    }
  }


  async getSystemInfo(): Promise<SystemInfo> {
    try {
      const response = await this.client.get<SystemInfo>('/system/info');
      return response.data;
    } catch (error) {
      console.error('Failed to get system info:', error);
      throw error;
    }
  }


  async cleanupMemory(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.post('/system/cleanup');
      return response.data;
    } catch (error) {
      console.error('Failed to cleanup memory:', error);
      throw error;
    }
  }


  async getStyles(): Promise<StylesResponse> {
    try {
      const response = await this.client.get<StylesResponse>('/styles');
      return response.data;
    } catch (error) {
      console.error('Failed to get styles:', error);
      throw error;
    }
  }


  async healthCheck(): Promise<HealthResponse> {
    try {
      const response = await this.client.get<HealthResponse>('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }


  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      return false;
    }
  }


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


  downloadImage(imageData: string, filename: string = 'generated-image.png') {
    try {

      const base64Data = imageData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });


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


  async copyImageToClipboard(imageData: string): Promise<void> {
    try {
      if (!navigator.clipboard || !window.ClipboardItem) {
        throw new Error('Clipboard API not supported');
      }


      const base64Data = imageData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });


      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
    } catch (error) {
      console.error('Failed to copy image to clipboard:', error);
      throw new Error('Failed to copy image to clipboard');
    }
  }




  async getCacheStats(): Promise<any> {
    try {
      const response = await this.client.get('/cache/stats');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }


  async clearCache(): Promise<any> {
    try {
      const response = await this.client.post('/cache/clear');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}


const apiService = new ApiService();

export default apiService;
export { ApiService };
