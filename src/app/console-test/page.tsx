'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { tokenRefreshManager } from '@/utils/tokenRefresh';

// Simple in-browser test page to validate midnight clearing and auth persistence
export default function ConsoleTestPage() {
  const [midnightResult, setMidnightResult] = useState<string>('idle');
  const [authResult, setAuthResult] = useState<string>('idle');
  const [nearExpiryEvent, setNearExpiryEvent] = useState<boolean>(false);

  const scope = useMemo(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('REF_USER') : null;
      if (!raw) return 'guest';
      const user = JSON.parse(raw);
      return String(user?.id || user?.email || 'guest');
    } catch {
      return 'guest';
    }
  }, []);

  useEffect(() => {
    const handler = () => setNearExpiryEvent(true);
    if (typeof window !== 'undefined') {
      window.addEventListener('tokenNearExpiry', handler as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('tokenNearExpiry', handler as EventListener);
      }
    };
  }, []);

  const setConversationAndCount = () => {
    const CONVO_BASE_KEY = 'ai-conversation';
    const HISTORY_BASE_KEY = 'ai-conversation-history';
    const COUNT_BASE_KEY = 'ai-daily-count';
    const today = new Date().toDateString();
    const convoKey = `${CONVO_BASE_KEY}:${scope}:${today}`;
    const historyKey = `${HISTORY_BASE_KEY}:${scope}`;
    localStorage.setItem(convoKey, JSON.stringify({ messages: [{ id: '1', role: 'user', content: 'hi', timestamp: new Date().toISOString() }] }));
    localStorage.setItem(historyKey, JSON.stringify({ date: today, messages: [{ id: '2', role: 'assistant', content: 'hello', timestamp: new Date().toISOString() }] }));
    localStorage.setItem(`${COUNT_BASE_KEY}:${scope}`, JSON.stringify({ date: today, count: 5 }));
  };

  const resetAndVerifyMidnight = useCallback(async () => {
    try {
      setMidnightResult('running');
      // Seed some keys
      setConversationAndCount();

      // Fire the day change event that AI page and cache hooks listen to
      window.dispatchEvent(new CustomEvent('dayChanged', { detail: { oldDate: '2025-01-01', newDate: '2025-01-02' } }));

      // Allow event handlers to run
      await new Promise((r) => setTimeout(r, 250));

      // Verify conversation keys cleared and count reset to 0
      const currentKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) currentKeys.push(k);
      }
      const hasConvo = currentKeys.some((k) => k.startsWith(`ai-conversation:${scope}:`) || k.startsWith(`ai-conversation-history:${scope}`));
      const countRaw = localStorage.getItem(`ai-daily-count:${scope}`);
      const countObj = countRaw ? JSON.parse(countRaw) as { date: string; count: number } : null;

      if (!hasConvo && countObj && typeof countObj.count === 'number' && countObj.count === 0) {
        setMidnightResult('pass');
      } else {
        setMidnightResult('fail');
      }
    } catch {
      setMidnightResult('fail');
    }
  }, [scope]);

  const createUnsignedJwt = (expiresInSeconds: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'none', typ: 'JWT' };
    const payload = { exp: now + expiresInSeconds, iat: now, sub: 'test-user' };
    const base64url = (obj: unknown) =>
      btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${base64url(header)}.${base64url(payload)}.`;
  };

  const runAuthPersistenceCheck = useCallback(async () => {
    try {
      setAuthResult('running');
      setNearExpiryEvent(false);

      // Seed a valid-looking token with ~60s lifetime and a user
      const token = createUnsignedJwt(60);
      localStorage.setItem('REF_TOKEN', token);
              localStorage.setItem('REF_USER', JSON.stringify({ id: 42, email: 'test@example.com', name: 'Test User' }));

      // Ensure the token refresh monitor is running for this session
      try { tokenRefreshManager.startMonitoring(); } catch {}

      // Give monitor time to emit near-expiry events
      await new Promise((r) => setTimeout(r, 1500));

      // Wait for a short period and ensure we weren't logged out
      const beforeUrl = window.location.href;
      await new Promise((r) => setTimeout(r, 5000));
      const afterUrl = window.location.href;
      const stillHasToken = !!localStorage.getItem('REF_TOKEN');

      if (stillHasToken && beforeUrl === afterUrl) {
        setAuthResult('pass');
      } else {
        setAuthResult('fail');
      }
    } catch {
      setAuthResult('fail');
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Console Test</h1>
        <p className="text-sm text-slate-300">Run in-browser checks for midnight clearing and session persistence.</p>

        <div className="space-y-3 border border-slate-700 rounded-lg p-4">
          <h2 className="text-lg font-semibold">Midnight Clearing</h2>
          <p className="text-slate-300 text-sm">Verifies that conversation keys clear and the count resets on day change.</p>
          <div className="flex items-center gap-3">
            <button
              data-testid="run-midnight"
              onClick={resetAndVerifyMidnight}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
            >
              Run Midnight Clear Test
            </button>
            <span data-testid="midnight-result" className="text-sm">
              {midnightResult === 'idle' && 'Idle'}
              {midnightResult === 'running' && 'Running…'}
              {midnightResult === 'pass' && 'PASS'}
              {midnightResult === 'fail' && 'FAIL'}
            </span>
          </div>
        </div>

        <div className="space-y-3 border border-slate-700 rounded-lg p-4">
          <h2 className="text-lg font-semibold">Auth Persistence (~60s token)</h2>
          <p className="text-slate-300 text-sm">Seeds a short-lived token and ensures no auto-logout before expiry. Also captures near-expiry event.</p>
          <div className="flex items-center gap-3">
            <button
              data-testid="run-auth"
              onClick={runAuthPersistenceCheck}
              className="px-4 py-2 bg-green-600 rounded hover:bg-green-500"
            >
              Run Auth Persistence Test
            </button>
            <span data-testid="auth-result" className="text-sm">
              {authResult === 'idle' && 'Idle'}
              {authResult === 'running' && 'Running…'}
              {authResult === 'pass' && 'PASS'}
              {authResult === 'fail' && 'FAIL'}
            </span>
            <span data-testid="near-expiry" className="text-sm text-slate-300">
              {nearExpiryEvent ? 'near-expiry event: YES' : 'near-expiry event: NO'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


