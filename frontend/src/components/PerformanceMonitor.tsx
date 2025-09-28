/**
 * Performance Monitor Component
 * 
 * Track and display performance metrics for image generation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Clock, 
  Zap, 
  TrendingUp, 
  BarChart3,
  Cpu,
  HardDrive,
  Wifi,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, Button, Tooltip } from './ui';

interface PerformanceMetrics {
  generationTime: number;
  timestamp: number;
  parameters: {
    steps: number;
    resolution: string;
    guidanceScale: number;
  };
  success: boolean;
}

interface SystemMetrics {
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  timestamp: number;
}

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  className?: string;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  onMetricsUpdate, 
  className 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Add new performance metric
  const addMetric = useCallback((metric: PerformanceMetrics) => {
    setMetrics(prev => [metric, ...prev.slice(0, 99)]); // Keep last 100 metrics
    onMetricsUpdate?.(metric);
  }, [onMetricsUpdate]);

  // Monitor system performance
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(async () => {
      try {
        // Simulate system metrics (in a real app, these would come from actual APIs)
        const memoryInfo = (performance as any).memory;
        const networkStart = performance.now();
        
        // Simple network latency test
        await fetch('/api/v1/health', { method: 'HEAD' }).catch(() => {});
        const networkLatency = performance.now() - networkStart;

        const newSystemMetrics: SystemMetrics = {
          memoryUsage: memoryInfo ? (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100 : 0,
          cpuUsage: Math.random() * 30 + 10, // Simulated CPU usage
          networkLatency,
          timestamp: Date.now()
        };

        setSystemMetrics(newSystemMetrics);
      } catch (error) {
        console.error('Failed to collect system metrics:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  // Calculate performance statistics
  const stats = React.useMemo(() => {
    if (metrics.length === 0) return null;

    const successfulMetrics = metrics.filter(m => m.success);
    const times = successfulMetrics.map(m => m.generationTime);
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const successRate = (successfulMetrics.length / metrics.length) * 100;

    // Performance trend (last 10 vs previous 10)
    const recent = times.slice(0, 10);
    const previous = times.slice(10, 20);
    const recentAvg = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    const previousAvg = previous.length > 0 ? previous.reduce((a, b) => a + b, 0) / previous.length : 0;
    const trend = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

    return {
      avgTime: Math.round(avgTime),
      minTime: Math.round(minTime),
      maxTime: Math.round(maxTime),
      successRate: Math.round(successRate),
      trend: Math.round(trend * 10) / 10,
      totalGenerations: metrics.length
    };
  }, [metrics]);

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className={`transition-all duration-300 ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Performance Monitor
            </h3>
            {stats && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({stats.totalGenerations} generations)
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Tooltip content={isMonitoring ? 'Stop monitoring' : 'Start monitoring'}>
              <Button
                variant={isMonitoring ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setIsMonitoring(!isMonitoring)}
                icon={<Activity className="h-4 w-4" />}
              />
            </Tooltip>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              icon={isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{formatTime(stats.avgTime)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Avg Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.successRate}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Success Rate</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${stats.trend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.trend > 0 ? '+' : ''}{stats.trend}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Trend</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatTime(stats.minTime)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Best Time</div>
            </div>
          </div>
        )}

        {/* Expanded View */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 space-y-6"
            >
              {/* System Metrics */}
              {systemMetrics && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center space-x-2">
                    <Cpu className="h-4 w-4" />
                    <span>System Metrics</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Memory</span>
                        <HardDrive className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="text-lg font-semibold mt-1">
                        {systemMetrics.memoryUsage.toFixed(1)}%
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${systemMetrics.memoryUsage}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">CPU</span>
                        <Cpu className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="text-lg font-semibold mt-1">
                        {systemMetrics.cpuUsage.toFixed(1)}%
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${systemMetrics.cpuUsage}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Network</span>
                        <Wifi className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="text-lg font-semibold mt-1">
                        {formatTime(systemMetrics.networkLatency)}
                      </div>
                      <div className={`text-xs mt-1 ${
                        systemMetrics.networkLatency < 100 ? 'text-green-600' :
                        systemMetrics.networkLatency < 300 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {systemMetrics.networkLatency < 100 ? 'Excellent' :
                         systemMetrics.networkLatency < 300 ? 'Good' : 'Poor'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Generations */}
              {metrics.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Recent Generations</span>
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {metrics.slice(0, 10).map((metric, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            metric.success ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="text-sm">
                            {metric.parameters.resolution} • {metric.parameters.steps} steps
                          </span>
                        </div>
                        <div className="text-sm font-medium">
                          {formatTime(metric.generationTime)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance Tips */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Performance Tips</span>
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Lower step counts (15-20) for faster generation</li>
                  <li>• Smaller resolutions (512x512) process quicker</li>
                  <li>• Guidance scale 7-8 offers best speed/quality balance</li>
                  <li>• Close other browser tabs to free up memory</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};

// Hook for tracking performance metrics
export const usePerformanceTracking = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);

  const trackGeneration = useCallback((
    startTime: number,
    endTime: number,
    parameters: PerformanceMetrics['parameters'],
    success: boolean
  ) => {
    const metric: PerformanceMetrics = {
      generationTime: endTime - startTime,
      timestamp: endTime,
      parameters,
      success
    };
    
    setMetrics(prev => [metric, ...prev.slice(0, 99)]);
    return metric;
  }, []);

  return {
    metrics,
    trackGeneration
  };
};

export default PerformanceMonitor;
