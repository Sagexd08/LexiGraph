/**
 * AI Assistant Component
 * Advanced AI-powered prompt enhancement and generation assistance
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Sparkles,
  Wand2,
  Lightbulb,
  Target,
  Zap,
  MessageCircle,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RefreshCw,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Star,
  Bookmark,
  Share,
  Download,
  X,
  Loader2
} from 'lucide-react';
import { GlassCard, AdvancedButton } from '../../design-system';
import { cn } from '../../lib/utils';

interface AIAssistantProps {
  onPromptSuggestion: (prompt: string) => void;
  currentPrompt: string;
  className?: string;
}

interface Suggestion {
  id: string;
  text: string;
  category: 'style' | 'composition' | 'lighting' | 'mood' | 'technical';
  confidence: number;
  reasoning: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: Suggestion[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  onPromptSuggestion,
  currentPrompt,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Initialize with welcome message
  useEffect(() => {
    setMessages([{
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your AI assistant. I can help you enhance prompts, suggest improvements, and guide you through advanced generation techniques. What would you like to create today?",
      timestamp: new Date()
    }]);
  }, []);

  // Auto-generate suggestions when prompt changes
  useEffect(() => {
    if (currentPrompt && currentPrompt.length > 10) {
      generateSuggestions(currentPrompt);
    }
  }, [currentPrompt]);

  const generateSuggestions = async (prompt: string) => {
    // Simulate AI analysis
    const mockSuggestions: Suggestion[] = [
      {
        id: '1',
        text: 'Add "cinematic lighting" for dramatic effect',
        category: 'lighting',
        confidence: 0.92,
        reasoning: 'Your prompt would benefit from more specific lighting direction'
      },
      {
        id: '2',
        text: 'Consider "ultra-detailed, 8K resolution" for quality',
        category: 'technical',
        confidence: 0.88,
        reasoning: 'Technical quality modifiers enhance output resolution'
      },
      {
        id: '3',
        text: 'Try "rule of thirds composition" for better framing',
        category: 'composition',
        confidence: 0.85,
        reasoning: 'Composition guidelines improve visual balance'
      }
    ];
    
    setSuggestions(mockSuggestions);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateAIResponse(inputMessage),
        timestamp: new Date(),
        suggestions: generateContextualSuggestions(inputMessage)
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (input: string): string => {
    const responses = [
      "Great idea! Here are some enhancements to make your vision even more compelling:",
      "I can help you refine that concept. Consider these artistic improvements:",
      "Excellent prompt! Let me suggest some professional techniques to elevate it:",
      "That's a wonderful concept! Here's how we can make it more visually striking:"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateContextualSuggestions = (input: string): Suggestion[] => {
    return [
      {
        id: Date.now().toString(),
        text: `Enhanced version: "${input}, masterpiece quality, professional photography"`,
        category: 'technical',
        confidence: 0.95,
        reasoning: 'Added quality modifiers based on your input'
      }
    ];
  };

  const applySuggestion = (suggestion: Suggestion) => {
    onPromptSuggestion(suggestion.text);
    // toast.success('Suggestion applied!'); // Would need toast library
    console.log('Suggestion applied:', suggestion.text);
  };

  const startVoiceInput = () => {
    setIsListening(true);
    // Voice recognition would be implemented here
    setTimeout(() => {
      setIsListening(false);
      setInputMessage("A majestic dragon soaring through clouds");
    }, 2000);
  };

  return (
    <div className={cn('relative', className)}>
      {/* AI Assistant Toggle Button */}
      <AdvancedButton
        onClick={() => setIsOpen(!isOpen)}
        variant="primary"
        size="lg"
        icon={<Brain className="h-5 w-5" />}
        className="relative"
      >
        AI Assistant
        {suggestions.length > 0 && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-primary-400 rounded-full"
          />
        )}
      </AdvancedButton>

      {/* AI Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute top-full mt-4 right-0 w-96 z-50"
          >
            <GlassCard className="p-6" variant="elevated">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary-400" />
                  <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Quick Suggestions */}
              {suggestions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-neutral-300 mb-2">Smart Suggestions</h4>
                  <div className="space-y-2">
                    {suggestions.map((suggestion) => (
                      <motion.div
                        key={suggestion.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-3 bg-neutral-800/50 rounded-lg border border-white/10"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-white mb-1">{suggestion.text}</p>
                            <p className="text-xs text-neutral-400">{suggestion.reasoning}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3 text-primary-400" />
                                <span className="text-xs text-neutral-400">
                                  {Math.round(suggestion.confidence * 100)}% confidence
                                </span>
                              </div>
                              <span className="text-xs px-2 py-1 bg-primary-500/20 text-primary-300 rounded">
                                {suggestion.category}
                              </span>
                            </div>
                          </div>
                          <AdvancedButton
                            size="sm"
                            variant="ghost"
                            onClick={() => applySuggestion(suggestion)}
                            icon={<Wand2 className="h-3 w-3" />}
                          >
                            Apply
                          </AdvancedButton>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Interface */}
              <div className="space-y-4">
                <div className="h-64 overflow-y-auto space-y-3 p-3 bg-neutral-900/30 rounded-lg">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'flex gap-3',
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] p-3 rounded-lg',
                          message.type === 'user'
                            ? 'bg-primary-500 text-white'
                            : 'bg-neutral-800 text-neutral-100'
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                        {message.suggestions && (
                          <div className="mt-2 space-y-1">
                            {message.suggestions.map((suggestion) => (
                              <button
                                key={suggestion.id}
                                onClick={() => applySuggestion(suggestion)}
                                className="block w-full text-left text-xs p-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                              >
                                {suggestion.text}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-neutral-800 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary-400" />
                          <span className="text-sm text-neutral-300">AI is thinking...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Input Area */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask for prompt suggestions..."
                      className="w-full bg-neutral-800/50 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <AdvancedButton
                    onClick={startVoiceInput}
                    variant="ghost"
                    size="sm"
                    icon={isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    className={isListening ? 'text-red-400' : ''}
                  />
                  <AdvancedButton
                    onClick={handleSendMessage}
                    variant="primary"
                    size="sm"
                    icon={<Send className="h-4 w-4" />}
                    disabled={!inputMessage.trim() || isLoading}
                  />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
