import { afterEach, describe, expect, it } from 'vitest';
import { createLocalStorageStore } from './local-storage-store';

const STORAGE_KEY = 'test:local-storage-store';

afterEach(() => {
  window.localStorage.removeItem(STORAGE_KEY);
});

describe('createLocalStorageStore', () => {
  it('returns the empty state when nothing is stored yet', () => {
    const store = createLocalStorageStore(STORAGE_KEY, { items: [] as string[] });
    expect(store.getSnapshot()).toEqual({ items: [] });
  });

  it('persists writes to localStorage and reflects them in getSnapshot', () => {
    const store = createLocalStorageStore(STORAGE_KEY, { items: [] as string[] });
    store.writeState({ items: ['a'] });
    expect(store.getSnapshot()).toEqual({ items: ['a'] });
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toEqual({ items: ['a'] });
  });

  it('notifies subscribed listeners on write', () => {
    const store = createLocalStorageStore(STORAGE_KEY, { items: [] as string[] });
    let calls = 0;
    const unsubscribe = store.subscribe(() => { calls++; });

    store.writeState({ items: ['a'] });
    expect(calls).toBe(1);

    unsubscribe();
    store.writeState({ items: ['a', 'b'] });
    expect(calls).toBe(1);
  });

  it('picks up writes made by another tab via the storage event, instead of keeping a stale cache', () => {
    const store = createLocalStorageStore(STORAGE_KEY, { items: [] as string[] });

    // Populate this tab's in-memory cache with the "old" state.
    store.writeState({ items: ['from-this-tab'] });
    expect(store.getSnapshot()).toEqual({ items: ['from-this-tab'] });

    // Simulate another tab writing directly to localStorage and firing the
    // native cross-tab notification (this tab's own writeState() would NOT
    // fire a storage event on itself — only other tabs receive it).
    const otherTabState = { items: ['from-this-tab', 'from-another-tab'] };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(otherTabState));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: JSON.stringify(otherTabState) }));

    // This tab's cached snapshot must now reflect the other tab's write —
    // proving a later writeState() here won't clobber it.
    expect(store.getSnapshot()).toEqual(otherTabState);
  });

  it('ignores storage events for unrelated keys', () => {
    const store = createLocalStorageStore(STORAGE_KEY, { items: [] as string[] });
    store.writeState({ items: ['a'] });

    window.dispatchEvent(new StorageEvent('storage', { key: 'some-other-key', newValue: '{}' }));

    expect(store.getSnapshot()).toEqual({ items: ['a'] });
  });

  it('resetForTests clears both the cache and localStorage', () => {
    const store = createLocalStorageStore(STORAGE_KEY, { items: [] as string[] });
    store.writeState({ items: ['a'] });
    store.resetForTests();
    expect(store.getSnapshot()).toEqual({ items: [] });
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
