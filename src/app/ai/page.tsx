"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Plus, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import PageTransition from '@/components/PageTransition';
import { useAuth } from '@/contexts/AuthContext';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

    // Simulate AI response
    setTimeout(() => {
      setIsThinking(false);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I understand what you're looking for. Breaking down complex tasks into smaller, manageable chunks can really help with productivity. Here are some strategies that might work for you...",
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 2000);
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

  const getInitialGreeting = () => {
    const hour = new Date().getHours();
    const userName = user?.name || user?.username || "there";
    
    if (hour < 12) return `Good morning, ${userName}!`;
    if (hour < 17) return `Good afternoon, ${userName}!`;
    return `Good evening, ${userName}!`;
  };

  return (
    <PageTransition>
      <div className="h-screen bg-[#10182B] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-700/30 bg-gradient-to-br from-[#10182B] via-gray-900/95 to-slate-900/95 backdrop-blur-xl">
          <div className="w-full px-6 py-8">
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center"
            >
              <motion.div
                className="flex items-center justify-center gap-4 mb-4"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#42b9e5]/15 to-[#4f83ed]/15 border border-[#42b9e5]/20 backdrop-blur-sm shadow-lg"
                  whileHover={{ 
                    scale: 1.1,
                    boxShadow: "0 0 30px rgba(66, 185, 229, 0.3)"
                  }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <img src="/favicon.svg" alt="ReFocused AI" className="w-10 h-10" />
                </motion.div>
                <div className="text-left">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-[#42b9e5] via-[#4f83ed] to-[#42b9e5] bg-clip-text text-transparent mb-1">
                    {getInitialGreeting()}
                  </h1>
                  <p className="text-gray-400 text-sm font-medium">
                    Powered by ReFocused AI
                  </p>
                </div>
              </motion.div>
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="bg-gradient-to-r from-[#42b9e5]/10 to-[#4f83ed]/10 border border-[#42b9e5]/20 rounded-2xl px-6 py-4 max-w-2xl mx-auto"
                >
                  <p className="text-gray-300 text-lg leading-relaxed">
                    I'm your personal AI assistant, ready to help with focus, productivity, mindfulness, and achieving your goals. 
                    <span className="text-[#42b9e5] font-medium"> What can I help you with today?</span>
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-hidden flex flex-col w-full">
          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 w-full">
            <div className="max-w-4xl mx-auto w-full space-y-6">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`flex gap-5 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <motion.div 
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-[#42b9e5]/15 to-[#4f83ed]/15 border border-[#42b9e5]/30 flex items-center justify-center shadow-lg"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <img src="/favicon.svg" alt="ReFocused AI" className="w-6 h-6" />
                      </motion.div>
                    </div>
                  )}
                  
                  <div className={`max-w-[75%] ${message.role === 'user' ? 'order-1' : ''}`}>
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0.8 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`rounded-3xl px-5 py-4 shadow-lg ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-[#42b9e5] to-[#4f83ed] text-white ml-auto shadow-[#42b9e5]/20'
                          : 'bg-gradient-to-br from-gray-800/90 to-slate-800/90 backdrop-blur-sm border border-gray-700/40 text-white shadow-gray-900/20'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {message.content}
                      </p>
                    </motion.div>
                    <div className={`mt-2 px-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <span className="text-xs text-gray-500 font-medium">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 order-2">
                      <motion.div 
                        className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-700/80 to-gray-800/80 border border-gray-600/60 shadow-lg"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {getUserAvatar() ? (
                          <img 
                            src={getUserAvatar()!} 
                            alt="Your Avatar" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </motion.div>
                    </div>
                  )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Thinking Animation */}
              <AnimatePresence>
                {isThinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex gap-5"
                  >
                  <div className="flex-shrink-0">
                    <motion.div 
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-[#42b9e5]/15 to-[#4f83ed]/15 border border-[#42b9e5]/30 flex items-center justify-center shadow-lg"
                      animate={{ 
                        scale: [1, 1.05, 1],
                        opacity: [0.8, 1, 0.8]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <img src="/favicon.svg" alt="ReFocused AI" className="w-6 h-6" />
                    </motion.div>
                  </div>
                  
                  <div className="max-w-[70%]">
                    <motion.div 
                      className="bg-gradient-to-br from-gray-800/90 to-slate-800/90 backdrop-blur-sm border border-[#42b9e5]/20 rounded-2xl px-5 py-4 shadow-lg"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <div className="flex items-center gap-3 text-[#42b9e5]">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="w-5 h-5" />
                        </motion.div>
                        <span className="text-sm font-medium">ReFocused AI is thinking...</span>
                        <div className="flex gap-1 ml-2">
                          <motion.div
                            className="w-2 h-2 bg-[#42b9e5] rounded-full"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-[#42b9e5] rounded-full"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-[#42b9e5] rounded-full"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-gray-700/30 bg-gradient-to-br from-[#10182B]/95 via-gray-900/90 to-slate-900/90 backdrop-blur-xl">
            <div className="px-6 py-6 w-full max-w-4xl mx-auto">
              <form onSubmit={handleSendMessage} className="flex gap-4">
                <div className="flex-1 relative">
                  <motion.div
                    whileFocus={{ scale: 1.01 }}
                    className="relative"
                  >
                    <textarea
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about focus, productivity, mindfulness, or achieving your goals..."
                      className="w-full px-6 py-4 bg-gradient-to-br from-gray-800/70 to-slate-800/70 backdrop-blur-sm border border-gray-700/40 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#42b9e5]/50 focus:border-[#42b9e5]/40 resize-none shadow-lg font-medium transition-all duration-300"
                      rows={1}
                      style={{ 
                        minHeight: '56px',
                        maxHeight: '140px',
                        height: 'auto'
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${Math.min(target.scrollHeight, 140)}px`;
                      }}
                    />
                    {/* Gradient border effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#42b9e5]/20 to-[#4f83ed]/20 opacity-0 transition-opacity duration-300 pointer-events-none peer-focus:opacity-100" />
                  </motion.div>
                </div>
                <motion.button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(66, 185, 229, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0 p-4 bg-gradient-to-br from-[#42b9e5] to-[#4f83ed] rounded-2xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-[#42b9e5]/30 transition-all duration-300 min-w-[56px] h-[56px] flex items-center justify-center"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <Send className="w-6 h-6" />
                  )}
                </motion.button>
              </form>
              
              {/* Enhanced Quick Suggestions */}
              {messages.length === 0 && !inputMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="mt-6"
                >
                  <p className="text-gray-400 text-sm font-medium mb-3 text-center">
                    ✨ Try asking about:
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {[
                      { text: "🧘 Meditation techniques", icon: "🧘" },
                      { text: "📚 Book recommendations", icon: "📚" },
                      { text: "🎯 Goal setting strategies", icon: "🎯" },
                      { text: "💭 Daily affirmations", icon: "💭" },
                      { text: "😌 Stress relief methods", icon: "😌" }
                    ].map((suggestion, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setInputMessage(suggestion.text.replace(/^\S+\s/, ''))}
                        className="px-4 py-3 text-sm bg-gradient-to-br from-gray-700/60 to-gray-800/60 border border-gray-600/40 rounded-xl text-gray-300 hover:text-white hover:border-[#42b9e5]/50 hover:bg-gradient-to-br hover:from-[#42b9e5]/10 hover:to-[#4f83ed]/10 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                      >
                        <span className="mr-2">{suggestion.icon}</span>
                        {suggestion.text.replace(/^\S+\s/, '')}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default AiPage;