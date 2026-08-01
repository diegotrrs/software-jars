import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attachRemoteSync } from './remote-sync';
import { clearSyncCode, setSyncCode } from './sync-code';

type State = { items: string[] };

const createMockStore = (initial: State) => {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => state,
    writeState: (next: State) => {
      state = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

beforeEach(() => {
  clearSyncCode();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('attachRemoteSync', () => {
  it('does nothing when no sync code is set', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const store = createMockStore({ items: [] });
    attachRemoteSync('test-jar', store);
    await vi.runAllTimersAsync();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('pulls remote data on attach and applies it locally when present', async () => {
    setSyncCode('abc123');
    const remoteState = { items: ['from-remote'] };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: remoteState, updatedAt: '2026-01-01T00:00:00.000Z' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const store = createMockStore({ items: [] });
    attachRemoteSync('test-jar', store);
    await vi.runAllTimersAsync();

    expect(fetchMock).toHaveBeenCalledWith('/api/sync/test-jar/abc123');
    expect(store.getSnapshot()).toEqual(remoteState);
  });

  it('does not overwrite local data when the remote has nothing stored yet', async () => {
    setSyncCode('abc123');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: null, updatedAt: null }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const store = createMockStore({ items: ['still-local'] });
    attachRemoteSync('test-jar', store);
    await vi.runAllTimersAsync();

    expect(store.getSnapshot()).toEqual({ items: ['still-local'] });
  });

  it('seeds the server with local data when a pull finds nothing stored yet (regression: a device linking a fresh/unused code must actually push its existing data, not silently wait for the next edit)', async () => {
    setSyncCode('abc123');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: null, updatedAt: null }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const store = createMockStore({ items: ['pre-existing-local-data'] });
    attachRemoteSync('test-jar', store);
    await vi.runAllTimersAsync();

    const putCalls = fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'PUT');
    expect(putCalls).toHaveLength(1);
    expect(putCalls[0][1]).toEqual(
      expect.objectContaining({ body: JSON.stringify({ items: ['pre-existing-local-data'] }) })
    );
  });

  it('pushes (debounced) a PUT after a local write', async () => {
    setSyncCode('abc123');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: null, updatedAt: null }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const store = createMockStore({ items: [] });
    attachRemoteSync('test-jar', store);
    await vi.runAllTimersAsync();
    fetchMock.mockClear();

    store.writeState({ items: ['local-change'] });
    expect(fetchMock).not.toHaveBeenCalled(); // debounce hasn't elapsed yet

    await vi.advanceTimersByTimeAsync(800);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/sync/test-jar/abc123',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ items: ['local-change'] }) })
    );
  });

  it('does not push back a write caused by its own pull (no ping-pong)', async () => {
    setSyncCode('abc123');
    const remoteState = { items: ['from-remote'] };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: remoteState, updatedAt: '2026-01-01T00:00:00.000Z' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const store = createMockStore({ items: [] });
    attachRemoteSync('test-jar', store);
    await vi.runAllTimersAsync();

    const putCalls = fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'PUT');
    expect(putCalls).toHaveLength(0);
  });

  it('does not let a slow in-flight pull clobber a local write that happens before it resolves (regression: "I type it and it disappears")', async () => {
    setSyncCode('abc123');
    const staleRemote = { items: ['stale-from-before-the-edit'] };

    let resolveGet!: (value: { ok: true; json: () => Promise<unknown> }) => void;
    const getPromise = new Promise((resolve) => {
      resolveGet = resolve;
    });
    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.method === 'PUT') {
        return Promise.resolve({ ok: true, json: async () => ({ updatedAt: '2026-01-02T00:00:00.000Z' }) });
      }
      return getPromise;
    });
    vi.stubGlobal('fetch', fetchMock);

    const store = createMockStore({ items: [] });
    attachRemoteSync('test-jar', store); // fires the initial pull, still in flight

    // The user types something while that first pull is still on the wire.
    store.writeState({ items: ['just-typed'] });

    // Now the slow pull finally resolves with data fetched before the edit.
    resolveGet({ ok: true, json: async () => ({ data: staleRemote, updatedAt: '2026-01-01T00:00:00.000Z' }) });
    await vi.runAllTimersAsync();

    expect(store.getSnapshot()).toEqual({ items: ['just-typed'] });
  });

  it('silently ignores a failed fetch (offline) rather than throwing', async () => {
    setSyncCode('abc123');
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    const store = createMockStore({ items: ['local'] });
    expect(() => attachRemoteSync('test-jar', store)).not.toThrow();
    await vi.runAllTimersAsync();

    expect(store.getSnapshot()).toEqual({ items: ['local'] });
  });
});
