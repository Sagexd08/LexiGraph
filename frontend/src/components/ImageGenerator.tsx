/**
 * Main Image Generator Component
 * 
 * The core component that handles image generation with a modern, responsive UI.
 * Features prompt input, parameter controls, image display, and generation history.
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

import apiService from '../services/api';
import { 
  GenerationParams, 
  GenerationState, 
  StylePreset,
  DEFAULT_PARAMS,
  RESOLUTIONS,
  SCHEDULERS
} from '../types/api';
import { useLocalStorage } from '../hooks/useLocalStorage';
// Import components (will be created)
// import ParameterControls from './ParameterControls';
// import ImageDisplay from './ImageDisplay';
// import HistoryPanel from './HistoryPanel';
// import StatusBar from './StatusBar';

const ImageGenerator: React.FC = () => {
  // State management
  const [params, setParams] = useLocalStorage<GenerationParams>('generation-params', DEFAULT_PARAMS);
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    currentImage: null,
    error: null,
    generationTime: null,
    metadata: null,
  });
  
  const [styles, setStyles] = useState<Record<string, StylePreset>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);

  // Load styles and check connection on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check API connection
        const status = await apiService.getStatus();
        setIsConnected(status.connected);
        setModelLoaded(status.modelLoaded);

        if (status.connected) {
          // Load available styles
          const stylesResponse = await apiService.getStyles();
          setStyles(stylesResponse.styles);
          toast.success('Connected to Lexigraph API');
        } else {
          toast.error('Failed to connect to API');
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        toast.error('Failed to initialize application');
      }
    };

    initializeApp();
  }, []);

  // Handle parameter changes
  const handleParamsChange = useCallback((newParams: Partial<GenerationParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, [setParams]);

  // Generate random seed
  const generateRandomSeed = useCallback(() => {
    const seed = Math.floor(Math.random() * 2147483647);
    handleParamsChange({ seed });
  }, [handleParamsChange]);

  // Main image generation function
  const generateImage = useCallback(async () => {
    if (!isConnected) {
      toast.error('Not connected to API');
      return;
    }

    if (!params.prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setGenerationState(prev => ({
      ...prev,
      isGenerating: true,
      progress: 0,
      error: null,
    }));

    try {
      // Prepare request
      const request = {
        prompt: params.prompt,
        negative_prompt: params.negativePrompt || undefined,
        width: params.width,
        height: params.height,
        num_inference_steps: params.steps,
        guidance_scale: params.guidanceScale,
        seed: params.seed || undefined,
        style: params.style || undefined,
        scheduler: params.scheduler,
      };

      // Generate image
      const response = await apiService.generateImage(request);

      if (response.success && response.image) {
        setGenerationState(prev => ({
          ...prev,
          isGenerating: false,
          currentImage: response.image!,
          metadata: response.metadata,
          generationTime: response.generation_time || null,
          error: null,
        }));

        toast.success(`Image generated in ${response.generation_time?.toFixed(1)}s`);
      } else {
        throw new Error(response.error || 'Generation failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
    }
  }, [isConnected, params]);

  // Download current image
  const downloadImage = useCallback(() => {
    if (!generationState.currentImage) return;

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `lexigraph-${timestamp}.png`;
      apiService.downloadImage(generationState.currentImage, filename);
      toast.success('Image downloaded');
    } catch (error) {
      toast.error('Failed to download image');
    }
  }, [generationState.currentImage]);

  // Copy image to clipboard
  const copyImage = useCallback(async () => {
    if (!generationState.currentImage) return;

    try {
      await apiService.copyImageToClipboard(generationState.currentImage);
      toast.success('Image copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy image');
    }
  }, [generationState.currentImage]);

  // Retry connection
  const retryConnection = useCallback(async () => {
    try {
      const status = await apiService.getStatus();
      setIsConnected(status.connected);
      setModelLoaded(status.modelLoaded);
      
      if (status.connected) {
        const stylesResponse = await apiService.getStyles();
        setStyles(stylesResponse.styles);
        toast.success('Reconnected to API');
      }
    } catch (error) {
      toast.error('Still unable to connect');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Sparkles className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Lexigraph
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`p-2 rounded-lg transition-colors ${
                  showAdvanced 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                title="Advanced Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-lg transition-colors ${
                  showHistory 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                title="Generation History"
              >
                <History className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="text-red-800 dark:text-red-200">
                  Not connected to Lexigraph API
                </span>
              </div>
              <button
                onClick={retryConnection}
                className="flex items-center space-x-2 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Prompt Input */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Prompt
              </label>
              <textarea
                value={params.prompt}
                onChange={(e) => handleParamsChange({ prompt: e.target.value })}
                placeholder="Describe the image you want to generate..."
                className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                disabled={generationState.isGenerating}
              />
              
              {/* Style Selector */}
              {Object.keys(styles).length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Style
                  </label>
                  <select
                    value={params.style}
                    onChange={(e) => handleParamsChange({ style: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={generationState.isGenerating}
                  >
                    <option value="">No style</option>
                    {Object.entries(styles).map(([key, style]) => (
                      <option key={key} value={key}>
                        {style.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Parameter Controls */}
            <ParameterControls
              params={params}
              onChange={handleParamsChange}
              disabled={generationState.isGenerating}
              showAdvanced={showAdvanced}
              onRandomSeed={generateRandomSeed}
            />

            {/* Generate Button */}
            <motion.button
              onClick={generateImage}
              disabled={generationState.isGenerating || !isConnected || !params.prompt.trim()}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg disabled:shadow-none transition-all duration-200 flex items-center justify-center space-x-3"
              whileHover={{ scale: generationState.isGenerating ? 1 : 1.02 }}
              whileTap={{ scale: generationState.isGenerating ? 1 : 0.98 }}
            >
              {generationState.isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  <span>Generate Image</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Center Panel - Image Display */}
          <div className="lg:col-span-2">
            <ImageDisplay
              image={generationState.currentImage}
              isGenerating={generationState.isGenerating}
              error={generationState.error}
              metadata={generationState.metadata}
              onDownload={downloadImage}
              onCopy={copyImage}
            />
          </div>
        </div>

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8"
            >
              <HistoryPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Status Bar */}
      <StatusBar
        isConnected={isConnected}
        modelLoaded={modelLoaded}
        isGenerating={generationState.isGenerating}
        generationTime={generationState.generationTime}
      />
    </div>
  );
};

export default ImageGenerator;
