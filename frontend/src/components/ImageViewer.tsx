

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Download,
  Copy,
  X,
  Move,
  Grid,
  Eye
} from 'lucide-react';
import { Button, Modal, Tooltip } from './ui';
import { GenerateImageResponse } from '../types/api';

interface ImageViewerProps {
  image: string | null;
  metadata: GenerateImageResponse['metadata'] | null;
  onDownload: () => void;
  onCopy: () => void;
  comparisonImage?: string;
  showComparison?: boolean;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  image,
  metadata,
  onDownload,
  onCopy,
  comparisonImage,
  showComparison = false
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'overlay' | 'slider'>('side-by-side');

  const imageRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.5, 0.1));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  }, []);

  if (!image) {
    return (
      <div className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No image to display</p>
        </div>
      </div>
    );
  }

  const ImageContent = ({ src, alt }: { src: string; alt: string }) => (
    <div
      ref={imageRef}
      className="relative w-full h-full overflow-hidden cursor-move"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-full object-contain select-none"
        style={{
          transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }}
        drag={zoom > 1}
        dragConstraints={imageRef}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
      />

      {showGrid && (
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full" style={{ opacity: 0.3 }}>
            <defs>
              <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      )}
    </div>
  );

  const ToolbarButton = ({ icon: Icon, onClick, tooltip, active = false }: {
    icon: React.ComponentType<any>;
    onClick: () => void;
    tooltip: string;
    active?: boolean;
  }) => (
    <Tooltip content={tooltip}>
      <Button
        variant={active ? 'primary' : 'ghost'}
        size="sm"
        onClick={onClick}
        icon={<Icon className="h-4 w-4" />}
      />
    </Tooltip>
  );

  return (
    <>
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <ToolbarButton
            icon={ZoomIn}
            onClick={handleZoomIn}
            tooltip="Zoom In"
          />
          <ToolbarButton
            icon={ZoomOut}
            onClick={handleZoomOut}
            tooltip="Zoom Out"
          />
          <ToolbarButton
            icon={RotateCcw}
            onClick={handleReset}
            tooltip="Reset View"
          />
          <ToolbarButton
            icon={Grid}
            onClick={() => setShowGrid(!showGrid)}
            tooltip="Toggle Grid"
            active={showGrid}
          />
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          <ToolbarButton
            icon={Copy}
            onClick={onCopy}
            tooltip="Copy to Clipboard"
          />
          <ToolbarButton
            icon={Download}
            onClick={onDownload}
            tooltip="Download Image"
          />
          <ToolbarButton
            icon={Maximize}
            onClick={() => setIsFullscreen(true)}
            tooltip="Fullscreen View"
          />
        </div>

        {}
        {zoom !== 1 && (
          <div className="absolute bottom-4 left-4 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-1 text-sm font-medium">
            {Math.round(zoom * 100)}%
          </div>
        )}

        {}
        <div className="aspect-square relative">
          {showComparison && comparisonImage ? (
            <div className="w-full h-full flex">
              {comparisonMode === 'side-by-side' && (
                <>
                  <div className="w-1/2 border-r border-gray-300 dark:border-gray-600">
                    <ImageContent src={image} alt="Current image" />
                  </div>
                  <div className="w-1/2">
                    <ImageContent src={comparisonImage} alt="Comparison image" />
                  </div>
                </>
              )}
            </div>
          ) : (
            <ImageContent src={image} alt="Generated image" />
          )}
        </div>

        {}
        {metadata && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Resolution:</span>
                <p className="font-medium">{metadata.width} × {metadata.height}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Steps:</span>
                <p className="font-medium">{metadata.num_inference_steps}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Guidance:</span>
                <p className="font-medium">{metadata.guidance_scale}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Scheduler:</span>
                <p className="font-medium">{metadata.scheduler}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {}
      <Modal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        size="full"
        showCloseButton={false}
        className="bg-black"
      >
        <div className="relative w-full h-full">
          <ImageContent src={image} alt="Generated image (fullscreen)" />

          {}
          <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
            <ToolbarButton
              icon={ZoomIn}
              onClick={handleZoomIn}
              tooltip="Zoom In"
            />
            <ToolbarButton
              icon={ZoomOut}
              onClick={handleZoomOut}
              tooltip="Zoom Out"
            />
            <ToolbarButton
              icon={RotateCcw}
              onClick={handleReset}
              tooltip="Reset View"
            />
            <div className="w-px h-6 bg-gray-600" />
            <ToolbarButton
              icon={X}
              onClick={() => setIsFullscreen(false)}
              tooltip="Exit Fullscreen"
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ImageViewer;
