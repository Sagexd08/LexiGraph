
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Cpu,
  Zap,
  Activity,
  Layers,
  Network,
  Eye,
  EyeOff,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Info,
  TrendingUp,
  Gauge,
  Monitor
} from 'lucide-react';
import { GlassCard, AdvancedButton } from '../../design-system';
import { cn } from '../../lib/utils';

interface NeuralNetworkVisualizerProps {
  isActive: boolean;
  generationStep: number;
  totalSteps: number;
  className?: string;
}

interface NetworkNode {
  id: string;
  x: number;
  y: number;
  layer: number;
  activation: number;
  type: 'input' | 'hidden' | 'output';
}

interface NetworkConnection {
  from: string;
  to: string;
  weight: number;
  active: boolean;
}

interface LayerInfo {
  name: string;
  nodeCount: number;
  activationFunction: string;
  description: string;
}

export const NeuralNetworkVisualizer: React.FC<NeuralNetworkVisualizerProps> = ({
  isActive,
  generationStep,
  totalSteps,
  className
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const layers: LayerInfo[] = [
    { name: 'Text Encoder', nodeCount: 768, activationFunction: 'GELU', description: 'Processes text prompts into embeddings' },
    { name: 'Cross Attention', nodeCount: 1024, activationFunction: 'Softmax', description: 'Aligns text and image features' },
    { name: 'U-Net Encoder', nodeCount: 512, activationFunction: 'SiLU', description: 'Encodes spatial features' },
    { name: 'Latent Space', nodeCount: 64, activationFunction: 'Linear', description: 'Compressed representation' },
    { name: 'U-Net Decoder', nodeCount: 512, activationFunction: 'SiLU', description: 'Decodes spatial features' },
    { name: 'VAE Decoder', nodeCount: 256, activationFunction: 'ReLU', description: 'Converts to pixel space' }
  ];

  // Initialize network structure
  useEffect(() => {
    initializeNetwork();
  }, []);

  // Animate network activity
  useEffect(() => {
    if (isActive && isVisible) {
      startAnimation();
    } else {
      stopAnimation();
    }

    return () => stopAnimation();
  }, [isActive, isVisible, animationSpeed]);

  // Update network activity based on generation progress
  useEffect(() => {
    if (isActive) {
      updateNetworkActivity();
    }
  }, [generationStep, totalSteps]);

  const initializeNetwork = () => {
    const newNodes: NetworkNode[] = [];
    const newConnections: NetworkConnection[] = [];
    
    // Create nodes for each layer
    layers.forEach((layer, layerIndex) => {
      const nodesInLayer = Math.min(layer.nodeCount, 12); // Limit visual nodes
      const layerX = (layerIndex / (layers.length - 1)) * 800;
      
      for (let i = 0; i < nodesInLayer; i++) {
        const nodeY = (i / (nodesInLayer - 1)) * 400;
        newNodes.push({
          id: `${layerIndex}-${i}`,
          x: layerX,
          y: nodeY,
          layer: layerIndex,
          activation: Math.random(),
          type: layerIndex === 0 ? 'input' : layerIndex === layers.length - 1 ? 'output' : 'hidden'
        });
      }
    });

    // Create connections between adjacent layers
    for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex++) {
      const currentLayerNodes = newNodes.filter(n => n.layer === layerIndex);
      const nextLayerNodes = newNodes.filter(n => n.layer === layerIndex + 1);
      
      currentLayerNodes.forEach(fromNode => {
        nextLayerNodes.forEach(toNode => {
          if (Math.random() > 0.7) { // Sparse connections for visualization
            newConnections.push({
              from: fromNode.id,
              to: toNode.id,
              weight: (Math.random() - 0.5) * 2,
              active: false
            });
          }
        });
      });
    }

    setNodes(newNodes);
    setConnections(newConnections);
  };

  const updateNetworkActivity = () => {
    const progress = generationStep / totalSteps;
    
    setNodes(prev => prev.map(node => ({
      ...node,
      activation: Math.sin(Date.now() * 0.001 + node.layer * 0.5 + progress * Math.PI) * 0.5 + 0.5
    })));

    setConnections(prev => prev.map(connection => ({
      ...connection,
      active: Math.random() > 0.6,
      weight: connection.weight * (0.5 + Math.random() * 0.5)
    })));
  };

  const startAnimation = () => {
    const animate = () => {
      updateNetworkActivity();
      drawNetwork();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const drawNetwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    connections.forEach(connection => {
      const fromNode = nodes.find(n => n.id === connection.from);
      const toNode = nodes.find(n => n.id === connection.to);
      
      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        
        const opacity = connection.active ? 0.8 : 0.2;
        const weight = Math.abs(connection.weight);
        ctx.strokeStyle = connection.weight > 0 
          ? `rgba(59, 130, 246, ${opacity})` 
          : `rgba(239, 68, 68, ${opacity})`;
        ctx.lineWidth = weight * 2 + 0.5;
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 8 + node.activation * 4, 0, 2 * Math.PI);
      
      const intensity = node.activation;
      ctx.fillStyle = node.type === 'input' 
        ? `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`
        : node.type === 'output'
        ? `rgba(168, 85, 247, ${0.3 + intensity * 0.7})`
        : `rgba(59, 130, 246, ${0.3 + intensity * 0.7})`;
      
      ctx.fill();
      
      // Highlight selected node
      if (selectedNode === node.id) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  };

  const handleNodeClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= 12;
    });

    setSelectedNode(clickedNode ? clickedNode.id : null);
  };

  return (
    <div className={cn('relative', className)}>
      <GlassCard className="p-6" variant="elevated">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-white">Neural Network</h3>
            <div className="flex items-center gap-1">
              <Activity className="h-4 w-4 text-green-400" />
              <span className="text-xs text-neutral-400">
                {isActive ? 'Processing' : 'Idle'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AdvancedButton
              onClick={() => setShowDetails(!showDetails)}
              variant="ghost"
              size="sm"
              icon={<Info className="h-4 w-4" />}
            >
              Details
            </AdvancedButton>
            
            <AdvancedButton
              onClick={() => setIsVisible(!isVisible)}
              variant="ghost"
              size="sm"
              icon={isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            >
              {isVisible ? 'Hide' : 'Show'}
            </AdvancedButton>
          </div>
        </div>

        {/* Progress Bar */}
        {isActive && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-neutral-400 mb-2">
              <span>Generation Progress</span>
              <span>{generationStep}/{totalSteps} steps</span>
            </div>
            <div className="w-full bg-neutral-700 rounded-full h-2">
              <motion.div
                className="bg-primary-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(generationStep / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Network Visualization */}
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative bg-neutral-900/50 rounded-lg overflow-hidden"
            >
              <canvas
                ref={canvasRef}
                width={800}
                height={400}
                onClick={handleNodeClick}
                className="w-full h-auto cursor-pointer"
              />

              {/* Layer Labels */}
              <div className="absolute top-2 left-2 right-2 flex justify-between">
                {layers.map((layer, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs font-medium text-white bg-neutral-800/80 px-2 py-1 rounded">
                      {layer.name}
                    </div>
                  </div>
                ))}
              </div>

              {/* Node Details */}
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute bottom-4 left-4 bg-neutral-800/90 p-3 rounded-lg border border-white/20"
                >
                  <div className="text-sm">
                    <div className="font-medium text-white mb-1">Node {selectedNode}</div>
                    <div className="text-neutral-400">
                      Activation: {nodes.find(n => n.id === selectedNode)?.activation.toFixed(3)}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Layer Details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3"
            >
              {layers.map((layer, index) => (
                <div key={index} className="p-3 bg-neutral-800/30 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{layer.name}</h4>
                    <span className="text-xs text-neutral-400">{layer.nodeCount} nodes</span>
                  </div>
                  <p className="text-sm text-neutral-400 mb-2">{layer.description}</p>
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span>Activation: {layer.activationFunction}</span>
                    <span>Layer {index + 1}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-400">Animation Speed:</span>
            <input
              type="range"
              min={0.1}
              max={3}
              step={0.1}
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
              className="w-20 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-sm text-neutral-400">{animationSpeed}x</span>
          </div>

          <div className="flex items-center gap-2">
            <AdvancedButton
              onClick={initializeNetwork}
              variant="ghost"
              size="sm"
              icon={<RotateCcw className="h-4 w-4" />}
            >
              Reset
            </AdvancedButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
