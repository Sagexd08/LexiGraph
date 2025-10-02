/**
 * Advanced Image Editor Component
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crop, 
  RotateCw, 
  Palette, 
  Sliders, 
  Download, 
  Undo, 
  Redo,
  ZoomIn,
  ZoomOut,
  Move,
  Square,
  Circle,
  Type,
  Brush,
  Eraser,
  Save,
  X
} from 'lucide-react';
import ReactCrop, { Crop as CropType, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { cn } from '../utils/cn';
import { GlassCard, AdvancedButton } from '../design-system';

interface ImageEditorProps {
  imageUrl: string;
  onSave?: (editedImageUrl: string) => void;
  onClose?: () => void;
  className?: string;
}

interface FilterSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  sepia: number;
  grayscale: number;
}

interface HistoryState {
  imageData: string;
  filters: FilterSettings;
  crop?: PixelCrop;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
  imageUrl,
  onSave,
  onClose,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'crop' | 'filters' | 'draw' | 'text'>('crop');
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  const [filters, setFilters] = useState<FilterSettings>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    sepia: 0,
    grayscale: 0,
  });
  
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize history
  useEffect(() => {
    if (imageUrl && history.length === 0) {
      const initialState: HistoryState = {
        imageData: imageUrl,
        filters,
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, [imageUrl, history.length, filters]);

  // Apply filters to image
  const applyFilters = useCallback(() => {
    if (!imageRef.current || !previewCanvasRef.current) return;
    
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = imageRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    // Apply CSS filters
    ctx.filter = `
      brightness(${filters.brightness}%)
      contrast(${filters.contrast}%)
      saturate(${filters.saturation}%)
      hue-rotate(${filters.hue}deg)
      blur(${filters.blur}px)
      sepia(${filters.sepia}%)
      grayscale(${filters.grayscale}%)
    `;
    
    ctx.drawImage(img, 0, 0);
  }, [filters]);

  // Apply crop
  const applyCrop = useCallback(() => {
    if (!imageRef.current || !canvasRef.current || !completedCrop) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = imageRef.current;
    const { width, height, x, y } = completedCrop;
    
    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(
      img,
      x, y, width, height,
      0, 0, width, height
    );
    
    return canvas.toDataURL('image/png');
  }, [completedCrop]);

  // Save current state to history
  const saveToHistory = useCallback((newState: HistoryState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Undo/Redo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const prevState = history[historyIndex - 1];
      setFilters(prevState.filters);
      if (prevState.crop) {
        setCompletedCrop(prevState.crop);
      }
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const nextState = history[historyIndex + 1];
      setFilters(nextState.filters);
      if (nextState.crop) {
        setCompletedCrop(nextState.crop);
      }
    }
  }, [historyIndex, history]);

  // Reset all edits
  const resetEdits = useCallback(() => {
    setFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      blur: 0,
      sepia: 0,
      grayscale: 0,
    });
    setCrop(undefined);
    setCompletedCrop(undefined);
    setRotation(0);
    setZoom(1);
  }, []);

  // Save edited image
  const saveImage = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      // Apply all edits to final canvas
      const finalCanvas = document.createElement('canvas');
      const ctx = finalCanvas.getContext('2d');
      if (!ctx || !imageRef.current) return;
      
      const img = imageRef.current;
      finalCanvas.width = img.naturalWidth;
      finalCanvas.height = img.naturalHeight;
      
      // Apply filters
      ctx.filter = `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturation}%)
        hue-rotate(${filters.hue}deg)
        blur(${filters.blur}px)
        sepia(${filters.sepia}%)
        grayscale(${filters.grayscale}%)
      `;
      
      ctx.drawImage(img, 0, 0);
      
      // Apply crop if exists
      let finalImageData = finalCanvas.toDataURL('image/png');
      
      if (completedCrop) {
        const cropCanvas = document.createElement('canvas');
        const cropCtx = cropCanvas.getContext('2d');
        if (cropCtx) {
          const { width, height, x, y } = completedCrop;
          cropCanvas.width = width;
          cropCanvas.height = height;
          
          const tempImg = new Image();
          tempImg.onload = () => {
            cropCtx.drawImage(
              tempImg,
              x, y, width, height,
              0, 0, width, height
            );
            finalImageData = cropCanvas.toDataURL('image/png');
            onSave?.(finalImageData);
          };
          tempImg.src = finalImageData;
        }
      } else {
        onSave?.(finalImageData);
      }
    } catch (error) {
      console.error('Error saving image:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [filters, completedCrop, onSave]);

  // Download image
  const downloadImage = useCallback(() => {
    if (!previewCanvasRef.current) return;
    
    const canvas = previewCanvasRef.current;
    const link = document.createElement('a');
    link.download = `edited-image-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  // Filter controls
  const FilterControls = () => (
    <div className="space-y-4">
      {Object.entries(filters).map(([key, value]) => (
        <div key={key} className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium capitalize">{key}</label>
            <span className="text-xs text-gray-500">
              {key === 'hue' ? `${value}°` : 
               key === 'blur' ? `${value}px` : 
               `${value}${key.includes('brightness') || key.includes('contrast') || key.includes('saturation') ? '%' : ''}`}
            </span>
          </div>
          <input
            type="range"
            min={key === 'hue' ? -180 : key === 'blur' ? 0 : key.includes('brightness') || key.includes('contrast') || key.includes('saturation') ? 0 : 0}
            max={key === 'hue' ? 180 : key === 'blur' ? 10 : key.includes('brightness') || key.includes('contrast') || key.includes('saturation') ? 200 : 100}
            value={value}
            onChange={(e) => setFilters(prev => ({ ...prev, [key]: Number(e.target.value) }))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
        </div>
      ))}
    </div>
  );

  // Toolbar
  const Toolbar = () => (
    <div className="flex items-center justify-between p-4 bg-white/10 dark:bg-white/5 backdrop-blur-md border-b border-white/20">
      <div className="flex items-center space-x-2">
        <AdvancedButton
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={historyIndex <= 0}
          icon={<Undo className="w-4 h-4" />}
        >
          Undo
        </AdvancedButton>
        
        <AdvancedButton
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          icon={<Redo className="w-4 h-4" />}
        >
          Redo
        </AdvancedButton>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
        
        <AdvancedButton
          variant="ghost"
          size="sm"
          onClick={resetEdits}
          icon={<RotateCw className="w-4 h-4" />}
        >
          Reset
        </AdvancedButton>
      </div>
      
      <div className="flex items-center space-x-2">
        <AdvancedButton
          variant="ghost"
          size="sm"
          onClick={downloadImage}
          icon={<Download className="w-4 h-4" />}
        >
          Download
        </AdvancedButton>
        
        <AdvancedButton
          variant="primary"
          size="sm"
          onClick={saveImage}
          disabled={isProcessing}
          icon={<Save className="w-4 h-4" />}
        >
          {isProcessing ? 'Saving...' : 'Save'}
        </AdvancedButton>
        
        {onClose && (
          <AdvancedButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            icon={<X className="w-4 h-4" />}
          >
            Close
          </AdvancedButton>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn('h-full flex flex-col bg-gray-50 dark:bg-gray-900', className)}>
      <Toolbar />
      
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white/10 dark:bg-white/5 backdrop-blur-md border-r border-white/20 p-4">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {[
              { id: 'crop', icon: Crop, label: 'Crop' },
              { id: 'filters', icon: Sliders, label: 'Filters' },
              { id: 'draw', icon: Brush, label: 'Draw' },
              { id: 'text', icon: Type, label: 'Text' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          
          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'filters' && <FilterControls />}
              {activeTab === 'crop' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click and drag on the image to select a crop area.
                  </p>
                  {completedCrop && (
                    <AdvancedButton
                      variant="primary"
                      size="sm"
                      onClick={applyCrop}
                      className="w-full"
                    >
                      Apply Crop
                    </AdvancedButton>
                  )}
                </div>
              )}
              {activeTab === 'draw' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Drawing tools coming soon...
                  </p>
                </div>
              )}
              {activeTab === 'text' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Text tools coming soon...
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Main Editor Area */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <div className="relative">
            {activeTab === 'crop' ? (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={undefined}
                className="max-w-full max-h-full"
              >
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Edit"
                  className="max-w-full max-h-full object-contain"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    filter: `
                      brightness(${filters.brightness}%)
                      contrast(${filters.contrast}%)
                      saturate(${filters.saturation}%)
                      hue-rotate(${filters.hue}deg)
                      blur(${filters.blur}px)
                      sepia(${filters.sepia}%)
                      grayscale(${filters.grayscale}%)
                    `,
                  }}
                  onLoad={applyFilters}
                />
              </ReactCrop>
            ) : (
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Edit"
                className="max-w-full max-h-full object-contain"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  filter: `
                    brightness(${filters.brightness}%)
                    contrast(${filters.contrast}%)
                    saturate(${filters.saturation}%)
                    hue-rotate(${filters.hue}deg)
                    blur(${filters.blur}px)
                    sepia(${filters.sepia}%)
                    grayscale(${filters.grayscale}%)
                  `,
                }}
                onLoad={applyFilters}
              />
            )}
            
            {/* Hidden canvases for processing */}
            <canvas ref={canvasRef} className="hidden" />
            <canvas ref={previewCanvasRef} className="hidden" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
