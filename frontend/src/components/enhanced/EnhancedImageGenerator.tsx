import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AlertCircle, Download, Copy, Maximize2 } from 'lucide-react';

import { GenerationParams, GenerateImageResponse, DEFAULT_PARAMS } from '../../types/api';
import { validateGenerationParams, getValidationErrorMessage } from '../../utils/validation';
import apiService from '../../services/api';
import { Card, Button } from '../ui';
import { cn } from '../../utils/cn';
import PrimaryGenerationSection from '../PrimaryGenerationSection';
import AdvancedLoader from '../common/AdvancedLoader';

export interface EnhancedImageGeneratorProps {
  className?: string;
  onImageGenerated?: (image: string, metadata: GenerateImageResponse['metadata']) => void;
  onError?: (error: string) => void;
  initialParams?: Partial<GenerationParams>;
}

interface GeneratedImage {
  id: string;
  image: string;
  metadata: GenerateImageResponse['metadata'];
  timestamp: number;
  isFavorite?: boolean;
  generationTime: number;
}

interface GenerationState {
  isGenerating: boolean;
  progress: number;
  currentStep: number;
  totalSteps: number;
  estimatedTimeRemaining: number;
  error: string | null;
  canCancel: boolean;
  isPaused: boolean;
}

const EnhancedImageGenerator: React.FC<EnhancedImageGeneratorProps> = ({
  className,
  onImageGenerated,
  onError,
  initialParams = {},
}) => {
  // State management
  const [params, setParams] = useState<GenerationParams>({
    ...DEFAULT_PARAMS,
    ...initialParams,
  });

  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    currentStep: 0,
    totalSteps: 20,
    estimatedTimeRemaining: 0,
    error: null,
    canCancel: true,
    isPaused: false,
  });

  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentMetadata, setCurrentMetadata] = useState<GenerateImageResponse['metadata'] | null>(null);
  const [generationHistory, setGenerationHistory] = useState<GeneratedImage[]>([]);
  const [isValidationValid, setIsValidationValid] = useState(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState<'none' | 'style' | 'template'>('none');
  const [lastStyleChange, setLastStyleChange] = useState<number>(0);
  const [lastTemplateChange, setLastTemplateChange] = useState<number>(0);

  // Abort controller for cancellation
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Validation
  const validationResult = useMemo(() => {
    return validateGenerationParams(params);
  }, [params]);

  useEffect(() => {
    setIsValidationValid(validationResult.isValid);
    // Convert ValidationError objects to user-friendly string messages
    const errorMessages = validationResult.errors.map(error =>
      getValidationErrorMessage(error)
    );
    setValidationErrors(errorMessages);
  }, [validationResult]);

  // Handlers
  const handleParamsChange = useCallback((updates: Partial<GenerationParams>) => {
    setParams(prev => {
      const newParams = { ...prev, ...updates };

      // Detect style changes for auto-preview
      if (updates.style && updates.style !== prev.style) {
        setLastStyleChange(Date.now());
        setPreviewMode('style');
      }

      // Detect template changes for auto-preview
      if (updates.steps || updates.guidance_scale || updates.scheduler) {
        setLastTemplateChange(Date.now());
        setPreviewMode('template');
      }

      return newParams;
    });
  }, []);

  const handleValidationChange = useCallback((isValid: boolean, errors: string[]) => {
    setIsValidationValid(isValid);
    setValidationErrors(errors);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!isValidationValid || generationState.isGenerating) return;

    const controller = new AbortController();
    setAbortController(controller);

    setGenerationState({
      isGenerating: true,
      progress: 0,
      currentStep: 0,
      totalSteps: params.steps,
      estimatedTimeRemaining: 0,
      error: null,
      canCancel: true,
      isPaused: false,
    });

    const startTime = Date.now();

    try {
      // Simulate progress updates (in real implementation, this would come from the API)
      const progressInterval = setInterval(() => {
        setGenerationState(prev => {
          if (!prev.isGenerating) {
            clearInterval(progressInterval);
            return prev;
          }

          const newStep = prev.currentStep + 1;
          const progress = (newStep / prev.totalSteps) * 100;
          const elapsed = (Date.now() - startTime) / 1000;
          const estimatedTotal = (elapsed / newStep) * prev.totalSteps;
          const estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsed);

          return {
            ...prev,
            currentStep: newStep,
            progress,
            estimatedTimeRemaining,
          };
        });
      }, 1000);

      const response = await apiService.generateImage(params);

      clearInterval(progressInterval);

      if (response.success && response.image) {
        const generationTime = Date.now() - startTime;
        const newImage: GeneratedImage = {
          id: `img_${Date.now()}`,
          image: response.image,
          metadata: response.metadata,
          timestamp: Date.now(),
          isFavorite: false,
          generationTime,
        };

        setCurrentImage(response.image);
        setCurrentMetadata(response.metadata);
        setGenerationHistory(prev => [newImage, ...prev.slice(0, 49)]); // Keep last 50 images
        onImageGenerated?.(response.image, response.metadata);

        setGenerationState({
          isGenerating: false,
          progress: 100,
          currentStep: params.steps,
          totalSteps: params.steps,
          estimatedTimeRemaining: 0,
          error: null,
          canCancel: false,
          isPaused: false,
        });
      } else {
        throw new Error(response.error || 'Generation failed');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setGenerationState(prev => ({
          ...prev,
          isGenerating: false,
          error: 'Generation cancelled',
        }));
      } else {
        const errorMessage = error.message || 'An unexpected error occurred';
        setGenerationState(prev => ({
          ...prev,
          isGenerating: false,
          error: errorMessage,
        }));
        onError?.(errorMessage);
      }
    } finally {
      setAbortController(null);
    }
  }, [params, isValidationValid, generationState.isGenerating, onImageGenerated, onError]);

  const handleCancel = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  const handleRetry = useCallback(() => {
    setGenerationState(prev => ({ ...prev, error: null }));
    handleGenerate();
  }, [handleGenerate]);

  const handleDownload = useCallback(() => {
    if (currentImage) {
      const link = document.createElement('a');
      link.href = currentImage;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [currentImage]);

  const handleCopy = useCallback(async () => {
    if (currentImage) {
      try {
        const response = await fetch(currentImage);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
      } catch (error) {
        console.error('Failed to copy image:', error);
      }
    }
  }, [currentImage]);

  const canGenerate = !generationState.isGenerating && isValidationValid && params.prompt.trim().length > 0;

  return (
    <div className={cn('min-h-screen relative overflow-hidden', className)}>
      {/* Enhanced Glass Background */}
      <div className="absolute inset-0">
        {/* Primary gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950" />

        {/* Animated glass orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-br from-indigo-400/15 to-blue-400/15 rounded-full blur-2xl animate-pulse delay-2000" />

        {/* Glass texture overlay */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20"
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`,
             }} />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-6 space-y-6">
        {/* Primary Generation Section (Hero Area) */}
        <div className="h-[40vh] min-h-[380px]">
          <PrimaryGenerationSection
            params={params}
            onChange={handleParamsChange}
            onGenerate={handleGenerate}
            disabled={generationState.isGenerating}
            isGenerating={generationState.isGenerating}
            canGenerate={canGenerate}
            className="h-full"
          />
        </div>



        {/* Main Content Grid - Image Display + Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Image Display Section (2 columns on large screens) */}
          <div className="lg:col-span-2 space-y-6">

          </div>

          {/* Controls Section (1 column on large screens) */}
          <div className="space-y-6">
          </div>
        </div>


      </div>
    </div>
  );
};

export default EnhancedImageGenerator;
