import React from 'react';
import EnhancedImageGenerator from './enhanced/EnhancedImageGenerator';

/**
 * Legacy ImageGenerator Component
 * 
 * This component provides backward compatibility by wrapping the EnhancedImageGenerator.
 * It maintains the same interface as the original ImageGenerator while providing
 * all the enhanced features.
 * 
 * @deprecated Use EnhancedImageGenerator directly for new implementations
 */

interface ImageGeneratorProps {
  className?: string;
  onImageGenerated?: (image: string, metadata: any) => void;
  onError?: (error: string) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  className,
  onImageGenerated,
  onError,
}) => {
  return (
    <EnhancedImageGenerator
      className={className}
      onImageGenerated={onImageGenerated}
      onError={onError}
      showHistory={true}
      showFavorites={true}
      enableBatchGeneration={false}
    />
  );
};

export default ImageGenerator;
