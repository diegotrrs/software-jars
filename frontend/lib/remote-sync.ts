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
  let pushInFlight = false;
  // Bumped on every local write; a pull discards its result if this moved
  // while it was in flight (see the race-condition note on `pull` below).
  let writeVersion = 0;

  const push = async () => {
    const code = getSyncCode();
    if (!code) return;
    pushInFlight = true;
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
    } finally {
      pushInFlight = false;
    }
  };

  const pull = async () => {
    const code = getSyncCode();
    if (!code) return;
    // A pending or in-flight push means there's a local edit the server
    // doesn't have yet — pulling now could only fetch stale data, so skip
    // this round and let the next pull (post-push) pick up the real state.
    if (pushTimer !== null || pushInFlight) return;

    // Snapshot the write counter so we can tell, once the fetch resolves,
    // whether the user typed something *during* this round trip. Without
    // this, a pull that started before a local edit but resolves after it
    // would overwrite that edit with the pre-edit data it fetched — this is
    // the "I type it and it disappears" production bug: the initial pull
    // fired on attach is still in flight while the user's first keystrokes
    // land, and `lastSyncedAt` being null at that point meant the freshness
    // check below was a no-op, so the stale response always won.
    const versionAtStart = writeVersion;
    try {
      const res = await fetch(`/api/sync/${jarNamespace}/${code}`);
      if (!res.ok) return;
      const body = (await res.json()) as SyncEnvelope<T>;

      if (body.data === null || body.updatedAt === null) {
        // Nothing stored under this code for this jar yet — seed the server
        // with whatever's already local, so a second device linking the same
        // code actually finds something instead of silently waiting for the
        // next edit on this device to trigger a push.
        push();
        return;
      }

      if (lastSyncedAt !== null && body.updatedAt <= lastSyncedAt) return;
      if (writeVersion !== versionAtStart) return;

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
    writeVersion++;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      pushTimer = null;
      push();
    }, PUSH_DEBOUNCE_MS);
  });

  // Re-pull whenever the sync code changes (linked/unlinked/generated) or
  // this tab regains focus (covers "made a change on my phone, switched
  // back to my laptop tab").
  subscribeSyncCode(pull);
  window.addEventListener('focus', pull);

  pull();
};
