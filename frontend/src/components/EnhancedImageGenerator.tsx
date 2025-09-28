/**
 * Enhanced Image Generator Component
 * 
 * Next-generation image generator with advanced features and modern UI
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2,
  Download,
  Copy,
  Settings,
  History,
  Sparkles,
  AlertCircle,
  Loader2,
  RefreshCw,
  Share,
  Heart,
  Clock,
  Zap,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  X,
  Grid,
  Eye,
  Palette,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

import apiService from '../services/api';
import {
  GenerationParams,
  GenerateImageResponse,
  GenerationHistoryItem,
  StylePreset,
  DEFAULT_PARAMS
} from '../types/api';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Enhanced Components
import PromptBuilder from './PromptBuilder';
import EnhancedParameterControls from './EnhancedParameterControls';
import ImageViewer from './ImageViewer';
import BatchGenerator from './BatchGenerator';
import HistoryPanel from './HistoryPanel';
import StatusBar from './StatusBar';
import { Button, Card, Tooltip, Modal } from './ui';

interface EnhancedImageGeneratorProps {
  className?: string;
}

const EnhancedImageGenerator: React.FC<EnhancedImageGeneratorProps> = ({ className }) => {
  // Core state
  const [params, setParams] = useLocalStorage<GenerationParams>('generation-params', DEFAULT_PARAMS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<GenerateImageResponse['metadata'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  
  // UI state
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'batch' | 'history'>('generate');
  const [styles, setStyles] = useState<Record<string, StylePreset>>({});
  const [history, setHistory] = useLocalStorage<GenerationHistoryItem[]>('generation-history', []);
  
  // Advanced features
  const [comparisonImage, setComparisonImage] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [favoritePrompts, setFavoritePrompts] = useLocalStorage<string[]>('favorite-prompts', []);
  
  const generateButtonRef = useRef<HTMLButtonElement>(null);

  // Load styles on mount
  useEffect(() => {
    const loadStyles = async () => {
      try {
        const response = await apiService.getStyles();
        if (response.success) {
          setStyles(response.styles);
        }
      } catch (error) {
        console.error('Failed to load styles:', error);
      }
    };
    loadStyles();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            if (!isGenerating && params.prompt.trim()) {
              handleGenerate();
            }
            break;
          case 'r':
            e.preventDefault();
            handleRandomSeed();
            break;
          case 'h':
            e.preventDefault();
            setShowHistory(!showHistory);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isGenerating, params.prompt, showHistory]);

  const handleGenerate = useCallback(async (customParams?: GenerationParams) => {
    const generationParams = customParams || params;
    
    if (!generationParams.prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    const startTime = Date.now();

    try {
      const response = await apiService.generateImage({
        prompt: generationParams.prompt,
        negative_prompt: generationParams.negativePrompt,
        width: generationParams.width,
        height: generationParams.height,
        num_inference_steps: generationParams.steps,
        guidance_scale: generationParams.guidanceScale,
        seed: generationParams.seed,
        style: generationParams.style,
        scheduler: generationParams.scheduler,
      });

      if (response.success && response.image) {
        setCurrentImage(response.image);
        setMetadata(response.metadata);
        setGenerationTime(Date.now() - startTime);
        
        // Add to history
        const historyItem: GenerationHistoryItem = {
          id: `gen-${Date.now()}`,
          timestamp: Date.now(),
          prompt: generationParams.prompt,
          negativePrompt: generationParams.negativePrompt,
          image: response.image,
          metadata: response.metadata,
          generationTime: Date.now() - startTime,
          favorite: false
        };
        
        setHistory(prev => [historyItem, ...prev.slice(0, 99)]); // Keep last 100
        toast.success('Image generated successfully!');
      } else {
        throw new Error(response.error || 'Generation failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [params, setHistory]);

  const handleRandomSeed = useCallback(() => {
    setParams(prev => ({
      ...prev,
      seed: Math.floor(Math.random() * 2147483647)
    }));
  }, [setParams]);

  const handleDownload = useCallback(() => {
    if (currentImage) {
      const link = document.createElement('a');
      link.href = currentImage;
      link.download = `lexigraph-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Image downloaded!');
    }
  }, [currentImage]);

  const handleCopy = useCallback(async () => {
    if (currentImage) {
      try {
        const response = await fetch(currentImage);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        toast.success('Image copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy image');
      }
    }
  }, [currentImage]);

  const handleHistorySelect = useCallback((item: GenerationHistoryItem) => {
    setParams({
      prompt: item.prompt,
      negativePrompt: item.negativePrompt || '',
      width: item.metadata.width,
      height: item.metadata.height,
      steps: item.metadata.num_inference_steps,
      guidanceScale: item.metadata.guidance_scale,
      seed: item.metadata.seed || null,
      style: item.metadata.style || '',
      scheduler: item.metadata.scheduler
    });
    setComparisonImage(item.image);
    toast.success('Parameters loaded from history');
  }, [setParams]);

  const toggleFavoritePrompt = useCallback(() => {
    const prompt = params.prompt.trim();
    if (prompt) {
      setFavoritePrompts(prev => 
        prev.includes(prompt) 
          ? prev.filter(p => p !== prompt)
          : [...prev, prompt]
      );
    }
  }, [params.prompt, setFavoritePrompts]);

  return (
    <div className={`max-w-7xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <motion.h1 
          className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          LexiGraph Enhanced
        </motion.h1>
        <p className="text-gray-600 dark:text-gray-400">
          Next-generation AI image generation with advanced features
        </p>
      </div>

      {/* Tab Navigation */}
      <Card className="p-1">
        <div className="flex space-x-1">
          {[
            { id: 'generate', label: 'Generate', icon: Wand2 },
            { id: 'batch', label: 'Batch', icon: Grid },
            { id: 'history', label: 'History', icon: History }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {activeTab === 'generate' && (
          <motion.div
            key="generate"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left Column - Controls */}
            <div className="lg:col-span-1 space-y-6">
              {/* Prompt Builder */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    <span>Prompt</span>
                  </h3>
                  <Tooltip content={favoritePrompts.includes(params.prompt.trim()) ? 'Remove from favorites' : 'Add to favorites'}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFavoritePrompt}
                      icon={<Heart className={`h-4 w-4 ${favoritePrompts.includes(params.prompt.trim()) ? 'fill-current text-red-500' : ''}`} />}
                    />
                  </Tooltip>
                </div>
                
                <PromptBuilder
                  value={params.prompt}
                  onChange={(prompt) => setParams(prev => ({ ...prev, prompt }))}
                  disabled={isGenerating}
                />
              </Card>

              {/* Enhanced Parameter Controls */}
              <EnhancedParameterControls
                params={params}
                onChange={(updates) => setParams(prev => ({ ...prev, ...updates }))}
                disabled={isGenerating}
                styles={styles}
              />

              {/* Generate Button */}
              <Card className="p-6">
                <Button
                  ref={generateButtonRef}
                  onClick={() => handleGenerate()}
                  disabled={isGenerating || !params.prompt.trim()}
                  loading={isGenerating}
                  size="lg"
                  fullWidth
                  icon={<Wand2 className="h-5 w-5" />}
                >
                  {isGenerating ? 'Generating...' : 'Generate Image'}
                </Button>
                
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRandomSeed}
                    disabled={isGenerating}
                    icon={<RefreshCw className="h-4 w-4" />}
                  >
                    Random Seed
                  </Button>
                  
                  <BatchGenerator
                    baseParams={params}
                    onGenerate={handleGenerate}
                    disabled={isGenerating}
                  />
                </div>
              </Card>
            </div>

            {/* Right Column - Image Display */}
            <div className="lg:col-span-2">
              <ImageViewer
                image={currentImage}
                metadata={metadata}
                onDownload={handleDownload}
                onCopy={handleCopy}
                comparisonImage={comparisonImage}
                showComparison={showComparison}
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'batch' && (
          <motion.div
            key="batch"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Batch Generation</h3>
              <BatchGenerator
                baseParams={params}
                onGenerate={handleGenerate}
                disabled={isGenerating}
              />
            </Card>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <HistoryPanel onItemSelect={handleHistorySelect} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
};

export default EnhancedImageGenerator;
