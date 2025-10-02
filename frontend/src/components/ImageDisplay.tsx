

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Copy,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info
} from 'lucide-react';

import { GenerateImageResponse } from '../types/api';

interface ImageDisplayProps {
  image: string | null;
  isGenerating: boolean;
  error: string | null;
  metadata: GenerateImageResponse['metadata'] | null;
  onDownload: () => void;
  onCopy: () => void;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  image,
  isGenerating,
  error,
  metadata,
  onDownload,
  onCopy,
}) => {
  const [showMetadata, setShowMetadata] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageLoaded(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Generated Image
          </h3>

          {image && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowMetadata(!showMetadata)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Show metadata"
              >
                <Info className="h-4 w-4" />
              </button>

              <button
                onClick={onCopy}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </button>

              <button
                onClick={onDownload}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {}
      <div className="relative aspect-square bg-gray-50 dark:bg-gray-900">
        <AnimatePresence mode="wait">
          {isGenerating && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div className="relative">
                <Loader2 className="h-16 w-16 text-primary-600 animate-spin" />
                <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-800"></div>
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
                Generating your image...
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                This may take a few moments
              </p>
            </motion.div>
          )}

          {error && !isGenerating && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8"
            >
              <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4 mb-4">
                <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Generation Failed
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                {error}
              </p>
            </motion.div>
          )}

          {!image && !isGenerating && !error && (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
                <ImageIcon className="h-16 w-16 text-gray-400 dark:text-gray-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Ready to Generate
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                Enter a prompt and click "Generate Image" to create your artwork
              </p>
            </motion.div>
          )}

          {image && !isGenerating && (
            <motion.div
              key="image"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0"
            >
              <img
                src={image}
                alt="Generated artwork"
                className="w-full h-full object-contain"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />

              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {}
      <AnimatePresence>
        {showMetadata && metadata && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
          >
            <div className="p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Generation Details
              </h4>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Prompt:</span>
                  <p className="text-gray-900 dark:text-white mt-1 break-words">
                    {metadata.prompt}
                  </p>
                </div>

                {metadata.negative_prompt && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Negative Prompt:</span>
                    <p className="text-gray-900 dark:text-white mt-1 break-words">
                      {metadata.negative_prompt}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-gray-500 dark:text-gray-400">Resolution:</span>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {metadata.width} × {metadata.height}
                  </p>
                </div>

                <div>
                  <span className="text-gray-500 dark:text-gray-400">Steps:</span>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {metadata.num_inference_steps}
                  </p>
                </div>

                <div>
                  <span className="text-gray-500 dark:text-gray-400">Guidance Scale:</span>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {metadata.guidance_scale}
                  </p>
                </div>

                <div>
                  <span className="text-gray-500 dark:text-gray-400">Scheduler:</span>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {metadata.scheduler}
                  </p>
                </div>

                {metadata.seed && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Seed:</span>
                    <p className="text-gray-900 dark:text-white mt-1 font-mono">
                      {metadata.seed}
                    </p>
                  </div>
                )}

                {metadata.style && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Style:</span>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {metadata.style}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-gray-500 dark:text-gray-400">Model:</span>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {metadata.model_type}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageDisplay;
