import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Card } from '../ui';
import EnhancedImageGenerator from './EnhancedImageGenerator';
import { GenerationParams, DEFAULT_PARAMS } from '../../types/api';
import ErrorBoundary from '../common/ErrorBoundary';
import { cn } from '../../utils/cn';

/**
 * Integration Example Component
 * 
 * This component demonstrates how to integrate all the enhanced LexiGraph components
 * together in a real-world application. It showcases:
 * 
 * - Enhanced Image Generator with all features
 * - Error boundary for robust error handling
 * - Responsive layout with tabs for different modes
 * - State management between components
 * - Accessibility features and keyboard navigation
 * 
 * @example
 * ```tsx
 * import IntegrationExample from './enhanced/IntegrationExample';
 * 
 * function App() {
 *   return (
 *     <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
 *       <IntegrationExample />
 *     </div>
 *   );
 * }
 * ```
 */

interface IntegrationExampleProps {
  className?: string;
}

const IntegrationExample: React.FC<IntegrationExampleProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState('single');
  const [generationHistory, setGenerationHistory] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [currentParams, setCurrentParams] = useState<GenerationParams>(DEFAULT_PARAMS);

  // Handle successful image generation
  const handleImageGenerated = useCallback((image: string, metadata: any) => {
    const newItem = {
      id: `img_${Date.now()}`,
      image,
      metadata,
      timestamp: Date.now(),
      isFavorite: false,
      params: { ...currentParams },
    };

    setGenerationHistory(prev => [newItem, ...prev.slice(0, 49)]); // Keep last 50
    
    // Show success notification (implement toast system)
    console.log('Image generated successfully:', newItem);
  }, [currentParams]);

  // Handle generation errors
  const handleGenerationError = useCallback((error: string) => {
    console.error('Generation error:', error);
    // Show error notification (implement toast system)
  }, []);

  // Handle adding to favorites
  const handleAddToFavorites = useCallback((imageId: string) => {
    const item = generationHistory.find(img => img.id === imageId);
    if (item && !favorites.find(fav => fav.id === imageId)) {
      setFavorites(prev => [{ ...item, isFavorite: true }, ...prev]);
      setGenerationHistory(prev =>
        prev.map(img =>
          img.id === imageId ? { ...img, isFavorite: true } : img
        )
      );
    }
  }, [generationHistory, favorites]);

  // Handle removing from favorites
  const handleRemoveFromFavorites = useCallback((imageId: string) => {
    setFavorites(prev => prev.filter(fav => fav.id !== imageId));
    setGenerationHistory(prev =>
      prev.map(img =>
        img.id === imageId ? { ...img, isFavorite: false } : img
      )
    );
  }, []);

  // Handle loading parameters from history
  const handleLoadFromHistory = useCallback((item: any) => {
    setCurrentParams(item.params);
    setActiveTab('single'); // Switch to generation tab
  }, []);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Application error:', error, errorInfo);
        // Report to error tracking service
      }}
      showDetails={process.env.NODE_ENV === 'development'}
      enableReporting={process.env.NODE_ENV === 'production'}
    >
      <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900', className)}>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              LexiGraph Enhanced
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Experience the next generation of AI image generation with advanced controls,
              real-time progress tracking, and comprehensive error handling.
            </p>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="single" className="flex items-center space-x-2">
                  <span>Single Generation</span>
                </TabsTrigger>
                <TabsTrigger value="batch" className="flex items-center space-x-2">
                  <span>Batch Generation</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center space-x-2">
                  <span>History ({generationHistory.length})</span>
                </TabsTrigger>
                <TabsTrigger value="favorites" className="flex items-center space-x-2">
                  <span>Favorites ({favorites.length})</span>
                </TabsTrigger>
              </TabsList>

              {/* Single Generation Tab */}
              <TabsContent value="single" className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                    Generate Single Image
                  </h2>
                  <EnhancedImageGenerator
                    onImageGenerated={handleImageGenerated}
                    onError={handleGenerationError}
                    initialParams={currentParams}
                    showHistory={false}
                    showFavorites={false}
                    enableBatchGeneration={false}
                  />
                </Card>
              </TabsContent>

              {/* Batch Generation Tab */}
              <TabsContent value="batch" className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                    Batch Generation
                  </h2>
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Batch generation feature coming soon!
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      This will allow you to generate multiple images with different parameters
                      or variations of the same prompt.
                    </p>
                  </div>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Generation History
                    </h2>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {generationHistory.length} images generated
                    </div>
                  </div>

                  {generationHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        No images generated yet
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Start generating images to see them appear here
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {generationHistory.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className="aspect-square">
                            <img
                              src={item.image}
                              alt="Generated image"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div className="p-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                              {item.metadata.prompt}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                {new Date(item.timestamp).toLocaleDateString()}
                              </span>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleLoadFromHistory(item)}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  Load
                                </button>
                                <button
                                  onClick={() => 
                                    item.isFavorite 
                                      ? handleRemoveFromFavorites(item.id)
                                      : handleAddToFavorites(item.id)
                                  }
                                  className={cn(
                                    'text-xs hover:underline',
                                    item.isFavorite
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-gray-600 dark:text-gray-400'
                                  )}
                                >
                                  {item.isFavorite ? 'Unfavorite' : 'Favorite'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Favorites Tab */}
              <TabsContent value="favorites" className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Favorite Images
                    </h2>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {favorites.length} favorites
                    </div>
                  </div>

                  {favorites.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        No favorite images yet
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Mark images as favorites from your generation history
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {favorites.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className="aspect-square">
                            <img
                              src={item.image}
                              alt="Favorite image"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div className="p-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                              {item.metadata.prompt}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                {new Date(item.timestamp).toLocaleDateString()}
                              </span>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleLoadFromHistory(item)}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  Load
                                </button>
                                <button
                                  onClick={() => handleRemoveFromFavorites(item.id)}
                                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enhanced LexiGraph with advanced features, real-time progress tracking, and comprehensive error handling.
            </p>
          </motion.div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default IntegrationExample;
