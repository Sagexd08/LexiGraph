/**
 * AI-Powered Prompt Builder Component
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Wand2, 
  Plus, 
  X, 
  Lightbulb, 
  Shuffle, 
  Copy, 
  Save, 
  History, 
  Tag,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Brain,
  Zap,
  Star,
  TrendingUp,
  Clock,
  Users
} from 'lucide-react';
import { cn } from '../utils/cn';
import { GlassCard, AdvancedButton } from '../design-system';
import { useAppStore } from '../store';

interface PromptSuggestion {
  id: string;
  text: string;
  category: string;
  tags: string[];
  popularity: number;
  quality: number;
  source: 'ai' | 'community' | 'trending' | 'personal';
  metadata?: {
    style?: string;
    mood?: string;
    complexity?: 'simple' | 'medium' | 'complex';
    estimatedTime?: number;
  };
}

interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  category: string;
  description: string;
  examples: string[];
}

interface AIPromptBuilderProps {
  initialPrompt?: string;
  onPromptChange?: (prompt: string) => void;
  onPromptSelect?: (prompt: string) => void;
  className?: string;
  maxLength?: number;
}

export const AIPromptBuilder: React.FC<AIPromptBuilderProps> = ({
  initialPrompt = '',
  onPromptChange,
  onPromptSelect,
  className,
  maxLength = 2000,
}) => {
  const [currentPrompt, setCurrentPrompt] = useState(initialPrompt);
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showNotification } = useAppStore();

  // Mock data for demonstration
  const mockSuggestions: PromptSuggestion[] = [
    {
      id: '1',
      text: 'A majestic dragon soaring through clouds at sunset',
      category: 'fantasy',
      tags: ['dragon', 'fantasy', 'sunset', 'clouds'],
      popularity: 95,
      quality: 90,
      source: 'trending',
      metadata: { style: 'cinematic', mood: 'epic', complexity: 'medium' }
    },
    {
      id: '2',
      text: 'Cyberpunk cityscape with neon lights and flying cars',
      category: 'sci-fi',
      tags: ['cyberpunk', 'city', 'neon', 'futuristic'],
      popularity: 88,
      quality: 85,
      source: 'community',
      metadata: { style: 'digital art', mood: 'dark', complexity: 'complex' }
    },
    {
      id: '3',
      text: 'Serene mountain lake with perfect reflections',
      category: 'nature',
      tags: ['mountain', 'lake', 'reflection', 'peaceful'],
      popularity: 76,
      quality: 92,
      source: 'ai',
      metadata: { style: 'photorealistic', mood: 'calm', complexity: 'simple' }
    },
  ];

  const mockTemplates: PromptTemplate[] = [
    {
      id: '1',
      name: 'Character Portrait',
      template: 'A {adjective} {character} with {feature}, {style} art style, {lighting} lighting',
      variables: ['adjective', 'character', 'feature', 'style', 'lighting'],
      category: 'character',
      description: 'Create detailed character portraits with customizable features',
      examples: ['A mysterious wizard with glowing eyes, fantasy art style, dramatic lighting']
    },
    {
      id: '2',
      name: 'Landscape Scene',
      template: '{time_of_day} view of {location} with {weather}, {style} style, {mood} atmosphere',
      variables: ['time_of_day', 'location', 'weather', 'style', 'mood'],
      category: 'landscape',
      description: 'Generate beautiful landscape scenes with atmospheric details',
      examples: ['Sunset view of mountain valley with misty clouds, impressionist style, peaceful atmosphere']
    },
  ];

  // Initialize data
  useEffect(() => {
    setSuggestions(mockSuggestions);
    setTemplates(mockTemplates);
  }, []);

  // Handle prompt change
  const handlePromptChange = useCallback((value: string) => {
    if (value.length <= maxLength) {
      setCurrentPrompt(value);
      onPromptChange?.(value);
    }
  }, [maxLength, onPromptChange]);

  // Generate AI suggestions based on current prompt
  const generateSuggestions = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      // Simulate AI generation delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock AI-generated suggestions based on current prompt
      const aiSuggestions: PromptSuggestion[] = [
        {
          id: `ai_${Date.now()}_1`,
          text: `${currentPrompt}, highly detailed, 8k resolution, professional photography`,
          category: 'enhancement',
          tags: ['detailed', 'high-quality', 'professional'],
          popularity: 0,
          quality: 88,
          source: 'ai',
          metadata: { complexity: 'medium' }
        },
        {
          id: `ai_${Date.now()}_2`,
          text: `${currentPrompt}, digital art, vibrant colors, trending on artstation`,
          category: 'enhancement',
          tags: ['digital art', 'vibrant', 'trending'],
          popularity: 0,
          quality: 85,
          source: 'ai',
          metadata: { complexity: 'medium' }
        },
        {
          id: `ai_${Date.now()}_3`,
          text: `${currentPrompt}, cinematic lighting, dramatic composition, award winning`,
          category: 'enhancement',
          tags: ['cinematic', 'dramatic', 'award winning'],
          popularity: 0,
          quality: 92,
          source: 'ai',
          metadata: { complexity: 'complex' }
        },
      ];
      
      setSuggestions(prev => [...aiSuggestions, ...prev.filter(s => s.source !== 'ai')]);
      
      showNotification({
        type: 'success',
        title: 'AI Suggestions Generated',
        message: `Generated ${aiSuggestions.length} new prompt suggestions`,
        duration: 3000,
      });
      
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate AI suggestions. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  }, [currentPrompt, showNotification]);

  // Enhance current prompt with AI
  const enhancePrompt = useCallback(async () => {
    if (!currentPrompt.trim()) return;
    
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock AI enhancement
      const enhancements = [
        ', highly detailed, masterpiece quality',
        ', professional photography, perfect lighting',
        ', digital art, trending on artstation',
        ', cinematic composition, award winning',
        ', photorealistic, 8k resolution'
      ];
      
      const randomEnhancement = enhancements[Math.floor(Math.random() * enhancements.length)];
      const enhancedPrompt = currentPrompt + randomEnhancement;
      
      handlePromptChange(enhancedPrompt);
      
      showNotification({
        type: 'success',
        title: 'Prompt Enhanced',
        message: 'Your prompt has been enhanced with AI suggestions',
        duration: 3000,
      });
      
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Enhancement Failed',
        message: 'Failed to enhance prompt. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  }, [currentPrompt, handlePromptChange, showNotification]);

  // Apply suggestion to prompt
  const applySuggestion = useCallback((suggestion: PromptSuggestion) => {
    handlePromptChange(suggestion.text);
    onPromptSelect?.(suggestion.text);
    
    // Add to history
    if (!promptHistory.includes(suggestion.text)) {
      setPromptHistory(prev => [suggestion.text, ...prev.slice(0, 9)]);
    }
  }, [handlePromptChange, onPromptSelect, promptHistory]);

  // Apply template
  const applyTemplate = useCallback((template: PromptTemplate) => {
    // For demo, just use the first example
    const examplePrompt = template.examples[0] || template.template;
    handlePromptChange(examplePrompt);
    onPromptSelect?.(examplePrompt);
  }, [handlePromptChange, onPromptSelect]);

  // Copy prompt to clipboard
  const copyPrompt = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
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
        message: 'Failed to copy prompt to clipboard',
        duration: 3000,
      });
    }
  }, [showNotification]);

  // Filter suggestions
  const filteredSuggestions = suggestions.filter(suggestion => {
    const matchesCategory = selectedCategory === 'all' || suggestion.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      suggestion.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      suggestion.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => suggestion.tags.includes(tag));
    
    return matchesCategory && matchesSearch && matchesTags;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(suggestions.map(s => s.category)))];
  
  // Get popular tags
  const allTags = Array.from(new Set(suggestions.flatMap(s => s.tags)));
  const popularTags = allTags.slice(0, 10); // Show top 10 tags

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Prompt Input */}
      <GlassCard className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-500" />
              <span>AI Prompt Builder</span>
            </h3>
            
            <div className="flex items-center space-x-2">
              <AdvancedButton
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                icon={showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              >
                Advanced
              </AdvancedButton>
            </div>
          </div>
          
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={currentPrompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder="Describe what you want to create... (e.g., 'A magical forest with glowing mushrooms')"
              className="w-full h-32 p-4 bg-white/10 dark:bg-white/5 border border-white/20 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
              maxLength={maxLength}
            />
            
            <div className="absolute bottom-2 right-2 flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {currentPrompt.length}/{maxLength}
              </span>
              
              {currentPrompt.trim() && (
                <AdvancedButton
                  variant="ghost"
                  size="xs"
                  onClick={() => copyPrompt(currentPrompt)}
                  icon={<Copy className="w-3 h-3" />}
                  title="Copy prompt"
                />
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <AdvancedButton
              variant="primary"
              size="sm"
              onClick={enhancePrompt}
              disabled={!currentPrompt.trim() || isGenerating}
              icon={<Wand2 className="w-4 h-4" />}
              loading={isGenerating}
            >
              Enhance with AI
            </AdvancedButton>
            
            <AdvancedButton
              variant="secondary"
              size="sm"
              onClick={generateSuggestions}
              disabled={isGenerating}
              icon={<Sparkles className="w-4 h-4" />}
              loading={isGenerating}
            >
              Generate Suggestions
            </AdvancedButton>
            
            <AdvancedButton
              variant="ghost"
              size="sm"
              onClick={() => handlePromptChange('')}
              icon={<X className="w-4 h-4" />}
            >
              Clear
            </AdvancedButton>
          </div>
        </div>
      </GlassCard>

      {/* Advanced Options */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Filters & Search</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search suggestions..."
                      className="w-full pl-10 pr-4 py-2 bg-white/10 dark:bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 bg-white/10 dark:bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                  
                  {/* Source Filter */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Source:</span>
                    <div className="flex space-x-1">
                      {['ai', 'community', 'trending'].map(source => (
                        <button
                          key={source}
                          className={cn(
                            'px-2 py-1 text-xs rounded transition-colors',
                            'bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10'
                          )}
                        >
                          {source}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Popular Tags */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Popular Tags</h5>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (selectedTags.includes(tag)) {
                            setSelectedTags(prev => prev.filter(t => t !== tag));
                          } else {
                            setSelectedTags(prev => [...prev, tag]);
                          }
                        }}
                        className={cn(
                          'px-3 py-1 text-xs rounded-full transition-colors',
                          selectedTags.includes(tag)
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10'
                        )}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Templates */}
      <GlassCard className="p-6">
        <div className="space-y-4">
          <h4 className="font-medium flex items-center space-x-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span>Prompt Templates</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(template => (
              <div
                key={template.id}
                className="p-4 bg-white/5 dark:bg-white/3 rounded-lg border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
                onClick={() => applyTemplate(template)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium">{template.name}</h5>
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {template.category}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {template.description}
                </p>
                
                <div className="text-xs text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {template.template}
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Suggestions */}
      <GlassCard className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>Suggestions ({filteredSuggestions.length})</span>
            </h4>
            
            <div className="flex items-center space-x-2">
              <AdvancedButton
                variant="ghost"
                size="sm"
                onClick={() => setSuggestions(prev => [...prev].sort(() => Math.random() - 0.5))}
                icon={<Shuffle className="w-4 h-4" />}
              >
                Shuffle
              </AdvancedButton>
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {filteredSuggestions.map(suggestion => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 bg-white/5 dark:bg-white/3 rounded-lg border border-white/10 hover:border-white/20 transition-colors cursor-pointer group"
                  onClick={() => applySuggestion(suggestion)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {suggestion.source === 'ai' && <Brain className="w-4 h-4 text-purple-500" />}
                      {suggestion.source === 'trending' && <TrendingUp className="w-4 h-4 text-green-500" />}
                      {suggestion.source === 'community' && <Users className="w-4 h-4 text-blue-500" />}
                      
                      <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {suggestion.category}
                      </span>
                      
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-gray-500">{suggestion.quality}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <AdvancedButton
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyPrompt(suggestion.text);
                        }}
                        icon={<Copy className="w-3 h-3" />}
                        title="Copy"
                      />
                      
                      <AdvancedButton
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          applySuggestion(suggestion);
                        }}
                        icon={<Plus className="w-3 h-3" />}
                        title="Apply"
                      />
                    </div>
                  </div>
                  
                  <p className="text-sm mb-3">{suggestion.text}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {suggestion.tags.slice(0, 4).map(tag => (
                        <span
                          key={tag}
                          className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    {suggestion.metadata && (
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        {suggestion.metadata.complexity && (
                          <span>{suggestion.metadata.complexity}</span>
                        )}
                        {suggestion.metadata.style && (
                          <span>• {suggestion.metadata.style}</span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </GlassCard>

      {/* Prompt History */}
      {promptHistory.length > 0 && (
        <GlassCard className="p-6">
          <div className="space-y-4">
            <h4 className="font-medium flex items-center space-x-2">
              <History className="w-4 h-4 text-gray-500" />
              <span>Recent Prompts</span>
            </h4>
            
            <div className="space-y-2">
              {promptHistory.slice(0, 5).map((prompt, index) => (
                <div
                  key={index}
                  className="p-3 bg-white/5 dark:bg-white/3 rounded-lg border border-white/10 hover:border-white/20 transition-colors cursor-pointer group"
                  onClick={() => handlePromptChange(prompt)}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm truncate flex-1 mr-2">{prompt}</p>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <AdvancedButton
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyPrompt(prompt);
                        }}
                        icon={<Copy className="w-3 h-3" />}
                        title="Copy"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default AIPromptBuilder;
