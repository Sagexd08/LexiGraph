/**
 * Image Comparison Component for A/B Testing
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Download, 
  Heart, 
  Share2, 
  Maximize2,
  Grid3X3,
  SplitSquareHorizontal,
  Layers,
  Star,
  ThumbsUp,
  ThumbsDown,
  BarChart3
} from 'lucide-react';
import { cn } from '../utils/cn';
import { GlassCard, AdvancedButton } from '../design-system';
import { useAppStore } from '../store';

interface ComparisonImage {
  id: string;
  url: string;
  title: string;
  params?: Record<string, any>;
  metadata?: {
    generationTime: number;
    model: string;
    settings: Record<string, any>;
  };
  rating?: number;
  votes?: {
    likes: number;
    dislikes: number;
  };
}

interface ImageComparisonProps {
  images: ComparisonImage[];
  mode?: 'side-by-side' | 'overlay' | 'grid' | 'slider';
  onImageSelect?: (image: ComparisonImage) => void;
  onImageRate?: (imageId: string, rating: number) => void;
  onImageVote?: (imageId: string, vote: 'like' | 'dislike') => void;
  className?: string;
}

export const ImageComparison: React.FC<ImageComparisonProps> = ({
  images,
  mode = 'side-by-side',
  onImageSelect,
  onImageRate,
  onImageVote,
  className,
}) => {
  const [currentMode, setCurrentMode] = useState(mode);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showMetadata, setShowMetadata] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { addToHistory, toggleFavorite } = useAppStore();

  // Handle image selection
  const handleImageSelect = useCallback((image: ComparisonImage) => {
    if (selectedImages.includes(image.id)) {
      setSelectedImages(prev => prev.filter(id => id !== image.id));
    } else {
      if (selectedImages.length < 2 || currentMode === 'grid') {
        setSelectedImages(prev => [...prev, image.id]);
      } else {
        setSelectedImages([image.id]);
      }
    }
    onImageSelect?.(image);
  }, [selectedImages, currentMode, onImageSelect]);

  // Handle rating
  const handleRating = useCallback((imageId: string, rating: number) => {
    onImageRate?.(imageId, rating);
  }, [onImageRate]);

  // Handle voting
  const handleVote = useCallback((imageId: string, vote: 'like' | 'dislike') => {
    onImageVote?.(imageId, vote);
  }, [onImageVote]);

  // Download image
  const downloadImage = useCallback(async (image: ComparisonImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${image.title || 'image'}-${Date.now()}.png`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  }, []);

  // Add to favorites
  const addToFavorites = useCallback((image: ComparisonImage) => {
    if (image.params) {
      addToHistory({
        params: image.params,
        result: { success: true, image: image.url, metadata: image.metadata },
        isFavorite: true,
        tags: ['comparison', 'favorite'],
        metadata: image.metadata || {
          generationTime: 0,
          modelVersion: 'unknown',
          settings: {},
        },
      });
    }
  }, [addToHistory]);

  // Rating component
  const RatingComponent = ({ image }: { image: ComparisonImage }) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleRating(image.id, star)}
          className={cn(
            'w-4 h-4 transition-colors',
            (image.rating || 0) >= star ? 'text-yellow-400' : 'text-gray-300'
          )}
        >
          <Star className="w-full h-full fill-current" />
        </button>
      ))}
    </div>
  );

  // Vote component
  const VoteComponent = ({ image }: { image: ComparisonImage }) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleVote(image.id, 'like')}
        className="flex items-center space-x-1 text-green-500 hover:text-green-600 transition-colors"
      >
        <ThumbsUp className="w-4 h-4" />
        <span className="text-xs">{image.votes?.likes || 0}</span>
      </button>
      <button
        onClick={() => handleVote(image.id, 'dislike')}
        className="flex items-center space-x-1 text-red-500 hover:text-red-600 transition-colors"
      >
        <ThumbsDown className="w-4 h-4" />
        <span className="text-xs">{image.votes?.dislikes || 0}</span>
      </button>
    </div>
  );

  // Image overlay component
  const ImageOverlay = ({ image, isSelected }: { image: ComparisonImage; isSelected: boolean }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: hoveredImage === image.id ? 1 : 0 }}
      className="absolute inset-0 bg-black/50 flex items-center justify-center"
    >
      <div className="flex items-center space-x-2">
        <AdvancedButton
          variant="glass"
          size="sm"
          onClick={() => handleImageSelect(image)}
          icon={isSelected ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        >
          {isSelected ? 'Selected' : 'Select'}
        </AdvancedButton>
        
        <AdvancedButton
          variant="glass"
          size="sm"
          onClick={() => setFullscreenImage(image.id)}
          icon={<Maximize2 className="w-4 h-4" />}
        />
        
        <AdvancedButton
          variant="glass"
          size="sm"
          onClick={() => downloadImage(image)}
          icon={<Download className="w-4 h-4" />}
        />
        
        <AdvancedButton
          variant="glass"
          size="sm"
          onClick={() => addToFavorites(image)}
          icon={<Heart className="w-4 h-4" />}
        />
      </div>
    </motion.div>
  );

  // Render side-by-side comparison
  const renderSideBySide = () => {
    const selectedImageObjects = images.filter(img => selectedImages.includes(img.id)).slice(0, 2);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
        {selectedImageObjects.map((image, index) => (
          <GlassCard key={image.id} className="relative overflow-hidden">
            <div className="aspect-square relative">
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                {image.title} {index === 0 ? '(A)' : '(B)'}
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <RatingComponent image={image} />
                <VoteComponent image={image} />
              </div>
              
              {showMetadata && image.metadata && (
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Generation Time: {image.metadata.generationTime}ms</div>
                  <div>Model: {image.metadata.model}</div>
                </div>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    );
  };

  // Render slider comparison
  const renderSlider = () => {
    const selectedImageObjects = images.filter(img => selectedImages.includes(img.id)).slice(0, 2);
    if (selectedImageObjects.length < 2) return null;
    
    return (
      <div className="relative h-full">
        <div className="relative aspect-square overflow-hidden rounded-xl">
          {/* Base image */}
          <img
            src={selectedImageObjects[1].url}
            alt={selectedImageObjects[1].title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Overlay image with clip */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img
              src={selectedImageObjects[0].url}
              alt={selectedImageObjects[0].title}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Slider */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
            style={{ left: `${sliderPosition}%` }}
            onMouseDown={(e) => {
              const rect = e.currentTarget.parentElement!.getBoundingClientRect();
              const handleMouseMove = (e: MouseEvent) => {
                const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
                setSliderPosition(Math.max(0, Math.min(100, newPosition)));
              };
              
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
              <SplitSquareHorizontal className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          
          {/* Labels */}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {selectedImageObjects[0].title} (A)
          </div>
          <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {selectedImageObjects[1].title} (B)
          </div>
        </div>
      </div>
    );
  };

  // Render grid comparison
  const renderGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image) => {
        const isSelected = selectedImages.includes(image.id);
        
        return (
          <motion.div
            key={image.id}
            layout
            className={cn(
              'relative cursor-pointer transition-all duration-200',
              isSelected && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-900'
            )}
            onMouseEnter={() => setHoveredImage(image.id)}
            onMouseLeave={() => setHoveredImage(null)}
            onClick={() => handleImageSelect(image)}
          >
            <div className="aspect-square relative overflow-hidden rounded-lg">
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-full object-cover"
              />
              
              <ImageOverlay image={image} isSelected={isSelected} />
              
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
              )}
            </div>
            
            <div className="mt-2 space-y-1">
              <div className="text-sm font-medium truncate">{image.title}</div>
              <div className="flex items-center justify-between">
                <RatingComponent image={image} />
                <VoteComponent image={image} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/10 dark:bg-white/5 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">Image Comparison</h2>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedImages.length} of {images.length} selected
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Mode selector */}
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {[
              { id: 'side-by-side', icon: Layers, label: 'Side by Side' },
              { id: 'slider', icon: SplitSquareHorizontal, label: 'Slider' },
              { id: 'grid', icon: Grid3X3, label: 'Grid' },
            ].map((modeOption) => (
              <button
                key={modeOption.id}
                onClick={() => setCurrentMode(modeOption.id as any)}
                className={cn(
                  'flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors',
                  currentMode === modeOption.id
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
                title={modeOption.label}
              >
                <modeOption.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          
          <AdvancedButton
            variant="ghost"
            size="sm"
            onClick={() => setShowMetadata(!showMetadata)}
            icon={<BarChart3 className="w-4 h-4" />}
          >
            {showMetadata ? 'Hide' : 'Show'} Metadata
          </AdvancedButton>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-6 overflow-auto" ref={containerRef}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {currentMode === 'side-by-side' && renderSideBySide()}
            {currentMode === 'slider' && renderSlider()}
            {currentMode === 'grid' && renderGrid()}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Fullscreen modal */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setFullscreenImage(null)}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={images.find(img => img.id === fullscreenImage)?.url}
              alt="Fullscreen"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageComparison;
