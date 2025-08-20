/**
 * Per-account localStorage helper utilities.
 * 
 * - Scopes keys by current user (from REF_USER) or 'guest' if not signed in
 * - Supports date-suffixed keys for daily data
 * - Provides migration helpers from legacy/unscoped keys
 * - Includes cleanup for old date-based entries to prevent storage bloat
 */

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getCurrentUserScope(): string {
  if (typeof window === 'undefined') return 'guest';
  try {
    const userString = localStorage.getItem('REF_USER');
    if (!userString) return 'guest';
    const user = JSON.parse(userString);
    const idPart = user?.id ? String(user.id) : undefined;
    const emailPart = !idPart && user?.email ? String(user.email) : undefined;
    return idPart ? `u:${idPart}` : emailPart ? `e:${emailPart}` : 'guest';
  } catch {
    return 'guest';
  }
}

export function getScopedKey(baseKey: string): string {
  const scope = getCurrentUserScope();
  return `${baseKey}:${scope}`;
}

export function getScopedDateKey(baseKey: string, date: string = getTodayDateString()): string {
  const scope = getCurrentUserScope();
  return `${baseKey}:${scope}:${date}`;
}

export function setItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
}

export function getItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

export function removeItem(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

export function setJSON<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function getJSON<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Migrate a legacy unscoped date key pattern like `${baseKey}_${YYYY-MM-DD}`
 * to the scoped format `${baseKey}:${scope}:${YYYY-MM-DD}`
 */
export function migrateLegacyDateKeyToScoped(baseKey: string, date?: string): void {
  if (typeof window === 'undefined') return;
  const d = date || getTodayDateString();
  const legacy = `${baseKey}_${d}`;
  const scoped = getScopedDateKey(baseKey, d);
  try {
    const existing = localStorage.getItem(legacy);
    if (existing && !localStorage.getItem(scoped)) {
      localStorage.setItem(scoped, existing);
      localStorage.removeItem(legacy);
    }
  } catch {}
}

/**
 * Migrate a legacy per-user pattern like `${baseKey}_${userId}_${YYYY-MM-DD}` to scoped format.
 */
export function migrateLegacyUserDateKeyToScoped(baseKey: string, userId: string, date?: string): void {
  if (typeof window === 'undefined') return;
  const d = date || getTodayDateString();
  const legacy = `${baseKey}_${userId}_${d}`;
  const scoped = getScopedDateKey(baseKey, d);
  try {
    const existing = localStorage.getItem(legacy);
    if (existing && !localStorage.getItem(scoped)) {
      localStorage.setItem(scoped, existing);
      localStorage.removeItem(legacy);
    }
  } catch {}
}

/**
 * Cleanup old date-based entries for the current user.
 * Keeps the last `retainDays` days for keys starting with `${baseKey}:${scope}:YYYY-MM-DD`.
 */
export function cleanupOldDateEntries(baseKey: string, retainDays: number = 7): void {
  if (typeof window === 'undefined') return;
  try {
    const scope = getCurrentUserScope();
    const prefix = `${baseKey}:${scope}:`;
    const today = new Date(getTodayDateString());
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(prefix)) continue;
      const dateStr = k.substring(prefix.length);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;
      const entryDate = new Date(dateStr);
      const diffDays = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > retainDays) {
        localStorage.removeItem(k);
      }
    }
  } catch {}
}

/**
 * Create a per-account wrapper for a base key (non-date scoped).
 */
export const perAccountStorage = {
  key(baseKey: string): string {
    return getScopedKey(baseKey);
  },
  get(baseKey: string): string | null {
    return getItem(this.key(baseKey));
  },
  set(baseKey: string, value: string): void {
    setItem(this.key(baseKey), value);
  },
  remove(baseKey: string): void {
    removeItem(this.key(baseKey));
  },
  getJSON<T>(baseKey: string): T | null {
    return getJSON<T>(this.key(baseKey));
  },
  setJSON<T>(baseKey: string, value: T): void {
    setJSON<T>(this.key(baseKey), value);
  },
};

/**
 * Create a per-account, per-date wrapper for a base key.
 */
export const perAccountDailyStorage = {
  key(baseKey: string, date: string = getTodayDateString()): string {
    return getScopedDateKey(baseKey, date);
  },
  get<T = unknown>(baseKey: string, date?: string): string | null {
    return getItem(this.key(baseKey, date));
  },
  getJSON<T = unknown>(baseKey: string, date?: string): T | null {
    return getJSON<T>(this.key(baseKey, date));
  },
  set<T = unknown>(baseKey: string, value: string, date?: string): void {
    setItem(this.key(baseKey, date), value);
  },
  setJSON<T = unknown>(baseKey: string, value: T, date?: string): void {
    setJSON<T>(this.key(baseKey, date), value);
  },
  remove(baseKey: string, date?: string): void {
    removeItem(this.key(baseKey, date));
  },
};


