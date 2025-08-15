export type DevFlags = {
	editorSafeMode: boolean;
	editorDebugLogs: boolean;
};

const STORAGE_KEY = 'devFlags';
const DEFAULT_FLAGS: DevFlags = { editorSafeMode: false, editorDebugLogs: false };

function readStorage(): DevFlags {
	if (typeof window === 'undefined') return DEFAULT_FLAGS;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return DEFAULT_FLAGS;
		const parsed = JSON.parse(raw);
		return { ...DEFAULT_FLAGS, ...parsed } as DevFlags;
	} catch {
		return DEFAULT_FLAGS;
	}
}

export function getDevFlags(): DevFlags {
	return readStorage();
}

export function setDevFlags(next: Partial<DevFlags>) {
	if (typeof window === 'undefined') return;
	const current = readStorage();
	const merged = { ...current, ...next } as DevFlags;
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
	window.dispatchEvent(new CustomEvent('devflags:changed', { detail: merged }));
}

export function onDevFlagsChange(handler: (flags: DevFlags) => void) {
	if (typeof window === 'undefined') return () => {};
	const listener = (e: Event) => {
		const detail = (e as CustomEvent).detail as DevFlags | undefined;
		handler(detail ?? readStorage());
	};
	window.addEventListener('devflags:changed', listener as EventListener);
	return () => window.removeEventListener('devflags:changed', listener as EventListener);
}
