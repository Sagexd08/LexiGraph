import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2,
  Shuffle,
  Wand,
  Copy,
  RefreshCw,
  Brain,
  Layers,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Zap,
  Settings,
  Sparkles,
  Star,
  Plus
} from 'lucide-react';
import { GenerationParams, VALIDATION_CONSTRAINTS } from '../types/api';
import { validateGenerationParams } from '../utils/validation';
import { Button, Card, PromptInput } from './ui';
import { cn } from '../utils/cn';
import { SPACING } from '../design-system/tokens';
import { useAppStore } from '../store';
import { useRealTimeGeneration } from '../hooks/useRealTimeGeneration';

interface PrimaryGenerationSectionProps {
  params: GenerationParams;
  onChange: (updates: Partial<GenerationParams>) => void;
  onGenerate: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  canGenerate?: boolean;
  className?: string;
  showAdvancedFeatures?: boolean;
  onShowAIBuilder?: () => void;
  onShowBatchQueue?: () => void;
  generationProgress?: number;
  estimatedTime?: number;
}

const PrimaryGenerationSection: React.FC<PrimaryGenerationSectionProps> = ({
  params,
  onChange,
  onGenerate,
  disabled = false,
  isGenerating = false,
  canGenerate = true,
  className,
  showAdvancedFeatures = true,
  onShowAIBuilder,
  onShowBatchQueue,
  generationProgress = 0,
  estimatedTime = 0,
}) => {
  const [isTypingAnimation, setIsTypingAnimation] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { showNotification } = useAppStore();
  const { isConnected } = useRealTimeGeneration();

  // Validation
  const validationResult = validateGenerationParams(params);
  const promptError = validationResult.errors.find(e => e.field === 'prompt')?.message;

  // Handle prompt change
  const handlePromptChange = useCallback((value: string) => {
    onChange({ prompt: value });
  }, [onChange]);

  // Handle negative prompt change
  const handleNegativePromptChange = useCallback((value: string) => {
    onChange({ negativePrompt: value });
  }, [onChange]);

  // Auto-enhance prompt with AI suggestions
  const enhancePrompt = useCallback(async () => {
    if (!params.prompt?.trim()) return;

    const randomEnhancement = quickEnhancements[Math.floor(Math.random() * quickEnhancements.length)];
    const enhancedPrompt = `${params.prompt}, ${randomEnhancement}`;

    onChange({ prompt: enhancedPrompt });

    showNotification({
      type: 'success',
      title: 'Prompt Enhanced',
      message: 'Added AI quality improvements to your prompt',
      duration: 3000,
    });
  }, [params.prompt, onChange, showNotification]);

  // Apply random suggestion
  const applyRandomSuggestion = useCallback(() => {
    const allPrompts = suggestedPrompts.flatMap(category => category.prompts);
    const randomPrompt = allPrompts[Math.floor(Math.random() * allPrompts.length)];
    startTypingAnimation(randomPrompt);
  }, []);

  // Typing animation for suggestions
  const startTypingAnimation = useCallback((targetPrompt: string) => {
    if (isTypingAnimation) return;

    setIsTypingAnimation(true);
    let currentText = '';
    let charIndex = 0;

    const typeChar = () => {
      if (charIndex < targetPrompt.length) {
        currentText += targetPrompt[charIndex];
        onChange({ prompt: currentText });
        charIndex++;
        typingIntervalRef.current = setTimeout(typeChar, 50);
      } else {
        setIsTypingAnimation(false);
      }
    };

    onChange({ prompt: '' });
    typeChar();
  }, [isTypingAnimation, onChange]);

  // Copy prompt to clipboard
  const copyPrompt = useCallback(async () => {
    if (!params.prompt) return;

    try {
      await navigator.clipboard.writeText(params.prompt);
      showNotification({
        type: 'success',
        title: 'Copied',
        message: 'Prompt copied to clipboard',
        duration: 2000,
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Copy Failed',
        message: 'Failed to copy prompt',
        duration: 3000,
      });
    }
  }, [params.prompt, showNotification]);

  // Clear prompt
  const clearPrompt = useCallback(() => {
    onChange({ prompt: '', negativePrompt: '' });
  }, [onChange]);

  // Cleanup typing animation on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearTimeout(typingIntervalRef.current);
      }
    };
  }, []);

  // Enhanced suggested prompts with categories and metadata
  const suggestedPrompts = [
    {
      category: "Landscape",
      prompts: [
        "A majestic mountain landscape at sunset with golden light reflecting on a crystal-clear lake, photorealistic, 8k resolution",
        "Serene ocean waves crashing against dramatic cliffs under a starry night sky, long exposure photography",
        "Ancient redwood forest with rays of sunlight filtering through misty air, ethereal atmosphere",
        "Desert sand dunes at dawn with purple and orange sky, minimalist composition"
      ]
    },
    {
      category: "Fantasy",
      prompts: [
        "A detailed portrait of a wise elderly wizard with a long flowing beard and mystical glowing eyes, fantasy art",
        "An enchanted forest with bioluminescent mushrooms and fairy lights dancing between ancient trees",
        "Majestic dragon soaring through storm clouds with lightning illuminating its scales",
        "Crystal cave with floating magical orbs and prismatic light reflections"
      ]
    },
    {
      category: "Sci-Fi",
      prompts: [
        "A futuristic cyberpunk cityscape with neon lights and flying vehicles in the rain, blade runner style",
        "Space station orbiting a distant planet with nebula in the background, cinematic lighting",
        "Robot warrior in a post-apocalyptic wasteland, detailed mechanical design",
        "Alien landscape with multiple moons and exotic flora, otherworldly atmosphere"
      ]
    },
    {
      category: "Portrait",
      prompts: [
        "Professional headshot of a confident business woman, studio lighting, sharp focus",
        "Artistic portrait of a musician with dramatic side lighting and vintage aesthetic",
        "Child's portrait with natural smile and soft window lighting",
        "Elder's weathered hands holding an antique pocket watch, macro photography"
      ]
    }
  ];



  const quickEnhancements = [
    "highly detailed, masterpiece quality",
    "professional photography, perfect lighting",
    "digital art, trending on artstation",
    "cinematic composition, award winning",
    "photorealistic, 8k resolution, sharp focus"
  ];

  return (
    <div className={cn('w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 sm:py-8 md:py-12 lg:py-16 xl:py-20', className)}>
      {/* Enhanced Glass Hero Section */}
      <div className="relative overflow-hidden rounded-3xl">
        {/* Enhanced Multi-layered glass background */}
        <div className="absolute inset-0">
          {/* Primary glass layer with enhanced blur */}
          <div className="absolute inset-0 bg-white/15 dark:bg-white/8 backdrop-blur-2xl border border-white/30 dark:border-white/15 rounded-3xl shadow-2xl" />

          {/* Secondary glass layer for depth with stronger gradient */}
          <div className="absolute inset-1 bg-gradient-to-br from-white/25 via-white/15 to-white/5 dark:from-white/15 dark:via-white/8 dark:to-white/2 rounded-3xl" />

          {/* Tertiary glass layer for extra depth */}
          <div className="absolute inset-2 bg-gradient-to-tl from-transparent via-white/10 to-white/20 dark:from-transparent dark:via-white/5 dark:to-white/10 rounded-3xl" />

          {/* Animated gradient overlay with stronger colors */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-500/15 via-purple-500/15 to-indigo-500/15 dark:from-blue-400/20 dark:via-purple-400/20 dark:to-indigo-400/20 rounded-3xl"
            animate={{
              background: [
                "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.15), rgba(99, 102, 241, 0.15))",
                "linear-gradient(135deg, rgba(147, 51, 234, 0.15), rgba(99, 102, 241, 0.15), rgba(59, 130, 246, 0.15))",
                "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.15))"
              ]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Enhanced noise texture for glass realism */}
          <div className="absolute inset-0 opacity-40 dark:opacity-25 rounded-3xl"
               style={{
                 backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")`,
                 backgroundSize: '200px 200px'
               }} />

          {/* Enhanced glow effect with animation */}
          <motion.div
            className="absolute -inset-2 bg-gradient-to-r from-blue-500/25 via-purple-500/25 to-indigo-500/25 rounded-3xl blur-2xl"
            animate={{
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.02, 1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Floating glass orbs for depth */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <motion.div
              className="absolute top-10 left-10 w-20 h-20 bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-full border border-white/20"
              animate={{
                y: [0, -10, 0],
                x: [0, 5, 0],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-20 right-16 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-full border border-white/15"
              animate={{
                y: [0, 8, 0],
                x: [0, -3, 0],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            />
            <motion.div
              className="absolute top-1/2 right-8 w-12 h-12 bg-gradient-to-br from-indigo-500/15 to-pink-500/15 backdrop-blur-md rounded-full border border-white/10"
              animate={{
                y: [0, -6, 0],
                x: [0, 4, 0],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 4
              }}
            />
          </div>

          {/* Glass reflection effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent dark:from-white/10 rounded-3xl"
               style={{
                 background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 25%, transparent 50%)'
               }} />
        </div>

        {/* Content Container */}
        <div className="relative z-10 p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 space-y-4 sm:space-y-6 md:space-y-8">
          {/* Enhanced Header with Advanced Controls */}
          <div className="text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center"
            >
              {/* Glass icon container with pulsing animation */}
              <div className="relative">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-2xl blur-lg opacity-60"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.6, 0.8, 0.6]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <div className="relative p-4 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/30 dark:border-white/20 shadow-2xl">
                  <motion.div
                    animate={{
                      rotate: isGenerating ? 360 : 0,
                    }}
                    transition={{
                      duration: 2,
                      repeat: isGenerating ? Infinity : 0,
                      ease: "linear"
                    }}
                  >
                    <Wand2 className="h-7 w-7 text-white drop-shadow-lg" />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Advanced Control Bar */}
            {showAdvancedFeatures && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="flex items-center justify-center space-x-3"
              >
                <div className="flex items-center space-x-2 bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20">
                  {/* AI Builder Button */}
                  <button
                    onClick={onShowAIBuilder}
                    className="flex items-center space-x-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title="Open AI Prompt Builder"
                  >
                    <Brain className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium">AI Builder</span>
                  </button>

                  {/* Batch Queue Button */}
                  <button
                    onClick={onShowBatchQueue}
                    className="flex items-center space-x-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title="Open Batch Queue"
                  >
                    <Layers className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium">Batch</span>
                  </button>

                  {/* Connection Status */}
                  <div className="flex items-center space-x-2 px-3 py-1">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                    )} />
                    <span className="text-xs text-gray-400">
                      {isConnected ? 'Live' : 'Offline'}
                    </span>
                  </div>

                  {/* Sound Toggle */}
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title={soundEnabled ? "Disable sounds" : "Enable sounds"}
                  >
                    {soundEnabled ?
                      <Volume2 className="h-4 w-4 text-green-400" /> :
                      <VolumeX className="h-4 w-4 text-gray-400" />
                    }
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Enhanced Prompt Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Quick Action Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={applyRandomSuggestion}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative flex items-center space-x-2 px-4 py-2 bg-white/12 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/25 transition-all duration-300 shadow-lg hover:shadow-xl group overflow-hidden"
                  title="Get random inspiration"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Shuffle className="h-4 w-4 text-yellow-400 relative z-10" />
                  <span className="text-sm font-medium relative z-10">Inspire Me</span>
                </motion.button>

                <motion.button
                  onClick={enhancePrompt}
                  disabled={!params.prompt?.trim()}
                  whileHover={{ scale: !params.prompt?.trim() ? 1 : 1.05 }}
                  whileTap={{ scale: !params.prompt?.trim() ? 1 : 0.95 }}
                  className="relative flex items-center space-x-2 px-4 py-2 bg-white/12 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/25 transition-all duration-300 shadow-lg hover:shadow-xl group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  title="Enhance with AI"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Wand className="h-4 w-4 text-purple-400 relative z-10" />
                  <span className="text-sm font-medium relative z-10">Enhance</span>
                </motion.button>


              </div>

              <div className="flex items-center space-x-2">
                {params.prompt && (
                  <>
                    <motion.button
                      onClick={copyPrompt}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="relative p-2 bg-white/12 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/25 transition-all duration-300 shadow-lg hover:shadow-xl group overflow-hidden"
                      title="Copy prompt"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <Copy className="h-4 w-4 text-gray-400 group-hover:text-green-400 transition-colors duration-300 relative z-10" />
                    </motion.button>

                    <motion.button
                      onClick={clearPrompt}
                      whileHover={{ scale: 1.1, rotate: 180 }}
                      whileTap={{ scale: 0.9 }}
                      className="relative p-2 bg-white/12 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/25 transition-all duration-300 shadow-lg hover:shadow-xl group overflow-hidden"
                      title="Clear prompt"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <RefreshCw className="h-4 w-4 text-gray-400 group-hover:text-red-400 transition-colors duration-300 relative z-10" />
                    </motion.button>
                  </>
                )}
              </div>
            </div>

            {/* Main Prompt Container - Clean Design */}
            <div className="relative">
              <PromptInput
                value={params.prompt || ''}
                onChange={handlePromptChange}
                placeholder="Describe your vision in detail... The more specific you are, the better the results!"
                disabled={disabled || isGenerating || isTypingAnimation}
                maxLength={VALIDATION_CONSTRAINTS.prompt.maxLength}
                minLength={VALIDATION_CONSTRAINTS.prompt.minLength}
                showCharacterCount={true}
                showValidation={false}
                autoResize={true}
                minRows={4}
                maxRows={8}
                suggestions={suggestedPrompts.flatMap(cat => cat.prompts)}
                showSuggestions={false}
                className={cn(
                  "text-lg bg-transparent border-0 focus:ring-0 focus:outline-none transition-all duration-300",
                  isTypingAnimation && "animate-pulse"
                )}
              />

              {/* Enhanced Typing indicator */}
              {isTypingAnimation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-4 right-4 flex items-center space-x-2 bg-black/60 backdrop-blur-md text-white px-3 py-2 rounded-full text-xs border border-white/20"
                >
                  <motion.div
                    className="w-2 h-2 bg-blue-400 rounded-full"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span>AI typing...</span>
                </motion.div>
              )}
            </div>



            {/* Negative Prompt Container - Clean Design */}
            <div className="relative">
              <PromptInput
                value={params.negativePrompt || ''}
                onChange={handleNegativePromptChange}
                placeholder="What you don't want in the image (optional)..."
                disabled={disabled || isGenerating}
                maxLength={VALIDATION_CONSTRAINTS.prompt.maxLength}
                minLength={0}
                showCharacterCount={true}
                showValidation={false}
                autoResize={true}
                minRows={2}
                maxRows={4}
                suggestions={[]}
                showSuggestions={false}
                className="text-sm opacity-90 bg-transparent border-0 focus:ring-0 focus:outline-none"
              />
            </div>


          </motion.div>

          {/* Enhanced Generate Button with Progress */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col items-center space-y-4 pt-4"
          >
            {/* Progress Bar (when generating) */}
            <AnimatePresence>
              {isGenerating && generationProgress > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-full max-w-md"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-full border border-white/20" />

                    <div className="relative z-10 p-1">
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${generationProgress}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>{Math.round(generationProgress)}% complete</span>
                    {estimatedTime > 0 && (
                      <span>~{Math.ceil(estimatedTime / 1000)}s remaining</span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Glass button container */}
            <div className="relative">
              {/* Dynamic button glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-indigo-500/30 rounded-2xl blur-xl"
                animate={{
                  opacity: isGenerating ? [0.3, 0.8, 0.3] : 0.6,
                  scale: isGenerating ? [1, 1.1, 1] : 1
                }}
                transition={{
                  duration: 2,
                  repeat: isGenerating ? Infinity : 0,
                  ease: "easeInOut"
                }}
              />

              <Button
                onClick={onGenerate}
                disabled={disabled || isGenerating || !validationResult.isValid}
                variant="primary"
                size="xl"
                glowEffect={true}
                className={cn(
                  "relative px-12 py-4 text-lg font-bold border border-white/20 backdrop-blur-sm shadow-2xl transition-all duration-300",
                  isGenerating
                    ? "bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600"
                    : "bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transform hover:scale-105"
                )}
                icon={
                  isGenerating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Zap className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )
                }
              >
                {isGenerating ? (
                  <span className="flex items-center space-x-2">
                    <span>Generating</span>
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      ...
                    </motion.span>
                  </span>
                ) : (
                  'Generate Image'
                )}
              </Button>
            </div>

            {/* Quick Generation Options */}
            {!isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center space-x-2"
              >
                <button
                  onClick={() => {
                    // Quick generate with speed preset
                    onChange({ num_inference_steps: 10 });
                    onGenerate();
                  }}
                  className="flex items-center space-x-1 px-3 py-1 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg border border-white/20 transition-all duration-200 text-xs"
                  title="Quick generation (10 steps)"
                >
                  <Zap className="h-3 w-3 text-yellow-400" />
                  <span>Quick</span>
                </button>

                <button
                  onClick={() => {
                    // Quality generate with more steps
                    onChange({ num_inference_steps: 50 });
                    onGenerate();
                  }}
                  className="flex items-center space-x-1 px-3 py-1 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg border border-white/20 transition-all duration-200 text-xs"
                  title="Quality generation (50 steps)"
                >
                  <Star className="h-3 w-3 text-blue-400" />
                  <span>Quality</span>
                </button>

                <button
                  onClick={() => {
                    // Add to batch queue instead of immediate generation
                    onShowBatchQueue?.();
                  }}
                  className="flex items-center space-x-1 px-3 py-1 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg border border-white/20 transition-all duration-200 text-xs"
                  title="Add to batch queue"
                >
                  <Plus className="h-3 w-3 text-green-400" />
                  <span>Queue</span>
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* Enhanced Status/Info Bar with Real-time Data */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="relative"
          >
            {/* Enhanced Glass background for status bar */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-white/12 dark:bg-white/6 backdrop-blur-xl rounded-xl border border-white/20 dark:border-white/12 shadow-lg" />
              <div className="absolute inset-1 bg-gradient-to-br from-white/15 via-white/8 to-transparent dark:from-white/8 dark:via-white/4 dark:to-transparent rounded-xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-xl" />
            </div>

            <div className="relative z-10 py-3 px-3 sm:py-4 sm:px-4 md:px-6 lg:px-8">




              {/* Character Count for Prompt */}
              {params.prompt && (
                <div className="mt-2 flex justify-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span className={cn(
                      "font-mono",
                      params.prompt.length > VALIDATION_CONSTRAINTS.prompt.maxLength * 0.9 && "text-yellow-500",
                      params.prompt.length >= VALIDATION_CONSTRAINTS.prompt.maxLength && "text-red-500"
                    )}>
                      {params.prompt.length}
                    </span>
                    <span className="mx-1">/</span>
                    <span className="font-mono">{VALIDATION_CONSTRAINTS.prompt.maxLength}</span>
                    <span className="ml-2">characters</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PrimaryGenerationSection;
export type { PrimaryGenerationSectionProps };
