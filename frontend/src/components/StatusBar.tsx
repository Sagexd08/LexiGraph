

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  Cpu,
  Zap,
  Clock,
  Info,
  ChevronUp,
  ChevronDown,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import apiService from '../services/api';
import { SystemInfo, HealthResponse } from '../types/api';

interface StatusBarProps {
  isGenerating: boolean;
  generationTime: number | null;
  generationProgress?: number;
}

interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: number;
  responseTime: number | null;
  modelLoaded: boolean;
  error: string | null;
}

const StatusBar: React.FC<StatusBarProps> = ({
  isGenerating,
  generationTime,
  generationProgress = 0,
}) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    lastChecked: 0,
    responseTime: null,
    modelLoaded: false,
    error: null,
  });
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Check backend health
  const checkHealth = useCallback(async () => {
    const startTime = Date.now();
    try {
      const health = await apiService.getHealth();
      const responseTime = Date.now() - startTime;

      setConnectionStatus({
        isConnected: true,
        lastChecked: Date.now(),
        responseTime,
        modelLoaded: health.model_loaded,
        error: null,
      });
    } catch (error) {
      setConnectionStatus({
        isConnected: false,
        lastChecked: Date.now(),
        responseTime: null,
        modelLoaded: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      });
    }
  }, []);

  // Periodic health checks
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [checkHealth]);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      if (!connectionStatus.isConnected) return;

      try {
        const info = await apiService.getSystemInfo();
        setSystemInfo(info);
        setLastUpdate(Date.now());
      } catch (error) {
        console.error('Failed to fetch system info:', error);
      }
    };

    fetchSystemInfo();
    const interval = setInterval(fetchSystemInfo, 30000);

    return () => clearInterval(interval);
  }, [connectionStatus.isConnected]);

  const formatMemory = (bytes: number) => {
    return `${(bytes).toFixed(1)} GB`;
  };

  const getConnectionStatus = () => {
    if (isGenerating) return {
      text: 'Generating',
      color: 'text-blue-600 dark:text-blue-400',
      icon: <Loader2 className="h-4 w-4 animate-spin" />
    };
    if (!connectionStatus.isConnected) return {
      text: 'Disconnected',
      color: 'text-red-600 dark:text-red-400',
      icon: <WifiOff className="h-4 w-4" />
    };
    if (!connectionStatus.modelLoaded) return {
      text: 'Model Loading',
      color: 'text-yellow-600 dark:text-yellow-400',
      icon: <AlertCircle className="h-4 w-4" />
    };
    return {
      text: 'Connected',
      color: 'text-green-600 dark:text-green-400',
      icon: <CheckCircle className="h-4 w-4" />
    };
  };

  const status = getConnectionStatus();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 z-40">
      {}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {status.icon}
              <span className={`text-sm font-medium ${status.color}`}>
                {status.text}
              </span>
            </div>

            {/* Generation Progress */}
            <AnimatePresence>
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center space-x-2"
                >
                  <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${generationProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(generationProgress)}%
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Response Time */}
            {connectionStatus.isConnected && connectionStatus.responseTime && (
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                <Zap className="h-4 w-4" />
                <span>{connectionStatus.responseTime}ms</span>
              </div>
            )}

            {systemInfo && (
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Cpu className="h-4 w-4" />
                  <span>{systemInfo.device_info.device.toUpperCase()}</span>
                </div>

                {systemInfo.memory_info.gpu_memory && (
                  <div className="flex items-center space-x-1">
                    <Zap className="h-4 w-4" />
                    <span>
                      GPU: {formatMemory(systemInfo.memory_info.gpu_memory.allocated)} / {formatMemory(systemInfo.memory_info.gpu_memory.total)}
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-1">
                  <span>
                    RAM: {formatMemory(systemInfo.memory_info.system_memory.total - systemInfo.memory_info.system_memory.available)} / {formatMemory(systemInfo.memory_info.system_memory.total)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {}
          <div className="flex items-center space-x-4">
            {generationTime && (
              <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Last: {generationTime.toFixed(1)}s</span>
              </div>
            )}

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <Info className="h-4 w-4" />
              <span>Details</span>
              {showDetails ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {}
      <AnimatePresence>
        {showDetails && systemInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                {}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Model
                  </h4>
                  <div className="space-y-1 text-gray-600 dark:text-gray-400">
                    <div>Type: {systemInfo.model_info.model_type}</div>
                    <div>Device: {systemInfo.model_info.device}</div>
                    <div>Scheduler: {systemInfo.model_info.current_scheduler}</div>
                    <div>Loaded: {systemInfo.model_info.is_loaded ? 'Yes' : 'No'}</div>
                  </div>
                </div>

                {}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    System
                  </h4>
                  <div className="space-y-1 text-gray-600 dark:text-gray-400">
                    <div>
                      CPU: {systemInfo.memory_info.system_memory.percent.toFixed(1)}% used
                    </div>
                    <div>
                      RAM: {formatMemory(systemInfo.memory_info.system_memory.total - systemInfo.memory_info.system_memory.available)} / {formatMemory(systemInfo.memory_info.system_memory.total)}
                    </div>
                    {systemInfo.device_info.cuda_available && (
                      <>
                        <div>CUDA: Available</div>
                        <div>GPU: {systemInfo.device_info.cuda_device_name}</div>
                      </>
                    )}
                  </div>
                </div>

                {}
                {systemInfo.memory_info.gpu_memory && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      GPU Memory
                    </h4>
                    <div className="space-y-1 text-gray-600 dark:text-gray-400">
                      <div>
                        Allocated: {formatMemory(systemInfo.memory_info.gpu_memory.allocated)}
                      </div>
                      <div>
                        Cached: {formatMemory(systemInfo.memory_info.gpu_memory.cached)}
                      </div>
                      <div>
                        Total: {formatMemory(systemInfo.memory_info.gpu_memory.total)}
                      </div>
                      <div>
                        Usage: {((systemInfo.memory_info.gpu_memory.allocated / systemInfo.memory_info.gpu_memory.total) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}

                {}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Optimizations
                  </h4>
                  <div className="space-y-1 text-gray-600 dark:text-gray-400">
                    <div>
                      xFormers: {systemInfo.model_info.optimizations.xformers_enabled ? 'Enabled' : 'Disabled'}
                    </div>
                    <div>
                      Attention Slicing: {systemInfo.model_info.optimizations.attention_slicing ? 'Enabled' : 'Disabled'}
                    </div>
                    <div>
                      CPU Offload: {systemInfo.model_info.optimizations.cpu_offload ? 'Enabled' : 'Disabled'}
                    </div>
                    <div>
                      Max Requests: {systemInfo.settings.max_concurrent_requests}
                    </div>
                  </div>
                </div>
              </div>

              {}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
                Last updated: {new Date(lastUpdate).toLocaleTimeString()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatusBar;
