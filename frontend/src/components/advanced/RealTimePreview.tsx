/**
 * Real-Time Preview Component
 * Advanced live preview with progressive generation and interactive controls
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Layers,
  Grid,
  Zap,
  Clock,
  Cpu,
  Activity,
  TrendingUp,
  Gauge,
  Monitor,
  Wifi,
  WifiOff
} from 'lucide-react';
import { GlassCard, AdvancedButton } from '../../design-system';
import { cn } from '../../lib/utils';

interface RealTimePreviewProps {
  prompt: string;
  params: any;
  onImageGenerated: (imageUrl: string) => void;
  className?: string;
}

interface GenerationStep {
  step: number;
  totalSteps: number;
  imageUrl: string;
  timestamp: Date;
  quality: number;
}

interface PerformanceMetrics {
  fps: number;
  latency: number;
  gpuUsage: number;
  memoryUsage: number;
  networkSpeed: number;
}

export const RealTimePreview: React.FC<RealTimePreviewProps> = ({
  prompt,
  params,
  onImageGenerated,
  className
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    latency: 0,
    gpuUsage: 0,
    memoryUsage: 0,
    networkSpeed: 0
  });
  const [isConnected, setIsConnected] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Simulate real-time generation
  useEffect(() => {
    if (isGenerating && prompt) {
      simulateGeneration();
    }
  }, [isGenerating, prompt]);

  // Performance monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        fps: Math.floor(Math.random() * 30) + 30,
        latency: Math.floor(Math.random() * 50) + 10,
        gpuUsage: Math.floor(Math.random() * 40) + 60,
        memoryUsage: Math.floor(Math.random() * 30) + 50,
        networkSpeed: Math.floor(Math.random() * 100) + 50
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const simulateGeneration = async () => {
    const totalSteps = params?.steps || 20;
    setGenerationSteps([]);
    setCurrentStep(0);

    for (let step = 1; step <= totalSteps; step++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const newStep: GenerationStep = {
        step,
        totalSteps,
        imageUrl: `https://picsum.photos/512/512?random=${step}`,
        timestamp: new Date(),
        quality: Math.min(step / totalSteps, 1)
      };

      setGenerationSteps(prev => [...prev, newStep]);
      setCurrentStep(step);

      // Update canvas with progressive image
      updateCanvas(newStep);
    }

    // Final image
    const finalImageUrl = `https://picsum.photos/512/512?random=${Date.now()}`;
    onImageGenerated(finalImageUrl);
  };

  const updateCanvas = (step: GenerationStep) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simulate progressive rendering
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply noise/blur effect for early steps
      const quality = step.quality;
      if (quality < 1) {
        ctx.filter = `blur(${(1 - quality) * 5}px)`;
      } else {
        ctx.filter = 'none';
      }
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = step.imageUrl;
  };

  const startGeneration = () => {
    setIsGenerating(true);
  };

  const pauseGeneration = () => {
    setIsGenerating(false);
  };

  const stopGeneration = () => {
    setIsGenerating(false);
    setCurrentStep(0);
    setGenerationSteps([]);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={cn('relative', className)}>
      <GlassCard className="p-6" variant="elevated">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-white">Real-Time Preview</h3>
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400" />
              )}
              <span className="text-xs text-neutral-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AdvancedButton
              onClick={() => setShowMetrics(!showMetrics)}
              variant="ghost"
              size="sm"
              icon={<Activity className="h-4 w-4" />}
            >
              Metrics
            </AdvancedButton>
            <AdvancedButton
              onClick={toggleFullscreen}
              variant="ghost"
              size="sm"
              icon={isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Performance Metrics */}
        <AnimatePresence>
          {showMetrics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 bg-neutral-900/50 rounded-lg border border-white/10"
            >
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <span className="text-xs text-neutral-400">FPS</span>
                  </div>
                  <div className="text-lg font-semibold text-white">{metrics.fps}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span className="text-xs text-neutral-400">Latency</span>
                  </div>
                  <div className="text-lg font-semibold text-white">{metrics.latency}ms</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Cpu className="h-4 w-4 text-purple-400" />
                    <span className="text-xs text-neutral-400">GPU</span>
                  </div>
                  <div className="text-lg font-semibold text-white">{metrics.gpuUsage}%</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Gauge className="h-4 w-4 text-orange-400" />
                    <span className="text-xs text-neutral-400">Memory</span>
                  </div>
                  <div className="text-lg font-semibold text-white">{metrics.memoryUsage}%</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <span className="text-xs text-neutral-400">Network</span>
                  </div>
                  <div className="text-lg font-semibold text-white">{metrics.networkSpeed} MB/s</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview Canvas */}
        <div className={cn(
          'relative bg-neutral-900/50 rounded-lg overflow-hidden',
          isFullscreen ? 'fixed inset-4 z-50' : 'aspect-square'
        )}>
          <canvas
            ref={canvasRef}
            width={512}
            height={512}
            className="w-full h-full object-contain"
          />

          {/* Generation Progress Overlay */}
          {isGenerating && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 mx-auto mb-4"
                >
                  <Zap className="w-full h-full text-primary-400" />
                </motion.div>
                <div className="text-white font-semibold mb-2">
                  Generating... Step {currentStep} of {params?.steps || 20}
                </div>
                <div className="w-64 bg-neutral-700 rounded-full h-2">
                  <motion.div
                    className="bg-primary-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep / (params?.steps || 20)) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isGenerating && generationSteps.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-neutral-400">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Real-time preview will appear here</p>
                <p className="text-sm">Start generation to see live progress</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            {!isGenerating ? (
              <AdvancedButton
                onClick={startGeneration}
                variant="primary"
                icon={<Play className="h-4 w-4" />}
                disabled={!prompt}
              >
                Start Preview
              </AdvancedButton>
            ) : (
              <AdvancedButton
                onClick={pauseGeneration}
                variant="secondary"
                icon={<Pause className="h-4 w-4" />}
              >
                Pause
              </AdvancedButton>
            )}
            
            <AdvancedButton
              onClick={stopGeneration}
              variant="ghost"
              icon={<Square className="h-4 w-4" />}
              disabled={!isGenerating && generationSteps.length === 0}
            >
              Stop
            </AdvancedButton>

            <AdvancedButton
              onClick={() => {
                stopGeneration();
                setTimeout(startGeneration, 100);
              }}
              variant="ghost"
              icon={<RotateCcw className="h-4 w-4" />}
              disabled={!prompt}
            >
              Restart
            </AdvancedButton>
          </div>

          {/* Generation Info */}
          {isGenerating && (
            <div className="text-sm text-neutral-400">
              Quality: {Math.round((currentStep / (params?.steps || 20)) * 100)}%
            </div>
          )}
        </div>

        {/* Generation Steps Timeline */}
        {generationSteps.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-neutral-300 mb-2">Generation Timeline</h4>
            <div className="flex gap-1 overflow-x-auto pb-2">
              {generationSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-shrink-0 w-12 h-12 bg-neutral-800 rounded border border-white/10 overflow-hidden cursor-pointer hover:border-primary-500/50 transition-colors"
                  onClick={() => updateCanvas(step)}
                >
                  <img
                    src={step.imageUrl}
                    alt={`Step ${step.step}`}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
