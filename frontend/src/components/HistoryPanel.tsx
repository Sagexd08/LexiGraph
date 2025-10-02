

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Trash2,
  Heart,
  Download,
  Copy,
  Clock,
  Image as ImageIcon,
  X
} from 'lucide-react';

import { GenerationHistoryItem, HistoryFilter } from '../types/api';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface HistoryPanelProps {
  onItemSelect?: (item: GenerationHistoryItem) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ onItemSelect }) => {
  const [history, setHistory] = useLocalStorage<GenerationHistoryItem[]>('generation-history', []);
  const [filter, setFilter] = useState<HistoryFilter>({
    search: '',
    favorites: false,
  });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());


  const filteredHistory = useMemo(() => {
    let filtered = [...history];


    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.prompt.toLowerCase().includes(searchLower) ||
        item.metadata.style?.toLowerCase().includes(searchLower)
      );
    }


    if (filter.favorites) {
      filtered = filtered.filter(item => item.favorite);
    }


    if (filter.style) {
      filtered = filtered.filter(item => item.metadata.style === filter.style);
    }


    if (filter.dateRange) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= filter.dateRange!.start && itemDate <= filter.dateRange!.end;
      });
    }


    filtered.sort((a, b) => b.timestamp - a.timestamp);

    return filtered;
  }, [history, filter]);


  const availableStyles = useMemo(() => {
    const styles = new Set<string>();
    history.forEach(item => {
      if (item.metadata.style) {
        styles.add(item.metadata.style);
      }
    });
    return Array.from(styles).sort();
  }, [history]);


  const toggleFavorite = (id: string) => {
    setHistory(prev => prev.map(item =>
      item.id === id ? { ...item, favorite: !item.favorite } : item
    ));
  };


  const deleteItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };


  const deleteSelected = () => {
    setHistory(prev => prev.filter(item => !selectedItems.has(item.id)));
    setSelectedItems(new Set());
  };


  const clearHistory = () => {
    setHistory([]);
    setSelectedItems(new Set());
  };


  const toggleSelection = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };


  const selectAll = () => {
    setSelectedItems(new Set(filteredHistory.map(item => item.id)));
  };


  const deselectAll = () => {
    setSelectedItems(new Set());
  };


  const downloadImage = (item: GenerationHistoryItem) => {
    try {
      const link = document.createElement('a');
      link.href = item.image;
      link.download = `lexigraph-${new Date(item.timestamp).toISOString().slice(0, 19).replace(/[:.]/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };


  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <ImageIcon className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Generation History
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your generated images will appear here for easy access and reuse.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Generation History
          </h3>
          <div className="flex items-center space-x-2">
            {selectedItems.size > 0 && (
              <>
                <button
                  onClick={deleteSelected}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
                >
                  Delete Selected ({selectedItems.size})
                </button>
                <button
                  onClick={deselectAll}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors"
                >
                  Deselect All
                </button>
              </>
            )}
            <button
              onClick={clearHistory}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {}
        <div className="flex flex-col sm:flex-row gap-4">
          {}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {}
          {availableStyles.length > 0 && (
            <select
              value={filter.style || ''}
              onChange={(e) => setFilter(prev => ({ ...prev, style: e.target.value || undefined }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Styles</option>
              {availableStyles.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          )}

          {}
          <button
            onClick={() => setFilter(prev => ({ ...prev, favorites: !prev.favorites }))}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              filter.favorites
                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            <Heart className={`h-4 w-4 ${filter.favorites ? 'fill-current' : ''}`} />
            <span>Favorites</span>
          </button>
        </div>

        {}
        {filteredHistory.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <button
                onClick={selectAll}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Select All
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filteredHistory.length} items
              </span>
            </div>
          </div>
        )}
      </div>

      {}
      <div className="p-6">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              No items match your current filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredHistory.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedItems.has(item.id)
                      ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => toggleSelection(item.id)}
                >
                  {}
                  <div className="aspect-square relative">
                    <img
                      src={item.image}
                      alt={item.prompt}
                      className="w-full h-full object-cover"
                    />

                    {}
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onItemSelect) onItemSelect(item);
                          }}
                          className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                          title="Use parameters"
                        >
                          <Copy className="h-4 w-4 text-gray-700" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(item);
                          }}
                          className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                          title="Download"
                        >
                          <Download className="h-4 w-4 text-gray-700" />
                        </button>
                      </div>
                    </div>

                    {}
                    {selectedItems.has(item.id) && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>

                  {}
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-gray-900 dark:text-white line-clamp-2 flex-1">
                        {item.prompt}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                        className={`ml-2 p-1 rounded transition-colors ${
                          item.favorite
                            ? 'text-red-600 hover:text-red-700'
                            : 'text-gray-400 hover:text-red-600'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${item.favorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(item.timestamp)}</span>
                      </div>
                      <span>{item.metadata.width}×{item.metadata.height}</span>
                    </div>

                    {item.metadata.style && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                          {item.metadata.style}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
