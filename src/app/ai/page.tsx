"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Loader2, Settings, Save, MessageSquare, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import PageTransition from '@/components/PageTransition';
import { useAuth } from '@/contexts/AuthContext';
import DevTestingButton from '@/components/DevTestingButton';

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
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are ReFocused AI, a helpful assistant focused on productivity, mindfulness, wellness, and personal growth. Provide practical, actionable advice that helps users stay focused, reduce stress, and achieve their goals. Be encouraging, supportive, and concise in your responses."
  );
  const [savedSystemPrompt, setSavedSystemPrompt] = useState(systemPrompt);
  const [dailyMessageCount, setDailyMessageCount] = useState(0);
  const [messageLimit] = useState(100);
  const [thinkingWord, setThinkingWord] = useState('thinking');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wordIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic thinking words
  const thinkingWords = [
    'thinking', 'pondering', 'analyzing', 'processing', 'contemplating',
    'cooking', 'brewing', 'crafting', 'formulating', 'considering',
    'reflecting', 'evaluating', 'examining', 'exploring', 'deliberating'
  ];

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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        }
      }, 100);
    }
  }, [searchParams]);

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
    
    // Start cycling through thinking words
    wordIntervalRef.current = setInterval(() => {
      setThinkingWord(prev => {
        const currentIndex = thinkingWords.indexOf(prev);
        const nextIndex = (currentIndex + 1) % thinkingWords.length;
        return thinkingWords[nextIndex];
      });
    }, 800);

    try {
      const response = await fetch('/api/claude/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          systemPrompt: savedSystemPrompt,
          conversationHistory: messages.slice(-10),
          userId: user?.id || user?.email || 'anonymous',
        }),
      });

      setIsThinking(false);
      if (wordIntervalRef.current) {
        clearInterval(wordIntervalRef.current);
        wordIntervalRef.current = null;
      }
      setThinkingWord('thinking');

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      
      let aiContent = "I apologize, but I'm having trouble processing your request right now. Please try again.";
      
      if (data.content && data.content[0] && data.content[0].text) {
        aiContent = data.content[0].text;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiContent,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Increment daily message count
      const newCount = dailyMessageCount + 1;
      setDailyMessageCount(newCount);
      
      // Save to localStorage with today's date
      const today = new Date().toDateString();
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai-daily-count', JSON.stringify({ date: today, count: newCount }));
      }
    } catch (error) {
      setIsThinking(false);
      if (wordIntervalRef.current) {
        clearInterval(wordIntervalRef.current);
        wordIntervalRef.current = null;
      }
      setThinkingWord('thinking');
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
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

  const saveSystemPrompt = () => {
    setSavedSystemPrompt(systemPrompt);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai-system-prompt', systemPrompt);
    }
  };

  const resetSystemPrompt = () => {
    const defaultPrompt = "You are ReFocused AI, a helpful assistant focused on productivity, mindfulness, wellness, and personal growth. Provide practical, actionable advice that helps users stay focused, reduce stress, and achieve their goals. Be encouraging, supportive, and concise in your responses.";
    setSystemPrompt(defaultPrompt);
    setSavedSystemPrompt(defaultPrompt);
  };

  // Load saved system prompt and daily message count on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai-system-prompt');
      if (saved) {
        setSystemPrompt(saved);
        setSavedSystemPrompt(saved);
      }
      
      // Load daily message count
      const dailyData = localStorage.getItem('ai-daily-count');
      const today = new Date().toDateString();
      
      if (dailyData) {
        const parsed = JSON.parse(dailyData);
        if (parsed.date === today) {
          setDailyMessageCount(parsed.count || 0);
        } else {
          // New day, reset count
          setDailyMessageCount(0);
          localStorage.setItem('ai-daily-count', JSON.stringify({ date: today, count: 0 }));
        }
      } else {
        localStorage.setItem('ai-daily-count', JSON.stringify({ date: today, count: 0 }));
      }
    }
  }, []);

  const getInitialGreeting = () => {
    const hour = new Date().getHours();
    const userName = user?.name || user?.username || "there";
    
    if (hour < 12) return `Good morning, ${userName}!`;
    if (hour < 17) return `Good afternoon, ${userName}!`;
    return `Good evening, ${userName}!`;
  };

  return (
    <PageTransition>
      <div className="h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-white/10 bg-gradient-to-r from-slate-900/80 to-gray-900/80 backdrop-blur-xl shadow-lg">
          <div className="w-full px-8 py-8">
            {/* System Prompt Editor */}
            {showSystemPrompt && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-300">System Prompt Configuration</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={saveSystemPrompt}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md transition-colors flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </button>
                    <button
                      onClick={resetSystemPrompt}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-md transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full p-3 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white text-sm resize-none"
                  rows={4}
                  placeholder="Enter system prompt for AI behavior..."
                />
                {systemPrompt !== savedSystemPrompt && (
                  <p className="text-xs text-yellow-400 mt-2">⚠️ Unsaved changes - click Save to apply</p>
                )}
              </motion.div>
            )}
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-xl ring-1 ring-white/20">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                    ReFocused AI
                  </h1>
                  <p className="text-base text-gray-300 font-medium">
                    Enterprise AI Assistant for Productivity & Wellness
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex items-center gap-6"
              >
                {/* Message Count Indicator */}
                <div className="flex items-center gap-3 px-5 py-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg">
                  <Zap className={`w-5 h-5 ${
                    dailyMessageCount >= messageLimit ? 'text-red-400' : 
                    dailyMessageCount >= messageLimit * 0.8 ? 'text-amber-400' : 
                    'text-emerald-400'
                  }`} />
                  <div className="flex flex-col">
                    <span className={`text-sm font-semibold ${
                      dailyMessageCount >= messageLimit ? 'text-red-300' : 
                      dailyMessageCount >= messageLimit * 0.8 ? 'text-amber-300' : 
                      'text-emerald-300'
                    }`}>
                      {messageLimit - dailyMessageCount} remaining
                    </span>
                    <span className="text-xs text-gray-400">messages today</span>
                  </div>
                </div>
                
                {process.env.NODE_ENV === 'development' && (
                  <button
                    onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    title="Configure System Prompt (Dev Only)"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-slate-900/30">
            <div className="w-full max-w-7xl mx-auto px-8 py-12">
              {/* Welcome Card - Only show when no messages */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-12 p-10 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl"
                >
                  <div className="text-center max-w-3xl mx-auto">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl ring-1 ring-white/20">
                      <MessageSquare className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">
                      {getInitialGreeting()}
                    </h2>
                    <p className="text-xl text-gray-300 leading-relaxed mb-8">
                      Welcome to your AI-powered productivity and wellness assistant. I'm here to provide 
                      expert guidance on focus, mindfulness, goal achievement, and personal growth.
                    </p>
                    <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Personalized advice</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Evidence-based strategies</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Actionable insights</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div className="space-y-8">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`flex gap-6 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-xl ring-1 ring-white/20">
                          <MessageSquare className="w-7 h-7 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <div className={`max-w-[75%] ${message.role === 'user' ? 'order-1' : ''}`}>
                      <div
                        className={`rounded-3xl px-6 py-4 shadow-lg ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                            : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white'
                        }`}
                      >
                        <p className="text-base leading-relaxed whitespace-pre-wrap font-medium">
                          {message.content}
                        </p>
                      </div>
                      <div className={`mt-2 px-3 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                        <span className="text-sm text-gray-400 font-medium">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <div className="flex-shrink-0 order-2">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-xl ring-1 ring-white/20">
                          {getUserAvatar() ? (
                            <img 
                              src={getUserAvatar()!} 
                              alt="Your Avatar" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-7 h-7 text-gray-300" />
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
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-xl ring-1 ring-white/20">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          >
                            <Loader2 className="w-7 h-7 text-white" />
                          </motion.div>
                        </div>
                      </div>
                      
                      <div className="max-w-[70%]">
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl px-6 py-4 shadow-lg">
                          <div className="flex items-center gap-3 text-gray-300">
                            <span className="text-base font-medium">AI is analyzing your request...</span>
                            <div className="flex gap-1.5">
                              <motion.div
                                className="w-2 h-2 bg-blue-400 rounded-full"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                              />
                              <motion.div
                                className="w-2 h-2 bg-blue-400 rounded-full"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                              />
                              <motion.div
                                className="w-2 h-2 bg-blue-400 rounded-full"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                              />
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

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-white/10 bg-gradient-to-r from-slate-900/90 to-gray-900/90 backdrop-blur-xl shadow-2xl">
            <div className="w-full max-w-7xl mx-auto px-8 py-6">
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
              
              {/* Quick Suggestions */}
              {messages.length === 0 && !inputMessage && dailyMessageCount < messageLimit && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="mt-6"
                >
                  <p className="text-gray-300 text-base mb-4 text-center font-medium">
                    Popular topics to explore:
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
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
                        className="px-4 py-3 text-sm bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-xl text-gray-300 hover:text-white transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
        
        <DevTestingButton />
      </div>
    </PageTransition>
  );
};

export default AiPage;