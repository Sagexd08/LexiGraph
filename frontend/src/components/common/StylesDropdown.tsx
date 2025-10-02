import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Search,
  X,
  Palette,
  Camera,
  Brush,
  Sparkles,
  Image as ImageIcon,
  Zap,
  Star,
  Heart,
  Eye
} from 'lucide-react';
import { cn } from '../../utils/cn';

export interface StyleOption {
  id: string;
  name: string;
  description: string;
  category: 'photorealistic' | 'artistic' | 'anime' | 'abstract' | 'vintage' | 'modern';
  thumbnail?: string;
  icon?: React.ReactNode;
  positivePrompt: string;
  negativePrompt: string;
  popular?: boolean;
  new?: boolean;
  premium?: boolean;
}

export interface StylesDropdownProps {
  value: string;
  onChange: (styleId: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  showSearch?: boolean;
  showCategories?: boolean;
  showThumbnails?: boolean;
  maxHeight?: string;
}

const PREDEFINED_STYLES: StyleOption[] = [
  {
    id: '',
    name: 'No Style',
    description: 'Generate without any specific style',
    category: 'modern',
    icon: <X className="h-4 w-4" />,
    positivePrompt: '',
    negativePrompt: '',
  },
  {
    id: 'photorealistic',
    name: 'Photorealistic',
    description: 'High-quality, realistic photography style',
    category: 'photorealistic',
    icon: <Camera className="h-4 w-4" />,
    positivePrompt: ', photorealistic, high quality, detailed, professional photography, sharp focus, realistic lighting',
    negativePrompt: 'cartoon, anime, painting, drawing, low quality, blurry, distorted, unrealistic',
    popular: true,
  },
  {
    id: 'cartoon',
    name: 'Cartoon',
    description: 'Fun, colorful cartoon illustration style',
    category: 'artistic',
    icon: <Sparkles className="h-4 w-4" />,
    positivePrompt: ', cartoon style, colorful, fun, illustration, animated, vibrant colors',
    negativePrompt: 'realistic, photographic, dark, gritty, low quality',
  },
  {
    id: 'oil_painting',
    name: 'Oil Painting',
    description: 'Classic oil painting with rich textures',
    category: 'artistic',
    icon: <Brush className="h-4 w-4" />,
    positivePrompt: ', oil painting, classical art, rich textures, painterly, artistic masterpiece, fine art',
    negativePrompt: 'photographic, digital, low quality, blurry, modern',
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Soft, flowing watercolor painting style',
    category: 'artistic',
    icon: <Palette className="h-4 w-4" />,
    positivePrompt: ', watercolor painting, soft colors, flowing, artistic, delicate, transparent colors',
    negativePrompt: 'photographic, harsh lines, digital, low quality',
  },
  {
    id: 'digital_art',
    name: 'Digital Art',
    description: 'Modern digital artwork with vibrant colors',
    category: 'modern',
    icon: <Zap className="h-4 w-4" />,
    positivePrompt: ', digital art, modern, vibrant colors, high contrast, detailed digital painting',
    negativePrompt: 'traditional art, low quality, blurry, washed out',
    popular: true,
  },
  {
    id: 'anime',
    name: 'Anime',
    description: 'Japanese anime and manga style',
    category: 'anime',
    icon: <Star className="h-4 w-4" />,
    positivePrompt: ', anime style, manga, detailed anime art, cel shading, vibrant colors',
    negativePrompt: 'realistic, photographic, western cartoon, low quality',
    popular: true,
  },
  {
    id: 'sketch',
    name: 'Sketch',
    description: 'Hand-drawn pencil sketch style',
    category: 'artistic',
    icon: <ImageIcon className="h-4 w-4" />,
    positivePrompt: ', pencil sketch, hand drawn, artistic sketch, detailed line art, monochrome',
    negativePrompt: 'colored, photographic, digital, low quality',
  },
  {
    id: 'abstract',
    name: 'Abstract',
    description: 'Abstract art with geometric shapes and colors',
    category: 'abstract',
    icon: <Eye className="h-4 w-4" />,
    positivePrompt: ', abstract art, geometric shapes, modern art, colorful, artistic composition',
    negativePrompt: 'realistic, photographic, representational, low quality',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Retro vintage photography style',
    category: 'vintage',
    icon: <Heart className="h-4 w-4" />,
    positivePrompt: ', vintage style, retro, aged, nostalgic, film photography, sepia tones',
    negativePrompt: 'modern, digital, bright colors, low quality',
  },
];

const CATEGORY_LABELS = {
  photorealistic: 'Photorealistic',
  artistic: 'Artistic',
  anime: 'Anime & Manga',
  abstract: 'Abstract',
  vintage: 'Vintage',
  modern: 'Modern',
};

const StylesDropdown: React.FC<StylesDropdownProps> = ({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = 'Select a style...',
  showSearch = true,
  showCategories = true,
  showThumbnails = false,
  maxHeight = '400px',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedStyle = useMemo(() => {
    return PREDEFINED_STYLES.find(style => style.id === value);
  }, [value]);

  const filteredStyles = useMemo(() => {
    let filtered = PREDEFINED_STYLES;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(style =>
        style.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        style.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(style => style.category === selectedCategory);
    }

    return filtered;
  }, [searchTerm, selectedCategory]);

  const groupedStyles = useMemo(() => {
    if (!showCategories) return { all: filteredStyles };

    return filteredStyles.reduce((groups, style) => {
      const category = style.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(style);
      return groups;
    }, {} as Record<string, StyleOption[]>);
  }, [filteredStyles, showCategories]);

  const categories = useMemo(() => {
    const cats = Object.keys(CATEGORY_LABELS);
    return cats.filter(cat => 
      PREDEFINED_STYLES.some(style => style.category === cat)
    );
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStyleSelect = (styleId: string) => {
    onChange(styleId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const renderStyleOption = (style: StyleOption) => (
    <motion.button
      key={style.id}
      onClick={() => handleStyleSelect(style.id)}
      className={cn(
        'w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg',
        value === style.id && 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Icon or Thumbnail */}
      <div className="flex-shrink-0">
        {showThumbnails && style.thumbnail ? (
          <img
            src={style.thumbnail}
            alt={style.name}
            className="w-8 h-8 rounded object-cover"
          />
        ) : (
          <div className={cn(
            'w-8 h-8 rounded flex items-center justify-center',
            value === style.id 
              ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          )}>
            {style.icon}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900 dark:text-white truncate">
            {style.name}
          </span>
          {style.popular && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
              Popular
            </span>
          )}
          {style.new && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              New
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {style.description}
        </p>
      </div>

      {/* Selection indicator */}
      {value === style.id && (
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-blue-600 rounded-full" />
        </div>
      )}
    </motion.button>
  );

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          disabled && 'opacity-50 cursor-not-allowed',
          isOpen && 'ring-2 ring-blue-500 border-transparent'
        )}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {selectedStyle ? (
            <>
              <div className="flex-shrink-0">
                {showThumbnails && selectedStyle.thumbnail ? (
                  <img
                    src={selectedStyle.thumbnail}
                    alt={selectedStyle.name}
                    className="w-6 h-6 rounded object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400">
                    {selectedStyle.icon}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-900 dark:text-white truncate block">
                  {selectedStyle.name}
                </span>
              </div>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={cn(
          'h-4 w-4 text-gray-400 transition-transform',
          isOpen && 'transform rotate-180'
        )} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
            style={{ maxHeight }}
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              {/* Search */}
              {showSearch && (
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search styles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Category Filter */}
              {showCategories && (
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={cn(
                      'px-2 py-1 text-xs rounded-full transition-colors',
                      selectedCategory === 'all'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    All
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        'px-2 py-1 text-xs rounded-full transition-colors',
                        selectedCategory === category
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      )}
                    >
                      {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Styles List */}
            <div className="max-h-80 overflow-y-auto p-2">
              {showCategories ? (
                Object.entries(groupedStyles).map(([category, styles]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-2">
                      {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                    </h4>
                    <div className="space-y-1">
                      {styles.map(renderStyleOption)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-1">
                  {filteredStyles.map(renderStyleOption)}
                </div>
              )}

              {filteredStyles.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No styles found</p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-blue-600 dark:text-blue-400 text-sm hover:underline mt-1"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StylesDropdown;
