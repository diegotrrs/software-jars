// One code per browser, shared across every jar that opts into sync — linking
// devices once (via Settings) links all of them, not one jar at a time. Each
// jar's data still lives under its own namespace server-side (see remote-sync.ts).
const CODE_KEY = 'software-jars:sync-code';

export const getSyncCode = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(CODE_KEY);
};

export const setSyncCode = (code: string): void => {
  window.localStorage.setItem(CODE_KEY, code);
  window.dispatchEvent(new Event('sync-code-change'));
};

export const generateSyncCode = (): string => {
  const code = crypto.randomUUID();
  setSyncCode(code);
  return code;
};

// Stops this device from syncing — does not delete the data already stored
// server-side under the old code, so re-entering the same code later resumes it.
export const clearSyncCode = (): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CODE_KEY);
  window.dispatchEvent(new Event('sync-code-change'));
};

// A same-tab event, since the native `storage` event only fires in OTHER
// tabs — components displaying the code need to react when this tab itself
// generates/clears/links one.
export const subscribeSyncCode = (listener: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('sync-code-change', listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener('sync-code-change', listener);
    window.removeEventListener('storage', listener);
  };
};
