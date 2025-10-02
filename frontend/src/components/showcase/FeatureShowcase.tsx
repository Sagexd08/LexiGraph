/**
 * Feature Showcase Component
 * Demonstrates all advanced features of LexiGraph
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Brain,
  Zap,
  Monitor,
  Activity,
  Layers,
  Target,
  Rocket,
  Star,
  Award,
  Crown,
  Gem,
  ChevronRight,
  Play,
  Code,
  Palette,
  Settings,
  BarChart3,
  Shield,
  Cpu,
  Eye,
  Wand2
} from 'lucide-react';
import { GlassCard, AdvancedButton } from '../../design-system';
import { cn } from '../../lib/utils';

interface FeatureShowcaseProps {
  className?: string;
}

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'ai' | 'performance' | 'ui' | 'professional';
  highlights: string[];
  status: 'implemented' | 'beta' | 'coming-soon';
}

export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({ className }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const features: Feature[] = [
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      description: 'Intelligent prompt enhancement and generation guidance with real-time suggestions',
      icon: <Brain className="h-6 w-6" />,
      category: 'ai',
      highlights: [
        'Smart prompt enhancement',
        'Voice input support',
        'Contextual recommendations',
        'Confidence scoring',
        'Interactive chat interface'
      ],
      status: 'implemented'
    },
    {
      id: 'real-time-preview',
      title: 'Real-Time Preview',
      description: 'Live generation preview with progressive updates and performance monitoring',
      icon: <Monitor className="h-6 w-6" />,
      category: 'performance',
      highlights: [
        'Progressive generation',
        'Live performance metrics',
        'Generation timeline',
        'Interactive controls',
        'Quality tracking'
      ],
      status: 'implemented'
    },
    {
      id: 'neural-visualizer',
      title: 'Neural Network Visualizer',
      description: 'Real-time visualization of AI model processing and network activity',
      icon: <Activity className="h-6 w-6" />,
      category: 'ai',
      highlights: [
        'Live network activity',
        'Interactive node exploration',
        'Layer information',
        'Animation controls',
        'Performance monitoring'
      ],
      status: 'implemented'
    },
    {
      id: 'advanced-controls',
      title: 'Advanced Controls',
      description: 'Professional-grade parameter controls with preset management',
      icon: <Settings className="h-6 w-6" />,
      category: 'professional',
      highlights: [
        '20+ advanced parameters',
        'Collapsible sections',
        'Parameter locking',
        'Preset management',
        'Real-time validation'
      ],
      status: 'implemented'
    },
    {
      id: 'batch-processor',
      title: 'Batch Processing',
      description: 'Professional batch generation with queue management and analytics',
      icon: <Layers className="h-6 w-6" />,
      category: 'professional',
      highlights: [
        'Advanced queue management',
        'Priority system',
        'Progress tracking',
        'Error handling',
        'Batch statistics'
      ],
      status: 'implemented'
    },
    {
      id: 'performance-monitor',
      title: 'Performance Monitor',
      description: 'Real-time system monitoring with optimization suggestions',
      icon: <Cpu className="h-6 w-6" />,
      category: 'performance',
      highlights: [
        'System resource tracking',
        'Real-time alerts',
        'Optimization suggestions',
        'Generation statistics',
        'Historical data'
      ],
      status: 'implemented'
    },
    {
      id: 'glassmorphism-ui',
      title: 'Glassmorphism Design',
      description: 'Modern UI with backdrop blur effects and smooth animations',
      icon: <Palette className="h-6 w-6" />,
      category: 'ui',
      highlights: [
        'Backdrop blur effects',
        'Gradient backgrounds',
        'Smooth animations',
        'Responsive design',
        'Accessibility compliant'
      ],
      status: 'implemented'
    },
    {
      id: 'analytics-dashboard',
      title: 'Analytics Dashboard',
      description: 'Comprehensive data visualization and insights',
      icon: <BarChart3 className="h-6 w-6" />,
      category: 'professional',
      highlights: [
        'Data visualization',
        'Usage analytics',
        'Performance insights',
        'Trend analysis',
        'Export capabilities'
      ],
      status: 'implemented'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Features', icon: <Star className="h-4 w-4" /> },
    { id: 'ai', label: 'AI Features', icon: <Brain className="h-4 w-4" /> },
    { id: 'performance', label: 'Performance', icon: <Zap className="h-4 w-4" /> },
    { id: 'ui', label: 'User Interface', icon: <Eye className="h-4 w-4" /> },
    { id: 'professional', label: 'Professional', icon: <Crown className="h-4 w-4" /> }
  ];

  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(f => f.category === selectedCategory);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'text-green-400';
      case 'beta': return 'text-yellow-400';
      case 'coming-soon': return 'text-blue-400';
      default: return 'text-neutral-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'implemented': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'beta': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'coming-soon': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-neutral-500/20 text-neutral-300 border-neutral-500/30';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20 border border-primary-500/30 rounded-full mb-4"
        >
          <Rocket className="h-5 w-5 text-primary-400" />
          <span className="text-primary-300 font-medium">Advanced Features</span>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-bold text-white mb-4"
        >
          Professional AI Image Generation
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-neutral-400 max-w-3xl mx-auto"
        >
          Experience cutting-edge AI technology with advanced features designed for professional creators and developers
        </motion.p>
      </div>

      {/* Category Filter */}
      <GlassCard className="p-6" variant="elevated">
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((category) => (
            <AdvancedButton
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              variant={selectedCategory === category.id ? 'primary' : 'ghost'}
              size="sm"
              icon={category.icon}
            >
              {category.label}
            </AdvancedButton>
          ))}
        </div>
      </GlassCard>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredFeatures.map((feature, index) => (
            <motion.div
              key={feature.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard 
                className={cn(
                  'p-6 h-full cursor-pointer transition-all duration-300 hover:scale-105',
                  selectedFeature === feature.id && 'ring-2 ring-primary-500'
                )}
                variant="elevated"
                onClick={() => setSelectedFeature(selectedFeature === feature.id ? null : feature.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-500/20 rounded-lg">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                      <span className={cn(
                        'text-xs px-2 py-1 rounded border',
                        getStatusBadge(feature.status)
                      )}>
                        {feature.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={cn(
                    'h-5 w-5 text-neutral-400 transition-transform',
                    selectedFeature === feature.id && 'rotate-90'
                  )} />
                </div>

                <p className="text-neutral-400 mb-4">{feature.description}</p>

                <AnimatePresence>
                  {selectedFeature === feature.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <h4 className="text-sm font-medium text-white mb-2">Key Features:</h4>
                      {feature.highlights.map((highlight, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center gap-2 text-sm text-neutral-300"
                        >
                          <div className="w-1.5 h-1.5 bg-primary-400 rounded-full" />
                          {highlight}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Statistics */}
      <GlassCard className="p-6" variant="elevated">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-400 mb-2">8+</div>
            <div className="text-sm text-neutral-400">Advanced Features</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">100%</div>
            <div className="text-sm text-neutral-400">Implemented</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">95+</div>
            <div className="text-sm text-neutral-400">Performance Score</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">AA</div>
            <div className="text-sm text-neutral-400">Accessibility</div>
          </div>
        </div>
      </GlassCard>

      {/* Call to Action */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-white">Ready to Create?</h2>
          <p className="text-neutral-400">
            Experience the future of AI image generation with LexiGraph's advanced features
          </p>
          <div className="flex gap-4 justify-center">
            <AdvancedButton
              variant="primary"
              size="lg"
              icon={<Play className="h-5 w-5" />}
            >
              Start Generating
            </AdvancedButton>
            <AdvancedButton
              variant="ghost"
              size="lg"
              icon={<Code className="h-5 w-5" />}
            >
              View Documentation
            </AdvancedButton>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
