# Sync — Code Reference

A condensed, code-first walkthrough of the four moving pieces: local
storage, the pairing token, the push/pull sync logic, and the Redis-backed
API route. For the narrative version (why it's shaped this way, the
security model, alternatives considered) see the "Architecture" section in
`README.md`. For the exhaustive contributor reference see
`frontend/CLAUDE.md`, Sections 6–7.

## 1. Local storage — the per-device source of truth

`frontend/lib/local-storage-store.ts` — a factory that wraps `localStorage`
as a React-compatible external store (`useSyncExternalStore`).

Write path — every mutation goes through this, caching in memory and
mirroring to `localStorage`:

```ts
// lib/local-storage-store.ts:44-48
const writeState = (state: T): void => {
  cachedState = state;
  window.localStorage.setItem(storageKey, JSON.stringify(state));
  emit();
};
```

Cross-*tab* sync — the native `storage` event fires in every other tab of
the same origin when the key changes (never in the tab that made the
write). Without this, a stale tab's next write silently overwrites newer
data written by another tab:

```ts
// lib/local-storage-store.ts:31-42
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey) return;
    cachedState = readFromStorage();
    emit();
  });
}
```

Opt-in to cross-*device* sync — one extra argument, namespaced by the
jar's own id:

```ts
// lib/local-storage-store.ts:68-70
if (options?.syncNamespace && typeof window !== 'undefined') {
  attachRemoteSync(options.syncNamespace, { getSnapshot, writeState, subscribe });
}
```

```ts
// lib/idea-board.ts — how a jar actually opts in
const store = createLocalStorageStore<IdeaBoardState>(STORAGE_KEY, { boards: [] }, { syncNamespace: 'idea-board' });
```

## 2. The token — a pairing code, not an account

`frontend/lib/sync-code.ts` — one code per browser, shared across every
jar that opts into sync. Whoever holds this code can read/write that
data; it's a bearer token, not an identity.

```ts
// lib/sync-code.ts:4, 6-20
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
  const code = crypto.randomUUID(); // 122 bits of entropy — not brute-forceable
  setSyncCode(code);
  return code;
};
```

Linking a second device is just calling `setSyncCode(pastedCode)` there —
see `components/sync-settings.tsx` for the UI around this (generate, copy,
paste-to-link, unlink).

## 3. Sync — push on write, pull on load/focus

`frontend/lib/remote-sync.ts` — the logic that actually talks to the
backend. No-ops entirely (never calls `fetch`) when no code is set, which
is the default for most visitors.

Push — debounced, fires after a local write:

```ts
// lib/remote-sync.ts:28-44
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
    // Offline or unreachable — local storage stays the source of truth.
  }
};
```

Pull — on attach, on focus, and whenever the code changes; only applies
the remote copy if it's actually newer, and skips entirely if a local
write raced it (see `docs/bugs/sync-pull-race-overwrite.md` — the initial
pull used to unconditionally win against a write that landed during its
round trip):

```ts
// lib/remote-sync.ts:53-94
const pull = async () => {
  const code = getSyncCode();
  if (!code) return;
  if (pushTimer !== null || pushInFlight) return; // a local edit is pending/in flight

  const versionAtStart = writeVersion;
  try {
    const res = await fetch(`/api/sync/${jarNamespace}/${code}`);
    if (!res.ok) return;
    const body = (await res.json()) as SyncEnvelope<T>;

    if (body.data === null || body.updatedAt === null) {
      push(); // seed the server if nothing's stored under this code yet
      return;
    }

    if (lastSyncedAt !== null && body.updatedAt <= lastSyncedAt) return;
    if (writeVersion !== versionAtStart) return; // a write raced this pull — discard it

    applyingRemote = true;   // guards against pull -> write -> push -> pull ping-pong
    store.writeState(body.data);
    applyingRemote = false;
    lastSyncedAt = body.updatedAt;
  } catch {
    // Offline — keep whatever's in localStorage, retry next time.
  }
};
```

Wiring — debounce timer on every store write (bumping `writeVersion`),
plus focus/code-change triggers:

```ts
// lib/remote-sync.ts:96-112
store.subscribe(() => {
  if (applyingRemote) return;
  writeVersion++;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    push();
  }, PUSH_DEBOUNCE_MS); // 800ms
});

subscribeSyncCode(pull);
window.addEventListener('focus', pull);
pull();
```

## 4. Redis storage — the shared backend

`frontend/lib/redis.ts` — the client, reading credentials from the
environment (never throws at import time, even with no credentials set —
see below):

```ts
// lib/redis.ts
import { Redis } from '@upstash/redis';
export const redis = Redis.fromEnv(); // reads UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
```

`frontend/app/api/sync/[jar]/[code]/route.ts` — the entire backend. Each
jar's data is namespaced in the Redis key itself:

```ts
// app/api/sync/[jar]/[code]/route.ts:5-6, 19
const TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days — abandoned codes expire, don't accumulate forever
const MAX_BODY_BYTES = 500_000;        // 500KB cap, cheap abuse guard

const buildKey = (jar: string, code: string): string => `software-jars:sync:${jar}:${code}`;
```

`GET` — read, return `{ data: null, updatedAt: null }` if nothing's there
yet:

```ts
// app/api/sync/[jar]/[code]/route.ts:29-36
try {
  const stored = await redis.get<SyncEnvelope>(buildKey(jar, code));
  return NextResponse.json(stored ?? { data: null, updatedAt: null });
} catch {
  return NextResponse.json({ error: 'Sync storage unavailable' }, { status: 503 });
}
```

`PUT` — write, server sets the timestamp (never trusts the client's clock):

```ts
// app/api/sync/[jar]/[code]/route.ts:57-64
const envelope: SyncEnvelope = { data, updatedAt: new Date().toISOString() };

try {
  await redis.set(buildKey(jar, code), envelope, { ex: TTL_SECONDS });
  return NextResponse.json({ updatedAt: envelope.updatedAt });
} catch {
  return NextResponse.json({ error: 'Sync storage unavailable' }, { status: 503 });
}
```

Both handlers catch Redis errors on purpose — `Redis.fromEnv()` doesn't
throw at construction time even with missing env vars, so the app always
builds; a request that actually hits Redis without credentials configured
just returns `503`, and the client above already treats that as "skip
this sync, try later."

## Environment variables

Set in `frontend/.env.local` (local dev, gitignored) and in the Vercel
project's Environment Variables (production) — same two names in both
places, values come from the Upstash dashboard's "REST API" tab on your
Redis database:

```
UPSTASH_REDIS_REST_URL=https://<your-db-name>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-token>
```
