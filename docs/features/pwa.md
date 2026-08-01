# Feature plan: Progressive Web App

## Goal

Make Software Jars installable on a phone/desktop (icon on the home
screen, opens without browser chrome) and able to load its app shell
without a network connection. This is a natural extension of the existing
architecture: jar data already lives in `localStorage` and already works
without network — the gap is that the page itself still needs network to
load at all today.

**Explicitly not a goal for this pass**: this must not interfere with the
cross-device sync feature (`/api/sync/[jar]/[code]`). Sync calls always
need to hit the real network — caching them would serve stale data and
make devices silently think they're in sync when they aren't.

## Scope for this pass

In:
- Installable on Android (Chrome "Add to Home Screen" / install prompt)
  and iOS (Safari "Add to Home Screen"), with a proper icon and
  standalone display (no browser chrome).
- App shell (HTML/JS/CSS/static assets) cached as they're visited, so
  pages you've already opened this session load without network.
- Sync API routes explicitly excluded from any caching — always
  network-only, unchanged from today's behavior.

Out (for now, revisit if it becomes worth it):
- Guaranteed **first-visit** offline capability (i.e. installing the app
  while offline, cold). That needs a build-time precache manifest
  (Workbox/`@serwist/next`-style — knowing every hashed static asset
  filename for the current deploy ahead of time) rather than the simpler
  "cache what you actually fetch as you go" approach below. Adding that
  machinery is a real dependency + config decision, not a few lines — not
  worth it unless "must fully work offline immediately after install" turns
  out to matter in practice.
- Push notifications, background sync, per-device iOS splash screens —
  none of that is needed for what this app does.

## Why hand-roll the service worker instead of a library

Consistent with this project's existing preference (curated infra, add a
dependency only when the thing being built genuinely needs it — see
`kino-infra-patterns.md` and how Dice Roller's animation was done in
plain CSS rather than pulling in a motion library): a **runtime caching**
strategy (cache a response the first time it's actually requested, serve
from cache on repeat visits) doesn't need to know the full list of
hashed build asset filenames up front, so it's genuinely simple to write
by hand — no build-time manifest generation required. That's the
difference from a full **precaching** setup (guaranteeing offline-from-
first-install), which does need that machinery and is where a library
like `@serwist/next` would actually earn its keep. Revisit that trade-off
if the "out of scope" item above turns out to matter.

## Pieces

1. **`app/manifest.ts`** (Next.js's built-in file convention, same idea as
   the existing `app/icon.svg`) — app name, short name, icons, theme
   color (matching the indigo accent), background color, `display:
   'standalone'`, `start_url: '/'`.

2. **Icons** — PNG rasters of the existing `Logo` mark (`components/
   logo.tsx`), since manifest icon support for SVG is unreliable
   (especially iOS): 192×192, 512×512, plus a maskable variant (extra
   padding so Android's adaptive-icon mask doesn't clip it) at 512×512.
   Generated once as static files in `public/`, not dynamically rendered.

3. **iOS meta tags** — added to `app/layout.tsx`'s metadata export:
   `apple-touch-icon` link, `apple-mobile-web-app-capable`, status bar
   style. Safari's "Add to Home Screen" predates and diverges from the
   standard manifest spec, so these are required separately for iOS to
   pick up the right icon and hide browser chrome.

4. **Service worker** (`public/sw.js`, hand-written, no new dependency) —
   three handlers:
   - `install` — no precache list; just activates immediately.
   - `activate` — clears any previous cache version (versioned cache name
     so a new deploy doesn't serve stale assets forever).
   - `fetch` — for any request under `/api/` (in particular
     `/api/sync/*`): pass straight through to the network, no caching,
     no interception logic at all. For everything else (pages, `/_next/
     static/*`, `icon.svg`, etc.): try the network first; on success,
     store a copy in the cache and return it; on failure (offline), fall
     back to whatever's cached from a previous visit; if nothing's
     cached either, the request just fails (expected — you can't load a
     page you've never visited while offline with this simpler strategy).

5. **Registration** — a small client component (similar shape to
   `sync-init.tsx`) that calls `navigator.serviceWorker.register('/sw.js')`
   once, mounted from `app-shell.tsx` alongside `SyncInit`. Guarded by
   `'serviceWorker' in navigator` for browsers without support.

## Verification plan

- `npm run build && npm run start`, then in a real browser: confirm the
  manifest is linked (`<link rel="manifest">` in page source), confirm
  DevTools → Application → Manifest shows no errors, confirm DevTools →
  Application → Service Workers shows it registered and activated.
- Visit a couple of pages, then simulate offline (DevTools → Network →
  Offline) and reload — those specific pages should still load; an
  unvisited page should correctly fail to load (matches the "out of
  scope" call above).
- With the service worker active, exercise the existing sync flow
  end-to-end again (generate/link a code, confirm data still moves
  between two browser contexts) — this is the regression check that
  matters most, since it's the one thing that must not break.
- Run the existing full test suite (`npm run check`) to confirm nothing
  else regressed.
- Try "Add to Home Screen" on an actual Android phone and iPhone if
  available — the manifest/meta-tag correctness is easiest to trust with
  a real device, not just DevTools.
