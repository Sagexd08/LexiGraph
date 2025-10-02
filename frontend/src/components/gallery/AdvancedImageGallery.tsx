/**
 * Advanced Image Gallery Component
 * Modern gallery with filtering, sorting, search, and grid layouts
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Grid3X3,
  Grid2X2,
  List,
  Calendar,
  Star,
  Download,
  Share,
  Trash2,
  Eye,
  Heart,
  MoreHorizontal,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { GlassCard, AdvancedButton } from '../../design-system';
import { cn } from '../../utils/cn';

interface ImageItem {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  prompt: string;
  style: string;
  dimensions: { width: number; height: number };
  createdAt: Date;
  isFavorite: boolean;
  tags: string[];
  metadata: {
    steps: number;
    guidance: number;
    seed: number;
    model: string;
  };
}

interface AdvancedImageGalleryProps {
  images: ImageItem[];
  onImageSelect?: (image: ImageItem) => void;
  onImageDelete?: (id: string) => void;
  onImageFavorite?: (id: string) => void;
  className?: string;
}

type ViewMode = 'grid-large' | 'grid-medium' | 'grid-small' | 'list';
type SortBy = 'date' | 'name' | 'style' | 'favorites';
type SortOrder = 'asc' | 'desc';

const AdvancedImageGallery: React.FC<AdvancedImageGalleryProps> = ({
  images,
  onImageSelect,
  onImageDelete,
  onImageFavorite,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid-medium');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Get unique styles and tags
  const availableStyles = useMemo(() => {
    const styles = new Set(images.map(img => img.style));
    return Array.from(styles);
  }, [images]);

  const availableTags = useMemo(() => {
    const tags = new Set(images.flatMap(img => img.tags));
    return Array.from(tags);
  }, [images]);

  // Filter and sort images
  const filteredAndSortedImages = useMemo(() => {
    let filtered = images.filter(image => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!image.title.toLowerCase().includes(query) &&
            !image.prompt.toLowerCase().includes(query) &&
            !image.tags.some(tag => tag.toLowerCase().includes(query))) {
          return false;
        }
      }

      // Style filter
      if (selectedStyle !== 'all' && image.style !== selectedStyle) {
        return false;
      }

      // Tags filter
      if (selectedTags.length > 0 && !selectedTags.some(tag => image.tags.includes(tag))) {
        return false;
      }

      // Favorites filter
      if (showFavoritesOnly && !image.isFavorite) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'style':
          comparison = a.style.localeCompare(b.style);
          break;
        case 'favorites':
          comparison = (a.isFavorite ? 1 : 0) - (b.isFavorite ? 1 : 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [images, searchQuery, selectedStyle, selectedTags, showFavoritesOnly, sortBy, sortOrder]);

  const viewModeConfig = {
    'grid-large': { cols: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3', size: 'large' },
    'grid-medium': { cols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4', size: 'medium' },
    'grid-small': { cols: 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6', size: 'small' },
    'list': { cols: 'grid-cols-1', size: 'list' },
  };

  const toggleImageSelection = (id: string) => {
    setSelectedImages(prev => 
      prev.includes(id) 
        ? prev.filter(imgId => imgId !== id)
        : [...prev, id]
    );
  };

  const ImageCard: React.FC<{ image: ImageItem; index: number }> = ({ image, index }) => {
    const isSelected = selectedImages.includes(image.id);
    const config = viewModeConfig[viewMode];

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          'group relative cursor-pointer',
          config.size === 'list' && 'flex items-center space-x-4 p-4'
        )}
        onClick={() => onImageSelect?.(image)}
      >
        <GlassCard 
          variant="interactive" 
          className={cn(
            'overflow-hidden',
            config.size === 'list' ? 'flex-shrink-0 w-24 h-24' : 'aspect-square',
            isSelected && 'ring-2 ring-primary-500'
          )}
        >
          <div className="relative w-full h-full">
            <img
              src={image.thumbnail}
              alt={image.title}
              className="w-full h-full object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200">
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageFavorite?.(image.id);
                    }}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Heart className={cn(
                      'h-4 w-4',
                      image.isFavorite ? 'text-red-500 fill-current' : 'text-white'
                    )} />
                  </button>
                  
                  <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
                    <Download className="h-4 w-4 text-white" />
                  </button>
                  
                  <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
                    <Share className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Selection checkbox */}
            <div className="absolute top-2 left-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleImageSelection(image.id);
                }}
                className="w-4 h-4 text-primary-600 bg-white/20 border-white/30 rounded focus:ring-primary-500"
              />
            </div>

            {/* Favorite indicator */}
            {image.isFavorite && (
              <div className="absolute top-2 right-2">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
              </div>
            )}
          </div>
        </GlassCard>

        {/* List view details */}
        {config.size === 'list' && (
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate">{image.title}</h3>
            <p className="text-neutral-400 text-sm truncate">{image.prompt}</p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-500">
              <span>{image.style}</span>
              <span>{image.dimensions.width}×{image.dimensions.height}</span>
              <span>{image.createdAt.toLocaleDateString()}</span>
            </div>
          </div>
        )}

        {/* Grid view details */}
        {config.size !== 'list' && config.size !== 'small' && (
          <div className="mt-3">
            <h3 className="text-white font-medium text-sm truncate">{image.title}</h3>
            <p className="text-neutral-400 text-xs truncate">{image.style}</p>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Controls */}
      <GlassCard className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>

            {/* Style Filter */}
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
              <option value="all">All Styles</option>
              {availableStyles.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>

            {/* Favorites Toggle */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={cn(
                'px-3 py-2 rounded-lg transition-colors flex items-center space-x-2',
                showFavoritesOnly 
                  ? 'bg-yellow-500/20 text-yellow-400' 
                  : 'bg-white/10 text-neutral-400 hover:bg-white/20'
              )}
            >
              <Star className="h-4 w-4" />
              <span>Favorites</span>
            </button>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-2">
            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-');
                setSortBy(by as SortBy);
                setSortOrder(order as SortOrder);
              }}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="style-asc">Style A-Z</option>
              <option value="favorites-desc">Favorites First</option>
            </select>

            {/* View Mode */}
            <div className="flex bg-white/10 rounded-lg p-1">
              {[
                { mode: 'grid-large', icon: Grid2X2 },
                { mode: 'grid-medium', icon: Grid3X3 },
                { mode: 'grid-small', icon: Grid3X3 },
                { mode: 'list', icon: List },
              ].map(({ mode, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as ViewMode)}
                  className={cn(
                    'p-2 rounded transition-colors',
                    viewMode === mode 
                      ? 'bg-primary-500 text-white' 
                      : 'text-neutral-400 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-neutral-400">
          {filteredAndSortedImages.length} of {images.length} images
          {selectedImages.length > 0 && (
            <span className="ml-4 text-primary-400">
              {selectedImages.length} selected
            </span>
          )}
        </div>
      </GlassCard>

      {/* Gallery */}
      <div className={cn(
        'grid gap-4',
        viewModeConfig[viewMode].cols
      )}>
        <AnimatePresence>
          {filteredAndSortedImages.map((image, index) => (
            <ImageCard key={image.id} image={image} index={index} />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filteredAndSortedImages.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
            <Search className="h-12 w-12 text-neutral-500" />
          </div>
          <h3 className="text-lg font-medium text-neutral-400 mb-2">No images found</h3>
          <p className="text-neutral-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default AdvancedImageGallery;
