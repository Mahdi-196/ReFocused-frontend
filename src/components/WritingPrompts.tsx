"use client";

import { useState } from 'react';
import { PenTool, RefreshCw, Copy, Check, Settings } from 'lucide-react';
import { apiService, type PopulateDataResponse, type WritingPromptsResponse } from '../services/api';
import { useWritingPromptsDaily } from '../hooks/useDailyContentSimple';

interface WritingPrompt {
  id: string;
  prompt: string;
  generated_at: string;
}

interface WritingPromptsProps {
  defaultType?: 'journal-prompts' | 'goals' | 'affirmations' | 'habits' | 'meditation-sessions' | 'weekly-prompts';
  defaultCount?: number;
  showTypeSelector?: boolean;
  title?: string;
  useWeeklyPrompts?: boolean;
}

const WritingPrompts = ({ 
  defaultType = 'journal-prompts',
  defaultCount = 5,
  showTypeSelector = true,
  title = 'Writing Prompts',
  useWeeklyPrompts = false
}: WritingPromptsProps) => {
  const [selectedType, setSelectedType] = useState(defaultType);
  const [count, setCount] = useState(defaultCount);
  const [customPrompt, setCustomPrompt] = useState('');
  const [prompts, setPrompts] = useState<PopulateDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);

  // Use cached daily writing prompts when using weekly prompts
  const { 
    data: cachedWeeklyPrompts, 
    loading: cachedLoading, 
    error: cachedError, 
    refresh: refreshCachedPrompts, 
    isCached 
  } = useWritingPromptsDaily();
  
  // Determine which data source to use
  const weeklyPrompts = useWeeklyPrompts ? cachedWeeklyPrompts : null;
  const isLoadingWeekly = useWeeklyPrompts ? cachedLoading : false;
  const weeklyError = useWeeklyPrompts ? cachedError : null;


  const contentTypes = [
    { value: 'journal-prompts', label: 'Journal Prompts', icon: '📝' },
    { value: 'goals', label: 'Goals', icon: '🎯' },
    { value: 'affirmations', label: 'Affirmations', icon: '💪' },
    { value: 'habits', label: 'Habits', icon: '🔄' },
    { value: 'meditation-sessions', label: 'Meditation Sessions', icon: '🧘' },
    { value: 'weekly-prompts', label: 'Weekly Writing Prompts', icon: '📅' }
  ] as const;

  const generateContent = async () => {
    if (useWeeklyPrompts || selectedType === 'weekly-prompts') {
      // Refresh cached weekly prompts
      await refreshCachedPrompts();
      return;
    }

    // Generate regular prompts
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.populateData(
        selectedType as 'journal-prompts' | 'goals' | 'affirmations' | 'habits' | 'meditation-sessions',
        count,
        customPrompt || undefined
      );
      setPrompts(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate content';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getContentText = (item: any, type: string) => {
    switch (type) {
      case 'journal-prompts':
        return item.prompt || item.content;
      case 'goals':
        return item.goal || item.content;
      case 'affirmations':
        return item.affirmation || item.content;
      case 'habits':
        return item.habit || item.content;
      case 'meditation-sessions':
        return item.session || item.content;
      default:
        return item.content || JSON.stringify(item);
    }
  };

  const currentType = contentTypes.find(type => type.value === selectedType);

  return (
    <section 
      className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-6 h-full flex flex-col"
      aria-labelledby="writing-prompts"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 id="writing-prompts" className="flex items-center gap-2 text-lg font-semibold text-white">
          <PenTool className="w-5 h-5 text-purple-400" />
          {title}
          {isCached && useWeeklyPrompts && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-400 rounded" title="Loaded from cache">
              📋
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCustomPrompt(!showCustomPrompt)}
            className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-md transition duration-200 flex items-center gap-1"
            title="Custom prompt settings"
          >
            <Settings className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={generateContent}
            disabled={loading || isLoadingWeekly}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-xs rounded-md transition duration-200 flex items-center gap-1"
          >
            {(loading || isLoadingWeekly) ? (
              <>
                <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></div>
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3" />
                {useWeeklyPrompts ? 'Refresh' : 'Generate'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Custom Prompt Editor */}
      {showCustomPrompt && (
        <div className="mb-4 p-3 bg-gray-900/50 border border-gray-600/50 rounded-lg">
          <label className="block text-xs font-medium text-gray-300 mb-2">
            Custom Prompt (optional)
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Add specific requirements or focus areas..."
            className="w-full p-2 bg-gray-800/50 border border-gray-600/50 rounded-md text-white text-sm resize-none"
            rows={2}
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2 mb-4">
        {showTypeSelector && (
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-600/50 rounded-md text-white text-sm"
            disabled={loading}
          >
            {contentTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        )}
        <input
          type="number"
          min="1"
          max="20"
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value) || 1)}
          className="w-16 px-2 py-2 bg-gray-900/50 border border-gray-600/50 rounded-md text-white text-sm text-center"
          disabled={loading}
        />
      </div>
      
      {(error || weeklyError) && (
        <div className="mb-4 p-2 bg-red-900/20 border border-red-500/30 rounded-md">
          <p className="text-xs text-red-400">Error: {error || weeklyError}</p>
        </div>
      )}

      {!prompts && !weeklyPrompts && !loading && !isLoadingWeekly && !error && !weeklyError && (
        <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
          <PenTool className="w-10 h-10 text-purple-400 mb-3" />
          <p className="text-gray-400 text-sm mb-4">
            Click "{useWeeklyPrompts ? 'Refresh' : 'Generate'}" to create {currentType?.label.toLowerCase()}
          </p>
        </div>
      )}

      {/* Generated Content */}
      {(prompts || weeklyPrompts) && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">
                {weeklyPrompts ? (
                  <>📅 Weekly Writing Prompts ({weeklyPrompts.prompts.length})</>
                ) : prompts ? (
                  <>{currentType?.icon} Generated {prompts.data_type.replace('-', ' ')} ({prompts.count})</>
                ) : null}
              </h3>
            </div>
            
            {weeklyPrompts ? (
              // Render weekly prompts
              weeklyPrompts.prompts.map((prompt, index) => (
                <div
                  key={`weekly-${index}`}
                  className="p-3 bg-white/5 border border-gray-600/30 rounded-lg hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-gray-200 leading-relaxed flex-1 break-words">
                      {prompt}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(prompt, index)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-all flex-shrink-0"
                      title="Copy to clipboard"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : prompts ? (
              // Render regular prompts
              prompts.content.map((item, index) => {
                const contentText = getContentText(item, prompts.data_type);
                return (
                  <div
                    key={item.id || index}
                    className="p-3 bg-white/5 border border-gray-600/30 rounded-lg hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-gray-200 leading-relaxed flex-1 break-words">
                        {contentText}
                      </p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(contentText, index)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-all flex-shrink-0"
                        title="Copy to clipboard"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : null}
          </div>
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-gray-600/50">
        <p className="text-xs text-gray-400 text-center break-words hyphens-auto overflow-wrap-anywhere px-2 leading-tight">
          AI-powered content generation for personal growth
        </p>
      </div>
    </section>
  );
};

export default WritingPrompts;