"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

export interface AiMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface AiConversationContextValue {
  messages: AiMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AiMessage[]>>;
  appendMessage: (message: AiMessage) => void;
  clearMessages: () => void;
}

const AiConversationContext = createContext<AiConversationContextValue | undefined>(undefined);

const CONVO_STORAGE_KEY = 'ai-conversation-history';

export function AiConversationProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const hasLoadedRef = useRef(false);

  // Load conversation history for today once
  useEffect(() => {
    if (typeof window === 'undefined' || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    try {
      const raw = localStorage.getItem(CONVO_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { date: string; messages: Array<Omit<AiMessage, 'timestamp'> & { timestamp: string }> };
        const todayStr = new Date().toDateString();
        if (parsed.date === todayStr && Array.isArray(parsed.messages)) {
          setMessages(parsed.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
        } else {
          localStorage.removeItem(CONVO_STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(CONVO_STORAGE_KEY);
    }
  }, []);

  // Persist conversation history whenever messages change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (messages.length === 0) {
      localStorage.removeItem(CONVO_STORAGE_KEY);
      return;
    }
    const todayStr = new Date().toDateString();
    const serializable = messages.map(m => ({ ...m, timestamp: m.timestamp.toISOString() }));
    localStorage.setItem(CONVO_STORAGE_KEY, JSON.stringify({ date: todayStr, messages: serializable }));
  }, [messages]);

  // Auto-clear at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 100);
    const timeoutMs = tomorrow.getTime() - now.getTime();
    const id = setTimeout(() => {
      setMessages([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CONVO_STORAGE_KEY);
      }
    }, timeoutMs);
    return () => clearTimeout(id);
  }, []);

  const value = useMemo<AiConversationContextValue>(
    () => ({
      messages,
      setMessages,
      appendMessage: (message: AiMessage) => setMessages(prev => [...prev, message]),
      clearMessages: () => setMessages([])
    }),
    [messages]
  );

  return (
    <AiConversationContext.Provider value={value}>
      {children}
    </AiConversationContext.Provider>
  );
}

export function useAiConversation(): AiConversationContextValue {
  const ctx = useContext(AiConversationContext);
  if (!ctx) throw new Error('useAiConversation must be used within AiConversationProvider');
  return ctx;
}


