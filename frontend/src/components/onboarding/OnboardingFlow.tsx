/**
 * Onboarding Flow Component
 * Interactive onboarding experience for new users
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Wand2, 
  Palette, 
  Settings, 
  Check,
  Play,
  ArrowRight,
} from 'lucide-react';
import { GlassCard, AdvancedButton } from '../../design-system';
import { cn } from '../../utils/cn';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to LexiGraph',
      description: 'Your AI-powered image generation studio',
      content: (
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', bounce: 0.4 }}
            className="w-24 h-24 mx-auto bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center"
          >
            <Sparkles className="h-12 w-12 text-white" />
          </motion.div>
          
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Create Amazing Images with AI
            </h2>
            <p className="text-neutral-300 text-lg max-w-md mx-auto">
              Transform your ideas into stunning visuals using state-of-the-art AI technology.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            {[
              { icon: Wand2, label: 'Generate' },
              { icon: Palette, label: 'Customize' },
              { icon: Settings, label: 'Control' },
            ].map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto bg-white/10 rounded-xl flex items-center justify-center mb-2">
                  <feature.icon className="h-6 w-6 text-primary-400" />
                </div>
                <p className="text-sm text-neutral-400">{feature.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'navigation',
      title: 'Navigate Like a Pro',
      description: 'Learn the interface and key features',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Sidebar Navigation</h3>
              <div className="space-y-3">
                {[
                  { label: 'Generate', desc: 'Create single images' },
                  { label: 'Batch', desc: 'Process multiple images' },
                  { label: 'Gallery', desc: 'View your creations' },
                  { label: 'Templates', desc: 'Use preset styles' },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-primary-500 rounded-full" />
                    <div>
                      <p className="text-white font-medium">{item.label}</p>
                      <p className="text-neutral-400 text-sm">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Quick Actions</h3>
              <div className="space-y-3">
                {[
                  { key: '⌘K', desc: 'Quick search' },
                  { key: '⌘N', desc: 'New generation' },
                  { key: '⌘S', desc: 'Save current work' },
                  { key: '⌘?', desc: 'Show help' },
                ].map((shortcut, index) => (
                  <motion.div
                    key={shortcut.key}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <span className="text-neutral-300">{shortcut.desc}</span>
                    <kbd className="px-2 py-1 bg-neutral-700 text-neutral-300 rounded text-sm">
                      {shortcut.key}
                    </kbd>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'generation',
      title: 'Your First Generation',
      description: 'Let\'s create your first AI image',
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-white mb-4">
              Ready to Create?
            </h3>
            <p className="text-neutral-300 mb-6">
              Follow these simple steps to generate your first image:
            </p>
          </div>

          <div className="space-y-4">
            {[
              { step: 1, title: 'Choose a Template', desc: 'Start with a preset or go custom' },
              { step: 2, title: 'Write Your Prompt', desc: 'Describe what you want to create' },
              { step: 3, title: 'Select a Style', desc: 'Pick from realistic, artistic, or anime' },
              { step: 4, title: 'Generate', desc: 'Click generate and watch the magic happen' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="flex items-start space-x-4 p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {item.step}
                </div>
                <div>
                  <h4 className="text-white font-medium">{item.title}</h4>
                  <p className="text-neutral-400 text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ),
      action: {
        label: 'Start Creating',
        onClick: () => {
          onComplete();
          // Navigate to generation page
        },
      },
    },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    onComplete();
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <GlassCard variant="elevated" className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">{currentStepData.title}</h1>
              <p className="text-neutral-400">{currentStepData.description}</p>
            </div>
            
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              {steps.map((_, index) => (
                <div key={index} className="flex items-center">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                    index < currentStep || completedSteps.has(index)
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                      : index === currentStep
                      ? 'bg-white/20 text-white border-2 border-primary-500'
                      : 'bg-white/10 text-neutral-400'
                  )}>
                    {index < currentStep || completedSteps.has(index) ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={cn(
                      'w-12 h-0.5 mx-2 transition-colors',
                      index < currentStep ? 'bg-primary-500' : 'bg-white/20'
                    )} />
                  )}
                </div>
              ))}
            </div>
            
            <p className="text-sm text-neutral-400">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              {currentStepData.content}
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <AdvancedButton
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0}
              icon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </AdvancedButton>

            <div className="flex space-x-3">
              <AdvancedButton
                variant="secondary"
                onClick={onClose}
              >
                Skip Tour
              </AdvancedButton>

              {currentStepData.action ? (
                <AdvancedButton
                  variant="gradient"
                  onClick={currentStepData.action.onClick}
                  icon={<Play className="h-4 w-4" />}
                  iconPosition="right"
                >
                  {currentStepData.action.label}
                </AdvancedButton>
              ) : isLastStep ? (
                <AdvancedButton
                  variant="gradient"
                  onClick={handleComplete}
                  icon={<Check className="h-4 w-4" />}
                  iconPosition="right"
                >
                  Complete Tour
                </AdvancedButton>
              ) : (
                <AdvancedButton
                  variant="primary"
                  onClick={nextStep}
                  icon={<ChevronRight className="h-4 w-4" />}
                  iconPosition="right"
                >
                  Next
                </AdvancedButton>
              )}
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

export default OnboardingFlow;
