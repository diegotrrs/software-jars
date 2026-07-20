import { attachRemoteSync } from '@/lib/remote-sync';

type LocalStorageStoreOptions = {
  // Opts this store into cross-device sync via /api/sync/[syncNamespace]/[code]
  // (see lib/remote-sync.ts) — pass the jar's own id (e.g. 'idea-board') so
  // its data is namespaced separately from every other jar's. Omit for jars
  // that don't need cross-device sync.
  syncNamespace?: string;
};

// A tiny external-store factory for localStorage-backed React state, meant to
// be used with `useSyncExternalStore`. Every localStorage-backed jar should
// build on this rather than hand-rolling its own cache/listener bookkeeping —
// see the cross-tab sync note below for why that matters.
export const createLocalStorageStore = <T>(storageKey: string, emptyState: T, options?: LocalStorageStoreOptions) => {
  const listeners = new Set<() => void>();
  let cachedState: T | null = null;

  const readFromStorage = (): T => {
    if (typeof window === 'undefined') return emptyState;
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T) : emptyState;
    } catch {
      return emptyState;
    }
  };

  const emit = () => listeners.forEach((listener) => listener());

  // Cross-tab sync: the native `storage` event fires in every OTHER tab/window
  // of the same origin when localStorage changes (never in the tab that made
  // the write). Without this, a tab left open before another tab wrote new
  // data keeps a stale in-memory snapshot — the next time that stale tab
  // writes anything, it silently overwrites the newer data with its old copy.
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key !== storageKey) return;
      cachedState = readFromStorage();
      emit();
    });
  }

  const writeState = (state: T): void => {
    cachedState = state;
    window.localStorage.setItem(storageKey, JSON.stringify(state));
    emit();
  };

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const getSnapshot = (): T => {
    if (cachedState === null) cachedState = readFromStorage();
    return cachedState;
  };

  const getServerSnapshot = (): T => emptyState;

  // Only for tests — clears the in-memory cache + localStorage so each test starts fresh.
  const resetForTests = (): void => {
    cachedState = null;
    if (typeof window !== 'undefined') window.localStorage.removeItem(storageKey);
  };

  if (options?.syncNamespace && typeof window !== 'undefined') {
    attachRemoteSync(options.syncNamespace, { getSnapshot, writeState, subscribe });
  }

  return { getSnapshot, getServerSnapshot, subscribe, writeState, resetForTests };
};
