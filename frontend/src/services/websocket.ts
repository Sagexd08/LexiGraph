/**
 * WebSocket service for real-time communication
 */

import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../store';
import { GenerateImageResponse } from '../types/api';

export interface WebSocketEvents {
  // Generation events
  'generation:started': (data: { jobId: string; estimatedTime: number }) => void;
  'generation:progress': (data: { jobId: string; progress: number; step: number; totalSteps: number; eta: number }) => void;
  'generation:completed': (data: { jobId: string; result: GenerateImageResponse }) => void;
  'generation:failed': (data: { jobId: string; error: string }) => void;
  'generation:cancelled': (data: { jobId: string }) => void;
  
  // Queue events
  'queue:updated': (data: { queueLength: number; position: number }) => void;
  'queue:processing': (data: { jobId: string; position: number }) => void;
  
  // System events
  'system:status': (data: { isOnline: boolean; modelLoaded: boolean; queueLength: number }) => void;
  'system:metrics': (data: { activeConnections: number; totalGenerations: number; averageTime: number }) => void;
  
  // User events
  'user:notification': (data: { type: string; title: string; message: string }) => void;
  'user:rateLimit': (data: { remaining: number; resetTime: number }) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private eventListeners = new Map<string, Set<Function>>();

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isConnecting || this.socket?.connected) {
      return;
    }

    this.isConnecting = true;
    
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    
    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      maxHttpBufferSize: 1e8, // 100 MB for large image data
    });

    this.setupEventHandlers();
    this.isConnecting = false;
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      
      useAppStore.getState().updateApiState({
        isConnected: true,
        lastPing: Date.now(),
      });

      useAppStore.getState().showNotification({
        type: 'success',
        title: 'Connected',
        message: 'Real-time updates enabled',
        duration: 3000,
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      
      useAppStore.getState().updateApiState({
        isConnected: false,
      });

      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        useAppStore.getState().showNotification({
          type: 'error',
          title: 'Connection Failed',
          message: 'Unable to establish real-time connection. Some features may be limited.',
          duration: 10000,
        });
      }
    });

    // Generation events
    this.socket.on('generation:started', (data) => {
      console.log('Generation started:', data);
      // Update job status in store
    });

    this.socket.on('generation:progress', (data) => {
      console.log('Generation progress:', data);
      useAppStore.getState().updateGenerationProgress(
        data.jobId,
        data.progress,
        data.eta
      );
    });

    this.socket.on('generation:completed', (data) => {
      console.log('Generation completed:', data);
      useAppStore.getState().completeGeneration(data.jobId, data.result);
      
      useAppStore.getState().showNotification({
        type: 'success',
        title: 'Generation Complete',
        message: 'Your image has been generated successfully!',
        duration: 5000,
      });
    });

    this.socket.on('generation:failed', (data) => {
      console.log('Generation failed:', data);
      useAppStore.getState().failGeneration(data.jobId, data.error);
      
      useAppStore.getState().showNotification({
        type: 'error',
        title: 'Generation Failed',
        message: data.error,
        duration: 10000,
      });
    });

    this.socket.on('generation:cancelled', (data) => {
      console.log('Generation cancelled:', data);
      useAppStore.getState().cancelGeneration(data.jobId);
    });

    // Queue events
    this.socket.on('queue:updated', (data) => {
      console.log('Queue updated:', data);
      // Update queue position in UI
    });

    // System events
    this.socket.on('system:status', (data) => {
      useAppStore.getState().updateApiState({
        isConnected: data.isOnline,
        isModelLoaded: data.modelLoaded,
      });
    });

    this.socket.on('system:metrics', (data) => {
      useAppStore.getState().updateApiState({
        metrics: {
          ...useAppStore.getState().api.metrics,
          ...data,
        },
      });
    });

    // User events
    this.socket.on('user:notification', (data) => {
      useAppStore.getState().showNotification({
        type: data.type as any,
        title: data.title,
        message: data.message,
        duration: 5000,
      });
    });

    this.socket.on('user:rateLimit', (data) => {
      useAppStore.getState().showNotification({
        type: 'warning',
        title: 'Rate Limited',
        message: `${data.remaining} requests remaining. Resets in ${Math.ceil(data.resetTime / 1000)}s`,
        duration: 10000,
      });
    });
  }

  // Public methods
  public emit<K extends keyof WebSocketEvents>(event: K, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot emit event:', event);
    }
  }

  public on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  public off<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }

    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }

  public get connected() {
    return this.socket?.connected || false;
  }

  public get id() {
    return this.socket?.id;
  }

  // Join/leave rooms for targeted updates
  public joinRoom(room: string) {
    this.emit('join' as any, { room });
  }

  public leaveRoom(room: string) {
    this.emit('leave' as any, { room });
  }

  // Subscribe to generation updates for specific job
  public subscribeToGeneration(jobId: string) {
    this.joinRoom(`generation:${jobId}`);
  }

  public unsubscribeFromGeneration(jobId: string) {
    this.leaveRoom(`generation:${jobId}`);
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// React hook for WebSocket integration
export function useWebSocket() {
  const isConnected = websocketService.connected;

  return {
    isConnected,
    emit: websocketService.emit.bind(websocketService),
    on: websocketService.on.bind(websocketService),
    off: websocketService.off.bind(websocketService),
    reconnect: websocketService.reconnect.bind(websocketService),
    subscribeToGeneration: websocketService.subscribeToGeneration.bind(websocketService),
    unsubscribeFromGeneration: websocketService.unsubscribeFromGeneration.bind(websocketService),
  };
}
