# Software Jars

A hub of small, single-purpose apps ("jars") — an idea board, a dice
roller, an idea-scoring matrix, and more over time. See
`frontend/CLAUDE.md` for the detailed technical/contributor reference;
this file stays at the higher-level "how does this thing actually work"
altitude.

## Architecture

**No backend, no accounts, no login wall.** Every jar is a client-side
Next.js (App Router) app. A jar's data — boards, columns, stickers,
projects, variables, whatever — lives in the browser via `localStorage`,
not on a server. There's no sign-up, no password, no OAuth screen
anywhere in the app.

### Same-device persistence

Each jar's data is wrapped in a small "external store" (see
`lib/local-storage-store.ts`) that:

- Caches the current state in memory and mirrors it to `localStorage` on
  every write.
- Listens for the browser's native `storage` event, which fires in every
  *other* tab of the same origin when `localStorage` changes. Without
  this, a tab left open before another tab writes new data keeps a stale
  in-memory copy — and the next time that stale tab writes anything, it
  silently overwrites the newer data. (This shipped as a real bug before
  the fix; see `lib/local-storage-store.test.ts` for the regression test.)

This is enough for "I use one browser on one device" — the overwhelming
majority of usage. It is not enough for "I edit on my phone, then check
on my laptop," since `localStorage` never leaves the browser it was
written in.

### Cross-device sync

An opt-in layer on top of the above, built around a **pairing code**
instead of an account:

```
 Phone                                          Laptop
┌───────────────────┐                     ┌───────────────────┐
│ localStorage       │                     │ localStorage       │
│ (source of truth   │                     │ (source of truth   │
│  for this device)  │                     │  for this device)  │
└─────────┬──────────┘                     └─────────┬──────────┘
          │ PUT after each write                      │ PUT after each write
          │ GET on load / focus                        │ GET on load / focus
          ▼                                            ▼
   /api/sync/[jar]/[code]  ◄────────────────────────────┘
          │
          ▼
   Redis (Upstash) — one entry per (jar, code):
   { data: <jar's JSON state>, updatedAt: <timestamp> }
```

- **The code is the only credential.** Generated client-side
  (`crypto.randomUUID()`), shown in Settings, and typed into a second
  device once to link it — the same trust model WhatsApp Web/Signal
  Desktop use for linking a browser to a phone (a code/QR instead of a
  password). Whoever has the code can read and write that data; there's
  no separate identity check. One code links *all* jars that opt in at
  once, not one link per jar.
- **Each jar's data is namespaced** by the jar's own id, both in
  `localStorage` (so jars never collide with each other on one device)
  and in the Redis key (`software-jars:sync:{jar}:{code}`, so the same
  code cleanly separates one jar's synced data from another's).
- **Sync is push-on-write, pull-on-load/focus**, not a live/real-time
  connection — after a local change, the new state is pushed (debounced)
  to the backend; on load or when a tab regains focus, the latest server
  copy is pulled and applied locally if it's newer.
- **Conflict handling is last-write-wins**, compared by a server-set
  timestamp — deliberately simple, not a CRDT/merge strategy. This has
  the same failure mode as the cross-tab bug above, just across devices:
  two devices editing concurrently while both offline can have one's
  changes silently overwritten on reconnect. Acceptable for this app's
  low-stakes personal data.
- **The backend is intentionally tiny**: one Next.js route
  (`app/api/sync/[jar]/[code]/route.ts`) with a `GET` and a `PUT`, backed
  by Upstash Redis (a serverless-friendly key-value store — chosen
  because the route itself runs as a stateless serverless function with
  no persistent memory of its own between requests; Redis is the actual
  persistent copy). No ORM, no schema migrations, no auth middleware.
- **Works with zero configuration.** If `UPSTASH_REDIS_REST_URL` /
  `UPSTASH_REDIS_REST_TOKEN` aren't set, the app still builds and runs
  fine — sync silently fails closed (the API route returns `503`, the
  client just skips that sync attempt and keeps using local data). Most
  visitors never generate a code and never touch this code path at all.

### Why this shape, not something else

- **Not real auth** (email/password, OAuth): would mean a sign-in wall or
  a visible "Sign in" affordance, which conflicts with the goal of never
  gating the app behind an account.
- **Not SQLite-in-the-browser** (e.g. SQLite Wasm + OPFS): solves a
  different problem (richer local queries on a lot of local data) than
  the one that mattered here (getting the *same* small blob onto a
  *second device*). It adds real complexity (WASM loading, a worker for
  OPFS, bundle size) without addressing cross-device sync at all — you'd
  still need this same pairing/backend layer on top of it.
- **Redis over Postgres**: no real preference — either works for "given a
  code, store/retrieve a small JSON blob." Redis was chosen for
  simplicity (no schema) and because Upstash's free tier comfortably
  covers personal, low-volume usage indefinitely.
