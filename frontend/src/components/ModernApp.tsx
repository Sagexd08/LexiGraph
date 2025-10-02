/**
 * Modern App Component
 * Redesigned LexiGraph application with advanced UI/UX enhancements
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout, TabNavigation } from './layout';
import OnboardingFlow from './onboarding/OnboardingFlow';
import KeyboardShortcuts from './help/KeyboardShortcuts';
import AdvancedImageGallery from './gallery/AdvancedImageGallery';
import AnalyticsDashboard from './analytics/AnalyticsDashboard';
import { GlassCard, AdvancedButton } from '../design-system';
import EnhancedImageGenerator from './enhanced/EnhancedImageGenerator';
import { AIAssistant } from './advanced/AIAssistant';
import { RealTimePreview } from './advanced/RealTimePreview';
import { AdvancedControls } from './advanced/AdvancedControls';
import { PerformanceMonitor } from './advanced/PerformanceMonitor';
import { BatchProcessor } from './advanced/BatchProcessor';
import { cn } from '../lib/utils';

// Mock data for demonstration
const mockImages = [
  {
    id: '1',
    url: '/api/placeholder/512/512',
    thumbnail: '/api/placeholder/256/256',
    title: 'Cyberpunk Portrait',
    prompt: 'A futuristic cyberpunk character with neon lights',
    style: 'Cyberpunk',
    dimensions: { width: 512, height: 512 },
    createdAt: new Date('2024-01-15'),
    isFavorite: true,
    tags: ['portrait', 'cyberpunk', 'neon'],
    metadata: { steps: 30, guidance: 7.5, seed: 12345, model: 'SDXL' },
  },
  {
    id: '2',
    url: '/api/placeholder/768/512',
    thumbnail: '/api/placeholder/256/170',
    title: 'Fantasy Landscape',
    prompt: 'A magical forest with floating islands and waterfalls',
    style: 'Fantasy',
    dimensions: { width: 768, height: 512 },
    createdAt: new Date('2024-01-14'),
    isFavorite: false,
    tags: ['landscape', 'fantasy', 'nature'],
    metadata: { steps: 25, guidance: 8.0, seed: 67890, model: 'SDXL' },
  },
  // Add more mock images as needed
];

interface ModernAppProps {
  // Props for backward compatibility
}

const ModernApp: React.FC<ModernAppProps> = () => {
  const [activeSection, setActiveSection] = useState('generate');
  const [activeTab, setActiveTab] = useState('single');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  // Advanced generation state
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationParams, setGenerationParams] = useState({
    steps: 20,
    cfg_scale: 7.5,
    width: 512,
    height: 512,
    sampler: 'DPM++ 2M Karras',
    eta: 0.0,
    clip_skip: 1,
    prompt_strength: 1.0,
    negative_prompt_strength: 1.0,
    upscale: false,
    face_restoration: false,
    color_correction: false,
    vae: 'auto',
    tiling: false,
    karras_sigmas: true
  });

  // Check if user is new
  useEffect(() => {
    const hasVisited = localStorage.getItem('lexigraph-visited');
    if (!hasVisited) {
      setShowOnboarding(true);
      setIsFirstVisit(true);
    } else {
      setIsFirstVisit(false);
    }
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Command/Ctrl + K for search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        // TODO: Implement global search
      }
      
      // Command/Ctrl + ? for help
      if ((event.metaKey || event.ctrlKey) && event.key === '?') {
        event.preventDefault();
        setShowKeyboardShortcuts(true);
      }

      // Command/Ctrl + N for new generation
      if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
        event.preventDefault();
        setActiveSection('generate');
        setActiveTab('single');
      }

      // Number keys for navigation
      if ((event.metaKey || event.ctrlKey) && /^[1-4]$/.test(event.key)) {
        event.preventDefault();
        const sections = ['generate', 'batch', 'gallery', 'templates'];
        setActiveSection(sections[parseInt(event.key) - 1]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('lexigraph-visited', 'true');
    setIsFirstVisit(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'generate':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Generate Images</h1>
                <p className="text-neutral-400">Create stunning AI-generated images with advanced controls</p>
              </div>
              
              {isFirstVisit && (
                <AdvancedButton
                  variant="glass"
                  onClick={() => setShowOnboarding(true)}
                >
                  Take Tour
                </AdvancedButton>
              )}
            </div>

            <TabNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'single' && (
                  <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Main Generation Area */}
                    <div className="xl:col-span-3 space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Image Generator */}
                        <GlassCard variant="elevated" className="p-6">
                          <EnhancedImageGenerator />
                        </GlassCard>

                        {/* Real-Time Preview */}
                        <RealTimePreview
                          prompt={currentPrompt}
                          params={generationParams}
                          onImageGenerated={(imageUrl) => {
                            console.log('Generated image:', imageUrl);
                            setIsGenerating(false);
                          }}
                        />
                      </div>



                      {/* Performance Monitor */}
                      <PerformanceMonitor />
                    </div>

                    {/* Advanced Controls Sidebar */}
                    <div className="space-y-6">
                      {/* AI Assistant */}
                      <AIAssistant
                        currentPrompt={currentPrompt}
                        onPromptSuggestion={(prompt) => {
                          setCurrentPrompt(prompt);
                        }}
                      />

                      {/* Advanced Controls */}
                      <AdvancedControls
                        params={generationParams}
                        onChange={setGenerationParams}
                        onPresetLoad={(preset) => {
                          setGenerationParams(preset);
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {activeTab === 'batch' && (
                  <BatchProcessor />
                )}
                
                {activeTab === 'advanced' && (
                  <GlassCard variant="elevated" className="p-6">
                    <div className="text-center py-12">
                      <h3 className="text-xl font-semibold text-white mb-4">Advanced Mode</h3>
                      <p className="text-neutral-400 mb-6">Fine-tune every parameter with professional controls</p>
                      <AdvancedButton variant="primary">
                        Open Advanced Editor
                      </AdvancedButton>
                    </div>
                  </GlassCard>
                )}
                
                {activeTab === 'quick' && (
                  <GlassCard variant="elevated" className="p-6">
                    <div className="text-center py-12">
                      <h3 className="text-xl font-semibold text-white mb-4">Quick Generate</h3>
                      <p className="text-neutral-400 mb-6">Fast generation with optimized presets</p>
                      <AdvancedButton variant="gradient">
                        Quick Start
                      </AdvancedButton>
                    </div>
                  </GlassCard>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        );

      case 'gallery':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Image Gallery</h1>
              <p className="text-neutral-400">Browse, organize, and manage your AI-generated images</p>
            </div>

            <AdvancedImageGallery
              images={mockImages}
              onImageSelect={(image) => console.log('Selected:', image)}
              onImageDelete={(id) => console.log('Delete:', id)}
              onImageFavorite={(id) => console.log('Favorite:', id)}
            />
          </div>
        );

      case 'dashboard':
        return <AnalyticsDashboard />;

      case 'styles':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Style Manager</h1>
              <p className="text-neutral-400">Manage and customize your image generation styles</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['Photorealistic', 'Artistic', 'Anime', 'Abstract', 'Portrait', 'Landscape'].map((style) => (
                <GlassCard key={style} variant="elevated" className="p-6">
                  <div className="aspect-square bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-lg mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">{style}</h3>
                  <p className="text-neutral-400 text-sm mb-4">Professional {style.toLowerCase()} style</p>
                  <AdvancedButton variant="secondary" size="sm" className="w-full">
                    Apply Style
                  </AdvancedButton>
                </GlassCard>
              ))}
            </div>
          </div>
        );

      case 'templates':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Templates</h1>
              <p className="text-neutral-400">Pre-configured templates for quick generation</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['Professional Portrait', 'Artistic Landscape', 'Fantasy Character', 'Product Photography', 'Abstract Art', 'Architectural'].map((template) => (
                <GlassCard key={template} variant="elevated" className="p-6">
                  <div className="aspect-video bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-lg mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">{template}</h3>
                  <p className="text-neutral-400 text-sm mb-4">Optimized settings for {template.toLowerCase()}</p>
                  <AdvancedButton variant="primary" size="sm" className="w-full">
                    Use Template
                  </AdvancedButton>
                </GlassCard>
              ))}
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Generation History</h1>
              <p className="text-neutral-400">View and manage your generation history</p>
            </div>
            <GlassCard variant="elevated" className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-lg" />
                    <div className="flex-1">
                      <h4 className="text-white font-medium">Generation #{i + 1}</h4>
                      <p className="text-neutral-400 text-sm">Generated 2 hours ago</p>
                    </div>
                    <AdvancedButton variant="ghost" size="sm">
                      View
                    </AdvancedButton>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        );

      case 'favorites':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Favorites</h1>
              <p className="text-neutral-400">Your favorite generated images</p>
            </div>
            <AdvancedImageGallery
              images={mockImages.filter(img => img.isFavorite)}
              onImageSelect={(image) => console.log('Selected:', image)}
              onImageDelete={(id) => console.log('Delete:', id)}
              onImageFavorite={(id) => console.log('Favorite:', id)}
            />
          </div>
        );

      case 'analytics':
        return <AnalyticsDashboard />;

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
              <p className="text-neutral-400">Configure your LexiGraph preferences</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard variant="elevated" className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">General</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white">Dark Mode</span>
                    <div className="w-12 h-6 bg-primary-500 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5" />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        );

      case 'help':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Help & Support</h1>
              <p className="text-neutral-400">Get help and learn how to use LexiGraph</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Getting Started', desc: 'Learn the basics of image generation' },
                { title: 'Advanced Features', desc: 'Explore professional tools and settings' },
                { title: 'Troubleshooting', desc: 'Common issues and solutions' },
              ].map((item) => (
                <GlassCard key={item.title} variant="elevated" className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-neutral-400 text-sm mb-4">{item.desc}</p>
                  <AdvancedButton variant="secondary" size="sm" className="w-full">
                    Learn More
                  </AdvancedButton>
                </GlassCard>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">Coming Soon</h2>
            <p className="text-neutral-400">This section is under development</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen">
      <DashboardLayout
        activeItem={activeSection}
        onItemChange={setActiveSection}
      >
        {renderContent()}
      </DashboardLayout>

      {/* Onboarding Flow */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingFlow
            isOpen={showOnboarding}
            onClose={() => setShowOnboarding(false)}
            onComplete={handleOnboardingComplete}
          />
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts */}
      <AnimatePresence>
        {showKeyboardShortcuts && (
          <KeyboardShortcuts
            isOpen={showKeyboardShortcuts}
            onClose={() => setShowKeyboardShortcuts(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernApp;
