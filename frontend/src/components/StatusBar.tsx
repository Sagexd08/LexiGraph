/**
 * Status Bar Component
 * 
 * Displays connection status, model information, and generation statistics
 * at the bottom of the application.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  Cpu, 
  Zap, 
  Clock, 
  Info,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

import apiService from '../services/api';
import { SystemInfo } from '../types/api';

interface StatusBarProps {
  isConnected: boolean;
  modelLoaded: boolean;
  isGenerating: boolean;
  generationTime: number | null;
}

const StatusBar: React.FC<StatusBarProps> = ({
  isConnected,
  modelLoaded,
  isGenerating,
  generationTime,
}) => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Fetch system info periodically
  useEffect(() => {
    const fetchSystemInfo = async () => {
      if (!isConnected) return;
      
      try {
        const info = await apiService.getSystemInfo();
        setSystemInfo(info);
        setLastUpdate(Date.now());
      } catch (error) {
        console.error('Failed to fetch system info:', error);
      }
    };

    fetchSystemInfo();
    const interval = setInterval(fetchSystemInfo, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected]);

  const formatMemory = (bytes: number) => {
    return `${(bytes).toFixed(1)} GB`;
  };

  const getConnectionStatus = () => {
    if (!isConnected) return { text: 'Disconnected', color: 'text-red-600 dark:text-red-400' };
    if (!modelLoaded) return { text: 'Model Loading', color: 'text-yellow-600 dark:text-yellow-400' };
    if (isGenerating) return { text: 'Generating', color: 'text-blue-600 dark:text-blue-400' };
    return { text: 'Ready', color: 'text-green-600 dark:text-green-400' };
  };

  const status = getConnectionStatus();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 z-40">
      {/* Main Status Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Left Side - Connection Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <span className={`text-sm font-medium ${status.color}`}>
                {status.text}
              </span>
            </div>

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

          {/* Right Side - Generation Info */}
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

      {/* Detailed Information Panel */}
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
                {/* Model Information */}
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

                {/* System Resources */}
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

                {/* GPU Information */}
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

                {/* Optimizations */}
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

              {/* Last Update */}
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
