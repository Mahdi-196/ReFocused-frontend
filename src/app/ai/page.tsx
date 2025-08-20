"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useCurrentDate } from '@/contexts/TimeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import PageTransition from '@/components/PageTransition';
import { useAuth } from '@/contexts/AuthContext';
import DevTestingButton from '@/components/DevTestingButton';
import { apiService } from '@/services/api';
import { useAiAssistanceDaily } from '@/hooks/useDailyContentSimple';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const AiPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [dailyMessageCount, setDailyMessageCount] = useState(0);
  const [messageLimit] = useState(100);
  // Daily AI assistance suggestions (cached like Quote/Word)
  const { isCached: aiCached, refresh: refreshAiDaily } = useAiAssistanceDaily();
  // Conversation virtualization state
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [thinkingWord, setThinkingWord] = useState('thinking');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const CONVO_BASE_KEY = 'ai-conversation';
  const COUNT_BASE_KEY = 'ai-daily-count';
  const getUserScope = () => String(user?.id || user?.email || 'guest');
  const userDate = useCurrentDate(); // YYYY-MM-DD from backend time
  const getTodayKey = () => `${CONVO_BASE_KEY}:${getUserScope()}:${userDate}`;
  const hasLoadedConvoRef = useRef(false);

  // Reset conversation storage for a new day or on explicit day-change events
  const resetConversationForNewDay = useCallback(() => {
    setMessages([]);
    if (typeof window !== 'undefined') {
      const scope = getUserScope();
      // Clean out all prior conversation keys for this user
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${CONVO_BASE_KEY}:${scope}:`)) {
          localStorage.removeItem(key);
        }
      }
      localStorage.setItem(
        `${COUNT_BASE_KEY}:${scope}`,
        JSON.stringify({ date: userDate, count: 0 })
      );
    }
  }, [user, userDate]);

  const DEFAULT_SYSTEM_PROMPT = "You are ReFocused AI, a helpful assistant focused on productivity, mindfulness, wellness, and personal growth. Provide practical, actionable advice that helps users stay focused, reduce stress, and achieve their goals. Be encouraging, supportive, and concise in your responses.";

  // Thematic thinking phrase groups for more coherent status messages
  const thinkingPhraseGroups: Record<string, string[]> = {
    cognitive: [
      'Thinking',
      'Reflecting',
      'Focusing',
      'Planning',
      'Organizing'
    ],
    creative: [
      'Drafting',
      'Outlining',
      'Refining',
      'Polishing',
      'Weaving ideas',
      'Summarizing',
      'Combobulating'
    ],
    operations: [
      'Loading',
      'Preparing',
      'Calculating',
      'Processing'
    ],
    analysis: [
      'Analyzing',
      'Evaluating',
      'Considering',
      'Comparing',
      'Checking',
      'Reviewing'
    ],
    search: [
      'Searching',
      'Finding',
      'Gathering',
      'Exploring',
      'Researching',
      'Scanning',
      'Looking'
    ]
  };

  const selectPhraseGroupForMessage = (content: string): string[] => {
    const text = content.toLowerCase();
    if (/(search|find|lookup|gather|gathering|review|reviewing|look)/.test(text)) return thinkingPhraseGroups.search;
    if (/(analyz|analysis|consider|process|check|evaluate|examin|focus)/.test(text)) return thinkingPhraseGroups.analysis;
    if (/(design|write|create|brainstorm|idea|compose|draft|story)/.test(text)) return thinkingPhraseGroups.creative;
    if (/(param|engine|tune|warm|optimiz|config)/.test(text)) return thinkingPhraseGroups.operations;
    return thinkingPhraseGroups.cognitive;
  };

  // Get user avatar with fallback to generated avatar
  const getUserAvatar = () => {
    if (user?.profile_picture || user?.avatar) {
      return user.profile_picture || user.avatar;
    }
    
    // Generate default avatar using same logic as profile page
    if (user?.name || user?.email) {
      return `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(user.name || user.email)}&backgroundColor=transparent`;
    }
    
    return null;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll when conversation starts or new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // Auto-scroll when thinking starts
  useEffect(() => {
    if (isThinking) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isThinking]);

  // Check for pre-filled message from URL params
  useEffect(() => {
    const messageParam = searchParams.get('message');
    if (messageParam) {
      const decodedMessage = decodeURIComponent(messageParam);
      setInputMessage(decodedMessage);
      
      // Auto-resize the textarea and focus it
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.style.height = 'auto';
          inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
          inputRef.current.focus();
          // Move cursor to end
          inputRef.current.setSelectionRange(decodedMessage.length, decodedMessage.length);
          // Auto-scroll to input area
          scrollToBottom();
        }
      }, 100);
    }
  }, [searchParams]);

  // Debug instrumentation removed

  // Background suggestion refresh - preload new suggestions while user is typing
  useEffect(() => {
    if (inputMessage.trim().length > 10) {
      // Debounced background refresh of AI suggestions
      const timeoutId = setTimeout(() => {
        if (!aiCached) {
          refreshAiDaily();
        }
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [inputMessage, aiCached, refreshAiDaily]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    // Check daily message limit
    if (dailyMessageCount >= messageLimit) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `You've reached your daily limit of ${messageLimit} messages. Please try again tomorrow!`,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsThinking(true);
    
    // Choose a thematic group, but mix in words from other groups (1–3 total)
    const group = selectPhraseGroupForMessage(userMessage.content);
    const sampleCount = Math.max(1, Math.min(3, Math.floor(Math.random() * 3) + 1));
    const allPhrases = Object.values(thinkingPhraseGroups).flat();
    const othersPool = allPhrases.filter((p) => !group.includes(p));

    const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    const sampled: string[] = [];
    // Ensure at least one from the primary group
    sampled.push(pickRandom(group));
    // Fill the rest from the broader pool without immediate duplicates
    while (sampled.length < sampleCount && othersPool.length > 0) {
      const next = pickRandom(othersPool);
      if (!sampled.includes(next)) sampled.push(next);
    }
    setThinkingWord(sampled[0]);

    // Rotate only within the sampled phrases if more than 1
    if (sampled.length > 1) {
      let index = 0;
      wordIntervalRef.current = setInterval(() => {
        index = (index + 1) % sampled.length;
        setThinkingWord(sampled[index]);
      }, 1200);
    }

    try {
      const result = await apiService.sendChatMessage(
        userMessage.content,
        messages.slice(-10),
        DEFAULT_SYSTEM_PROMPT
      );

      setIsThinking(false);
      if (wordIntervalRef.current) {
        clearInterval(wordIntervalRef.current);
        wordIntervalRef.current = null;
      }
      setThinkingWord('thinking');

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: result.response,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Update message count from API response
      setDailyMessageCount(messageLimit - result.messages_remaining);
      
      // Save to localStorage with today's date
      const today = new Date().toDateString();
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${COUNT_BASE_KEY}:${getUserScope()}`, JSON.stringify({ 
          date: today, 
          count: messageLimit - result.messages_remaining 
        }));
      }
    } catch (error: any) {
      setIsThinking(false);
      if (wordIntervalRef.current) {
        clearInterval(wordIntervalRef.current);
        wordIntervalRef.current = null;
      }
      setThinkingWord('thinking');
      const is429 = (error?.status as number | undefined) === 429;
      const content = is429
        ? "Sorry, you've reached the daily limit."
        : 'I apologize, but I encountered an error. Please try again.';
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Removed System Prompt editor and persistence for a cleaner UI

  // Load conversation (once per user) and daily message count
  useEffect(() => {
    if (typeof window !== 'undefined' && !authLoading) {
      // Clean up stale conversation keys from previous days for this scope
      try {
        const todayLabel = new Date().toDateString();
        const scope = getUserScope();
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`${CONVO_BASE_KEY}:${scope}:`)) {
            const parts = key.split(':');
            const datePart = parts[parts.length - 1];
            if (datePart !== todayLabel) {
              localStorage.removeItem(key);
            }
          }
        }
      } catch {}

      // Load conversation history for today
      try {
        const raw = localStorage.getItem(getTodayKey());
        if (raw) {
          const parsed = JSON.parse(raw) as { messages: Array<Omit<Message, 'timestamp'> & { timestamp: string }> };
          if (Array.isArray(parsed.messages)) {
            setMessages(parsed.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
          }
        }
      } catch {
        // ignore parse errors; we'll overwrite on next save
      }
      // Mark load complete so persist effect won't clear prematurely
      hasLoadedConvoRef.current = true;

      // Load daily message count
      const dailyData = localStorage.getItem(`${COUNT_BASE_KEY}:${getUserScope()}`);
      const today = userDate;
      
      if (dailyData) {
        const parsed = JSON.parse(dailyData);
        if (parsed.date === today) {
          setDailyMessageCount(parsed.count || 0);
        } else {
          // New day, reset count
          setDailyMessageCount(0);
          localStorage.setItem(`${COUNT_BASE_KEY}:${getUserScope()}`, JSON.stringify({ date: today, count: 0 }));
        }
      } else {
        localStorage.setItem(`${COUNT_BASE_KEY}:${getUserScope()}`, JSON.stringify({ date: today, count: 0 }));
      }
    }
  }, [authLoading, user, userDate]);

  // Persist conversation history whenever messages change (skip initial mount before load)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hasLoadedConvoRef.current) return;
    if (messages.length === 0) return;
    const serializable = messages.map(m => ({ ...m, timestamp: m.timestamp.toISOString() }));
    localStorage.setItem(getTodayKey(), JSON.stringify({ messages: serializable }));
  }, [messages, user, userDate]);

  // No local midnight timer; rely on backend-driven dayChanged event

  // Also clear immediately on backend-signaled day change (timezone-aware)
  useEffect(() => {
    const handler = () => resetConversationForNewDay();
    window.addEventListener('dayChanged', handler as EventListener);
    return () => window.removeEventListener('dayChanged', handler as EventListener);
  }, [resetConversationForNewDay]);



  return (
    <PageTransition>
      <div className="relative min-h-screen w-screen max-w-none ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] bg-gradient-to-b from-slate-950 via-slate-950 to-blue-900/40 flex flex-col overflow-hidden">
        {/* Background overlays removed to ensure full-width uniform gradient without edge contrast */}
        {/* No in-page header; global header remains above. */}

        {/* Messages Container */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 bg-transparent pb-32">
            <div className="w-full px-6">
              {/* Centered intro that animates away when typing or after first message */}
              <AnimatePresence mode="wait">
                {messages.length === 0 && (
                  <motion.div
                    key="ai-intro"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-center pt-14 pb-8"
                  >
                    <div className="text-center max-w-3xl">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-white">ReFocused AI</h1>
                        {aiCached && (
                          <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded" title="Daily suggestions loaded from cache">
                            📋
                          </span>
                        )}
                        <button
                          onClick={refreshAiDaily}
                          className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                          title="Refresh daily suggestions"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-base text-gray-300 mb-5">Ask about focus, productivity, mindfulness, wellness, or goals.</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {[
                          "Advanced meditation techniques",
                          "Time management strategies",
                          "SMART goal setting framework",
                          "Stress reduction methods",
                          "Daily productivity habits",
                          "Mindfulness practices"
                        ].map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => setInputMessage(suggestion)}
                            className="px-4 py-2 text-sm rounded-full text-gray-200 hover:text-white border border-white/20 hover:border-white/40 bg-transparent hover:bg-white/10 backdrop-blur-sm transition-all duration-200 shadow-sm"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
                {/* Chat Column */}
                <div className="w-full">

                  {/* Conversation - Virtualized for performance */}
                  <div className="space-y-6 mt-[4vh]">
                    {/* Show older messages button */}
                    {messages.length > 20 && !showAllMessages && (
                      <div className="text-center">
                        <button
                          onClick={() => {
                            setIsLoadingOlderMessages(true);
                            // Simulate loading older messages
                            setTimeout(() => {
                              setShowAllMessages(true);
                              setIsLoadingOlderMessages(false);
                            }, 500);
                          }}
                          disabled={isLoadingOlderMessages}
                          className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400/50 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-all duration-200 disabled:opacity-50"
                        >
                          {isLoadingOlderMessages ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                              Loading older messages...
                            </div>
                          ) : (
                            `Show ${messages.length - 20} older messages`
                          )}
                        </button>
                      </div>
                    )}
                    
                    <AnimatePresence>
                      {/* Render messages based on virtualization state */}
                      {(showAllMessages ? messages : messages.slice(-20)).map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className={`flex gap-6 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {message.role === 'assistant' && (
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-xl ring-1 ring-white/20">
                                <Image 
                                  src="/canva-brain.png" 
                                  alt="ReFocused AI" 
                                  width={32} 
                                  height={32} 
                                  className="text-white"
                                />
                              </div>
                            </div>
                          )}

                            <div className={`max-w-[85%] sm:max-w-[75%] ${message.role === 'user' ? 'order-1' : ''}`}>
                            <div
                              className={`rounded-2xl px-5 py-4 shadow-lg ${
                                message.role === 'user'
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                                  : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white'
                              }`}
                            >
                              <p className="text-base leading-relaxed whitespace-pre-wrap font-medium">{message.content}</p>
                            </div>
                            <div className={`mt-2 px-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                              <span className="text-xs text-gray-400 font-medium">{formatTime(message.timestamp)}</span>
                            </div>
                          </div>

                          {message.role === 'user' && (
                            <div className="flex-shrink-0 order-2">
                              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-xl ring-1 ring-white/20">
                                {getUserAvatar() ? (
                                  <img src={getUserAvatar()!} alt="Your Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-6 h-6 text-gray-300" />
                                )}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Thinking Animation */}
                    <AnimatePresence>
                      {isThinking && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="flex gap-6"
                        >
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-xl ring-1 ring-white/20">
                              <Image 
                                src="/canva-brain.png" 
                                alt="ReFocused AI" 
                                width={32} 
                                height={32} 
                                className="text-white animate-pulse"
                              />
                            </div>
                          </div>

                          <div className="max-w-[70%]">
                            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-4 shadow-lg">
                              <div className="flex items-center gap-3 text-gray-300">
                                <motion.span
                                  key={thinkingWord}
                                  initial={{ opacity: 0.3, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.35 }}
                                  className="text-base font-medium"
                                >
                                  {thinkingWord}
                                </motion.span>
                                <div className="flex gap-1.5">
                                  <motion.div className="w-2 h-2 bg-blue-400 rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }} />
                                  <motion.div className="w-2 h-2 bg-blue-400 rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} />
                                  <motion.div className="w-2 h-2 bg-blue-400 rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div ref={messagesEndRef} />
                  </div>
                </div>
            </div>
          </div>
        </div>

        {/* Debug HUD */}
        {/* Debug HUD removed */}

        {/* Input Area - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0f172a]/90 backdrop-blur-xl shadow-2xl">
            <div className="w-full px-6 py-6">
              {/* Message limit warning */}
              {dailyMessageCount >= messageLimit * 0.8 && dailyMessageCount < messageLimit && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 shadow-lg"
                >
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <span className="text-base font-medium text-amber-300">
                    Approaching daily limit: {messageLimit - dailyMessageCount} messages remaining
                  </span>
                </motion.div>
              )}
              
              {dailyMessageCount >= messageLimit && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 shadow-lg"
                >
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-base font-medium text-red-300">
                    Daily limit reached: {messageLimit} messages used. Reset at midnight.
                  </span>
                </motion.div>
              )}
              
              {/* Quick Suggestions removed from above the text box to avoid duplication */}

              <form onSubmit={handleSendMessage} className="flex gap-4">
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={dailyMessageCount >= messageLimit ? "Daily message limit reached - please try again tomorrow" : "Ask me anything about focus, productivity, mindfulness, wellness, or achieving your goals..."}
                    className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/40 resize-none transition-all duration-300 text-base font-medium shadow-lg"
                    rows={1}
                    disabled={dailyMessageCount >= messageLimit}
                    style={{ 
                      minHeight: '60px',
                      maxHeight: '160px',
                      height: 'auto'
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading || dailyMessageCount >= messageLimit}
                  className="flex-shrink-0 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 min-w-[60px] h-[60px] flex items-center justify-center shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Send className="w-6 h-6" />
                  )}
                </button>
              </form>
            </div>
        </div>

        {process.env.NEXT_PUBLIC_APP_ENV === 'development' && <DevTestingButton />}
      </div>
    </PageTransition>
  );
};

export default AiPage;