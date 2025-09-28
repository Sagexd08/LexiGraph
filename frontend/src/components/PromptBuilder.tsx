/**
 * Enhanced Prompt Builder Component
 * 
 * Advanced prompt building with templates, suggestions, and AI assistance
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wand2, 
  BookOpen, 
  Plus, 
  X, 
  Lightbulb,
  Copy,
  Shuffle,
  Star,
  Tag
} from 'lucide-react';
import { Button, Input, Card, Modal, Tooltip } from './ui';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  tags: string[];
  category: string;
  favorite: boolean;
}

interface PromptSuggestion {
  text: string;
  category: 'style' | 'subject' | 'lighting' | 'composition' | 'quality';
  weight: number;
}

interface PromptBuilderProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: '1',
    name: 'Cinematic Portrait',
    description: 'Professional cinematic portrait style',
    prompt: 'cinematic portrait, professional lighting, shallow depth of field, bokeh background, high detail, photorealistic',
    tags: ['portrait', 'cinematic', 'professional'],
    category: 'Portrait',
    favorite: true
  },
  {
    id: '2',
    name: 'Fantasy Landscape',
    description: 'Epic fantasy landscape scene',
    prompt: 'epic fantasy landscape, dramatic lighting, mystical atmosphere, detailed environment, concept art style',
    tags: ['fantasy', 'landscape', 'epic'],
    category: 'Landscape',
    favorite: false
  },
  {
    id: '3',
    name: 'Anime Style',
    description: 'High-quality anime artwork',
    prompt: 'anime style, high quality, detailed, vibrant colors, studio lighting, masterpiece',
    tags: ['anime', 'vibrant', 'detailed'],
    category: 'Anime',
    favorite: true
  }
];

const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  { text: 'highly detailed', category: 'quality', weight: 1.2 },
  { text: 'masterpiece', category: 'quality', weight: 1.3 },
  { text: 'photorealistic', category: 'style', weight: 1.1 },
  { text: 'dramatic lighting', category: 'lighting', weight: 1.2 },
  { text: 'golden hour', category: 'lighting', weight: 1.1 },
  { text: 'rule of thirds', category: 'composition', weight: 1.0 },
  { text: 'shallow depth of field', category: 'composition', weight: 1.1 }
];

const PromptBuilder: React.FC<PromptBuilderProps> = ({
  value,
  onChange,
  placeholder = "Describe what you want to generate...",
  disabled = false
}) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const addSuggestion = (suggestion: PromptSuggestion) => {
    const newValue = value ? `${value}, ${suggestion.text}` : suggestion.text;
    onChange(newValue);
  };

  const applyTemplate = (template: PromptTemplate) => {
    onChange(template.prompt);
    setShowTemplates(false);
  };

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      const newValue = value ? `${value}, ${tag}` : tag;
      onChange(newValue);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
    const newValue = value.replace(new RegExp(`,?\\s*${tag}`, 'gi'), '').trim();
    onChange(newValue);
  };

  const addCustomTag = () => {
    if (newTag.trim() && !customTags.includes(newTag.trim())) {
      const tag = newTag.trim();
      setCustomTags([...customTags, tag]);
      addTag(tag);
      setNewTag('');
    }
  };

  const generateRandomPrompt = () => {
    const randomSuggestions = PROMPT_SUGGESTIONS
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(s => s.text);
    onChange(randomSuggestions.join(', '));
  };

  const categories = [...new Set(PROMPT_TEMPLATES.map(t => t.category))];

  return (
    <div className="space-y-4">
      {/* Main Prompt Input */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full min-h-[120px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none transition-all duration-200"
          style={{ height: 'auto' }}
        />
        
        {/* Character count */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          {value.length} characters
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTemplates(true)}
          icon={<BookOpen className="h-4 w-4" />}
          disabled={disabled}
        >
          Templates
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSuggestions(!showSuggestions)}
          icon={<Lightbulb className="h-4 w-4" />}
          disabled={disabled}
        >
          Suggestions
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={generateRandomPrompt}
          icon={<Shuffle className="h-4 w-4" />}
          disabled={disabled}
        >
          Random
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigator.clipboard.writeText(value)}
          icon={<Copy className="h-4 w-4" />}
          disabled={disabled || !value}
        >
          Copy
        </Button>
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-2 text-indigo-500 hover:text-indigo-700"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.span>
          ))}
        </div>
      )}

      {/* Custom Tag Input */}
      <div className="flex gap-2">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Add custom tag..."
          onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
          disabled={disabled}
        />
        <Button
          variant="outline"
          onClick={addCustomTag}
          icon={<Plus className="h-4 w-4" />}
          disabled={disabled || !newTag.trim()}
        >
          Add Tag
        </Button>
      </div>

      {/* Suggestions Panel */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-4">
              <h4 className="font-semibold mb-3">Quick Suggestions</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => addSuggestion(suggestion)}
                    className="text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    disabled={disabled}
                  >
                    <span className="text-sm font-medium">{suggestion.text}</span>
                    <div className="text-xs text-gray-500 capitalize">{suggestion.category}</div>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Templates Modal */}
      <Modal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        title="Prompt Templates"
        size="lg"
      >
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category}>
              <h4 className="font-semibold mb-2">{category}</h4>
              <div className="grid gap-3">
                {PROMPT_TEMPLATES
                  .filter(t => t.category === category)
                  .map((template) => (
                    <Card
                      key={template.id}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => applyTemplate(template)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium">{template.name}</h5>
                            {template.favorite && (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {template.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
                            {template.prompt}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {template.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default PromptBuilder;
