/**
 * Performance Monitor Component
 * Real-time system performance monitoring and optimization suggestions
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Zap,
  Thermometer,
  Gauge,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Monitor,
  Server,
  Database,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { GlassCard, AdvancedButton } from '../../design-system';
import { cn } from '../../lib/utils';

interface PerformanceMonitorProps {
  className?: string;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    temperature: number;
    cores: number;
    frequency: number;
  };
  gpu: {
    usage: number;
    memory: number;
    temperature: number;
    vram: number;
  };
  memory: {
    used: number;
    total: number;
    available: number;
  };
  network: {
    download: number;
    upload: number;
    latency: number;
  };
  generation: {
    queueSize: number;
    avgTime: number;
    successRate: number;
    totalGenerated: number;
  };
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  suggestion?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ className }) => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: { usage: 0, temperature: 0, cores: 8, frequency: 3.2 },
    gpu: { usage: 0, memory: 0, temperature: 0, vram: 12 },
    memory: { used: 0, total: 32, available: 0 },
    network: { download: 0, upload: 0, latency: 0 },
    generation: { queueSize: 0, avgTime: 0, successRate: 100, totalGenerated: 0 }
  });

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');
  const [history, setHistory] = useState<SystemMetrics[]>([]);

  // Simulate real-time metrics
  useEffect(() => {
    const interval = setInterval(() => {
      const newMetrics: SystemMetrics = {
        cpu: {
          usage: Math.max(0, Math.min(100, metrics.cpu.usage + (Math.random() - 0.5) * 10)),
          temperature: Math.max(30, Math.min(85, metrics.cpu.temperature + (Math.random() - 0.5) * 5)),
          cores: 8,
          frequency: 3.2 + Math.random() * 0.8
        },
        gpu: {
          usage: Math.max(0, Math.min(100, metrics.gpu.usage + (Math.random() - 0.5) * 15)),
          memory: Math.max(0, Math.min(100, metrics.gpu.memory + (Math.random() - 0.5) * 8)),
          temperature: Math.max(40, Math.min(90, metrics.gpu.temperature + (Math.random() - 0.5) * 6)),
          vram: 12
        },
        memory: {
          used: Math.max(0, Math.min(32, metrics.memory.used + (Math.random() - 0.5) * 2)),
          total: 32,
          available: 32 - metrics.memory.used
        },
        network: {
          download: Math.max(0, Math.random() * 100),
          upload: Math.max(0, Math.random() * 50),
          latency: Math.max(5, Math.min(200, metrics.network.latency + (Math.random() - 0.5) * 20))
        },
        generation: {
          queueSize: Math.max(0, metrics.generation.queueSize + Math.floor((Math.random() - 0.7) * 3)),
          avgTime: Math.max(5, Math.min(60, metrics.generation.avgTime + (Math.random() - 0.5) * 5)),
          successRate: Math.max(85, Math.min(100, metrics.generation.successRate + (Math.random() - 0.5) * 2)),
          totalGenerated: metrics.generation.totalGenerated + (Math.random() > 0.8 ? 1 : 0)
        }
      };

      setMetrics(newMetrics);
      setHistory(prev => [...prev.slice(-29), newMetrics]); // Keep last 30 entries

      // Check for alerts
      checkForAlerts(newMetrics);
    }, 1000);

    return () => clearInterval(interval);
  }, [metrics]);

  const checkForAlerts = (currentMetrics: SystemMetrics) => {
    const newAlerts: PerformanceAlert[] = [];

    // CPU temperature warning
    if (currentMetrics.cpu.temperature > 80) {
      newAlerts.push({
        id: 'cpu-temp',
        type: 'warning',
        title: 'High CPU Temperature',
        message: `CPU temperature is ${currentMetrics.cpu.temperature.toFixed(1)}°C`,
        timestamp: new Date(),
        suggestion: 'Consider reducing generation quality or enabling thermal throttling'
      });
    }

    // GPU memory warning
    if (currentMetrics.gpu.memory > 90) {
      newAlerts.push({
        id: 'gpu-memory',
        type: 'error',
        title: 'GPU Memory Critical',
        message: `GPU memory usage is ${currentMetrics.gpu.memory.toFixed(1)}%`,
        timestamp: new Date(),
        suggestion: 'Reduce batch size or image resolution'
      });
    }

    // Network latency warning
    if (currentMetrics.network.latency > 150) {
      newAlerts.push({
        id: 'network-latency',
        type: 'warning',
        title: 'High Network Latency',
        message: `Network latency is ${currentMetrics.network.latency.toFixed(0)}ms`,
        timestamp: new Date(),
        suggestion: 'Check internet connection or switch to local processing'
      });
    }

    // Update alerts (remove duplicates)
    setAlerts(prev => {
      const existingIds = prev.map(alert => alert.id);
      const filteredNew = newAlerts.filter(alert => !existingIds.includes(alert.id));
      return [...prev.slice(-4), ...filteredNew]; // Keep last 5 alerts
    });
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-400';
    if (value >= thresholds.warning) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getUsageBar = (value: number, max: number, color: string = 'primary') => (
    <div className="w-full bg-neutral-700 rounded-full h-2">
      <motion.div
        className={`h-2 rounded-full bg-${color}-500`}
        initial={{ width: 0 }}
        animate={{ width: `${(value / max) * 100}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );

  const renderMetricCard = (
    title: string,
    value: string,
    icon: React.ReactNode,
    trend?: 'up' | 'down' | 'stable',
    color: string = 'text-white'
  ) => (
    <div className="p-4 bg-neutral-800/30 rounded-lg border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm text-neutral-400">{title}</span>
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-1',
            trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-green-400' : 'text-neutral-400'
          )}>
            {trend === 'up' && <TrendingUp className="h-3 w-3" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3" />}
          </div>
        )}
      </div>
      <div className={cn('text-lg font-semibold', color)}>{value}</div>
    </div>
  );

  return (
    <div className={cn('relative', className)}>
      <GlassCard className="p-6" variant="elevated">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-white">Performance Monitor</h3>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-neutral-400">Live</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AdvancedButton
              onClick={() => setIsExpanded(!isExpanded)}
              variant="ghost"
              size="sm"
              icon={isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </AdvancedButton>
          </div>
        </div>

        {/* Quick Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {renderMetricCard(
            'CPU Usage',
            `${metrics.cpu.usage.toFixed(1)}%`,
            <Cpu className="h-4 w-4 text-blue-400" />,
            metrics.cpu.usage > 80 ? 'up' : 'stable',
            getStatusColor(metrics.cpu.usage, { warning: 70, critical: 90 })
          )}
          
          {renderMetricCard(
            'GPU Usage',
            `${metrics.gpu.usage.toFixed(1)}%`,
            <Monitor className="h-4 w-4 text-purple-400" />,
            metrics.gpu.usage > 85 ? 'up' : 'stable',
            getStatusColor(metrics.gpu.usage, { warning: 80, critical: 95 })
          )}
          
          {renderMetricCard(
            'Memory',
            `${metrics.memory.used.toFixed(1)}GB`,
            <HardDrive className="h-4 w-4 text-green-400" />,
            undefined,
            getStatusColor((metrics.memory.used / metrics.memory.total) * 100, { warning: 80, critical: 95 })
          )}
          
          {renderMetricCard(
            'Queue',
            `${metrics.generation.queueSize}`,
            <Clock className="h-4 w-4 text-orange-400" />,
            metrics.generation.queueSize > 5 ? 'up' : 'stable'
          )}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              Active Alerts
            </h4>
            <div className="space-y-2">
              {alerts.slice(-3).map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    'p-3 rounded-lg border',
                    alert.type === 'error' ? 'bg-red-500/10 border-red-500/30' :
                    alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                    'bg-blue-500/10 border-blue-500/30'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-white text-sm">{alert.title}</div>
                      <div className="text-xs text-neutral-400">{alert.message}</div>
                      {alert.suggestion && (
                        <div className="text-xs text-neutral-500 mt-1">💡 {alert.suggestion}</div>
                      )}
                    </div>
                    <span className="text-xs text-neutral-500">
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Metrics */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {/* System Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-neutral-300">System Resources</h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400">CPU Temperature</span>
                      <span className={getStatusColor(metrics.cpu.temperature, { warning: 75, critical: 85 })}>
                        {metrics.cpu.temperature.toFixed(1)}°C
                      </span>
                    </div>
                    {getUsageBar(metrics.cpu.temperature, 100, 'red')}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400">GPU Memory</span>
                      <span className={getStatusColor(metrics.gpu.memory, { warning: 80, critical: 95 })}>
                        {metrics.gpu.memory.toFixed(1)}%
                      </span>
                    </div>
                    {getUsageBar(metrics.gpu.memory, 100, 'purple')}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400">System Memory</span>
                      <span className="text-white">
                        {metrics.memory.used.toFixed(1)}GB / {metrics.memory.total}GB
                      </span>
                    </div>
                    {getUsageBar(metrics.memory.used, metrics.memory.total, 'green')}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-neutral-300">Generation Stats</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-neutral-800/30 rounded-lg">
                      <div className="text-lg font-semibold text-white">{metrics.generation.avgTime.toFixed(1)}s</div>
                      <div className="text-xs text-neutral-400">Avg Time</div>
                    </div>
                    
                    <div className="text-center p-3 bg-neutral-800/30 rounded-lg">
                      <div className="text-lg font-semibold text-green-400">{metrics.generation.successRate.toFixed(1)}%</div>
                      <div className="text-xs text-neutral-400">Success Rate</div>
                    </div>
                    
                    <div className="text-center p-3 bg-neutral-800/30 rounded-lg">
                      <div className="text-lg font-semibold text-white">{metrics.generation.totalGenerated}</div>
                      <div className="text-xs text-neutral-400">Total Generated</div>
                    </div>
                    
                    <div className="text-center p-3 bg-neutral-800/30 rounded-lg">
                      <div className="text-lg font-semibold text-orange-400">{metrics.network.latency.toFixed(0)}ms</div>
                      <div className="text-xs text-neutral-400">Latency</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optimization Suggestions */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h4 className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Optimization Suggestions
                </h4>
                <ul className="text-sm text-neutral-300 space-y-1">
                  <li>• Consider reducing batch size to improve GPU memory usage</li>
                  <li>• Enable mixed precision training for better performance</li>
                  <li>• Use lower resolution for faster generation times</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
};
