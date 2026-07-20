import { getSyncCode, subscribeSyncCode } from '@/lib/sync-code';

const PUSH_DEBOUNCE_MS = 800;

type SyncableStore<T> = {
  getSnapshot: () => T;
  writeState: (state: T) => void;
  subscribe: (listener: () => void) => () => void;
};

type SyncEnvelope<T> = {
  data: T | null;
  updatedAt: string | null;
};

// Wires a jar's localStorage-backed store to the /api/sync/[jar]/[code]
// endpoint: pulls the latest remote copy on attach/focus/code-change, and
// pushes (debounced) after every local write that didn't itself come from a
// pull. No-ops entirely when no sync code is set (the common case — most
// visitors never touch this).
export const attachRemoteSync = <T>(jarNamespace: string, store: SyncableStore<T>): void => {
  if (typeof window === 'undefined') return;

  let lastSyncedAt: string | null = null;
  let applyingRemote = false;
  let pushTimer: ReturnType<typeof setTimeout> | null = null;

  const push = async () => {
    const code = getSyncCode();
    if (!code) return;
    try {
      const res = await fetch(`/api/sync/${jarNamespace}/${code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(store.getSnapshot()),
      });
      if (!res.ok) return;
      const body = (await res.json()) as { updatedAt: string };
      lastSyncedAt = body.updatedAt;
    } catch {
      // Offline or the sync service is unreachable — local storage is still
      // the source of truth, so just skip this push and try again next write.
    }
  };

  const pull = async () => {
    const code = getSyncCode();
    if (!code) return;
    try {
      const res = await fetch(`/api/sync/${jarNamespace}/${code}`);
      if (!res.ok) return;
      const body = (await res.json()) as SyncEnvelope<T>;
      if (body.data === null || body.updatedAt === null) return;
      if (lastSyncedAt !== null && body.updatedAt <= lastSyncedAt) return;

      applyingRemote = true;
      store.writeState(body.data);
      applyingRemote = false;
      lastSyncedAt = body.updatedAt;
    } catch {
      // Offline — keep whatever's in localStorage, retry next time.
    }
  };

  store.subscribe(() => {
    if (applyingRemote) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(push, PUSH_DEBOUNCE_MS);
  });

  // Re-pull whenever the sync code changes (linked/unlinked/generated) or
  // this tab regains focus (covers "made a change on my phone, switched
  // back to my laptop tab").
  subscribeSyncCode(pull);
  window.addEventListener('focus', pull);

  pull();
};
