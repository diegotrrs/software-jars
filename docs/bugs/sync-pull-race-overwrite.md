# Bug: typed ideas disappearing on synced devices

**Reported**: production (softwarejars.com), Idea Board and Idea Matrix.
**Symptom**: type an idea into a sticker/candidate, and it vanishes — the
field reverts to empty (or the whole board/project looks like it lost
content). Not reproducible locally.

## Root cause

Race condition in `frontend/lib/remote-sync.ts`'s `pull()`.

`attachRemoteSync` fires an initial `pull()` as soon as it runs (on page
load). That fetch is asynchronous — while it's in flight, nothing stops
the user from typing. If the user's edit lands *before* the pull's
response comes back, the pull still finishes and unconditionally applies
whatever it fetched via `store.writeState(...)`, overwriting the fresh
local edit with the pre-edit data it happened to fetch.

The pull is supposed to be guarded by a freshness check:

```ts
if (lastSyncedAt !== null && body.updatedAt <= lastSyncedAt) return;
```

but `lastSyncedAt` starts as `null` and is only set after the *first*
successful sync completes. On that very first pull of a page load, the
guard is unconditionally skipped — there's nothing to compare against yet
— so the first pull always wins the race, no matter how stale its data
is relative to a write that happened during its round trip.

## Why it reproduced in prod but not locally

The whole push/pull mechanism in `remote-sync.ts` no-ops entirely when
`getSyncCode()` returns `null` (`lib/sync-code.ts`) — the default state
for a browser that's never linked a cross-device sync code. Local dev
browsers had never linked a code, so nothing was racing. softwarejars.com
had a code linked from earlier cross-device testing (see `frontend/CLAUDE.md`
Section 7), so the pull was live and the race was reachable — most easily
triggered right after a fresh page load, before the initial pull resolves.

## Fix

Two additions to `attachRemoteSync` (`frontend/lib/remote-sync.ts`):

- `pushInFlight` flag + `pushTimer !== null` check: `pull()` now skips
  entirely whenever a push is pending (debouncing) or actually in flight.
  A pending push means there's a local edit the server doesn't have yet —
  pulling in that window could only fetch data older than what's on
  screen.
- `writeVersion` counter, bumped on every local write: `pull()` snapshots
  it before its `fetch` and compares after the response comes back. If a
  local write happened while the pull was in flight, the fetched data is
  discarded instead of applied.

```ts
// lib/remote-sync.ts — pull(), abbreviated
const versionAtStart = writeVersion;
const res = await fetch(`/api/sync/${jarNamespace}/${code}`);
const body = await res.json();
if (lastSyncedAt !== null && body.updatedAt <= lastSyncedAt) return;
if (writeVersion !== versionAtStart) return; // a local write raced this pull — discard
applyingRemote = true;
store.writeState(body.data);
applyingRemote = false;
lastSyncedAt = body.updatedAt;
```

## Verification

- New regression test in `frontend/lib/remote-sync.test.ts`: fires the
  initial pull with a deferred (unresolved) fetch, performs a local write
  while it's still pending, then resolves the pull with stale data and
  asserts the local write survives.
- Full unit suite (73 tests), `tsc --noEmit`, and lint all pass.

## Still to do

The fix is only committed locally as of this writing — it needs to ship
(commit, push, deploy) to actually resolve the issue on
softwarejars.com. See `frontend/lib/remote-sync.ts` and
`frontend/lib/remote-sync.test.ts` for the change.
