# 1. Project description

The Software Jars frontend is a Next.js 15/16-style App Router application
(TypeScript, Tailwind CSS 4, shadcn/ui) that hosts the Hub shell (home page,
nav, settings) and every individual jar. There is no backend yet — this is
a fully client/server-rendered static app with no external API calls, no
auth, and a single locale (`en`).

Its infrastructure (routing, i18n, nav, testing) deliberately mirrors a
sibling project, kino, at matching dependency versions — see
`../kino-infra-patterns.md` for the full rationale behind each choice.
Domain-specific packages from kino (calendar/map libraries) were **not**
carried over; only genuinely infrastructural dependencies were.

# 2. File & Module Structure

```
frontend/
├── app/
│   ├── layout.tsx           # Root layout: html/body, ThemeProvider, NextIntlClientProvider,
│   │                          apple-web-app / theme-color metadata (see Section 8, PWA)
│   ├── manifest.ts          # Web app manifest (Next's file convention) — name, icons, colors
│   ├── globals.css          # Tailwind v4 theme tokens + custom dice-roll keyframes
│   └── (app)/                # Everything that renders inside the Hub shell
│       ├── layout.tsx        # Wraps children in <AppShell>
│       ├── page.tsx          # Home page — the "Jars" section
│       ├── settings/
│       │   └── page.tsx      # Empty placeholder for now
│       ├── icon.svg           # Site icon/favicon — hardcoded-color copy of the Logo mark
│       └── jars/
│           ├── dice-roller/
│           │   └── page.tsx    # The Dice Roller jar's route
│           ├── idea-board/
│           │   ├── page.tsx    # Boards list (create/rename/delete boards)
│           │   └── [boardId]/
│           │       └── page.tsx # One board's Kanban view — the jar's own sub-route
│           └── idea-matrix/
│               ├── page.tsx    # Projects list (create/rename/delete projects)
│               └── [projectId]/
│                   └── page.tsx # One project's variables/candidates view
├── app/api/
│   └── sync/[jar]/[code]/
│       └── route.ts          # GET/PUT — Redis-backed cross-device sync (see Section 7)
├── components/
│   ├── app-shell.tsx         # Composition root: TopBar + DesktopSidebar + MobileBottomNav
│   ├── sync-init.tsx         # Client-only: eagerly loads every sync-enabled jar's store (see Section 7)
│   ├── service-worker-init.tsx # Client-only: registers public/sw.js once (see Section 8)
│   ├── desktop-sidebar.tsx   # Left nav (desktop), reads lib/nav.ts
│   ├── mobile-bottom-nav.tsx # Bottom tab bar (mobile), same lib/nav.ts data
│   ├── top-bar.tsx           # App name, theme toggle, language switcher
│   ├── language-switcher.tsx # Locale picker — writes the `locale` cookie + router.refresh()
│   ├── sync-settings.tsx     # Settings UI: generate/link/unlink the cross-device sync code
│   ├── logo.tsx               # The jar mark used next to "Software Jars" in the top bar
│   ├── theme-provider.tsx    # next-themes wrapper
│   ├── ui/                   # shadcn/ui primitives (button, select, tooltip)
│   └── jars/
│       ├── jar-shape.tsx     # Reusable SVG "glass jar" outline + centered icon
│       ├── jar-card.tsx      # Home page tile: JarShape + name + description, links to the jar
│       ├── dice-roller/
│       │   ├── dice-roller.tsx  # Main jar UI: sides/count pickers, roll button, results, history
│       │   └── dice-face.tsx    # Single die's animated face (tumble while rolling, settle on land)
│       ├── idea-board/
│       │   ├── editable-text.tsx  # Shared click-to-edit text (board/column titles, sticker text)
│       │   ├── boards-list.tsx    # Boards list page content
│       │   ├── board-view.tsx     # Kanban view: DndContext, drag handlers, pack + columns
│       │   ├── sticker-pack.tsx   # The "infinite pack" drag source (hidden below md: on mobile)
│       │   ├── column.tsx         # One column: title, sticky-note list, add/delete
│       │   └── sticker.tsx        # One sticky note: draggable, editable text, delete
│       └── idea-matrix/
│           ├── editable-text.tsx  # Same click-to-edit pattern, own copy per jar
│           ├── projects-list.tsx  # Projects list page content
│           ├── project-view.tsx   # One project: variables (axes) + candidates table
│           ├── axis-editor.tsx    # One variable and its options
│           └── candidates-table.tsx # Candidate rows: selections, scores, computed score
├── lib/
│   ├── nav.ts                # Hub-level nav items (Home, Settings) — NOT jar-specific
│   ├── jars.ts                # Registry of jars shown on the home page
│   ├── dice.ts                # Pure dice-rolling logic (unit tested)
│   ├── local-storage-store.ts # Shared localStorage-backed external-store factory (see Section 6)
│   ├── idea-board.ts          # Board/column/sticker CRUD, built on local-storage-store (unit tested)
│   ├── use-idea-boards.ts     # useSyncExternalStore hook wrapping idea-board.ts for React
│   ├── idea-matrix.ts         # Project/axis/candidate CRUD, built on local-storage-store (unit tested)
│   ├── use-idea-matrix.ts     # useSyncExternalStore hook wrapping idea-matrix.ts for React
│   ├── sync-code.ts           # The one shared cross-device pairing code (see Section 7)
│   ├── use-sync-code.ts       # useSyncExternalStore hook wrapping sync-code.ts for React
│   ├── remote-sync.ts         # attachRemoteSync() — push/pull against /api/sync/[jar]/[code]
│   ├── redis.ts                # Server-only Upstash Redis client (Redis.fromEnv())
│   └── utils.ts                # `cn()` helper (clsx + tailwind-merge)
├── i18n/
│   ├── routing.ts             # locales = ['en', 'es'], defaultLocale = 'en'
│   └── request.ts             # next-intl request config, reads `locale` cookie
├── messages/
│   ├── en.json                 # All translation strings, namespaced by feature
│   └── es.json                 # Spanish — every key in en.json must have a matching key here
├── public/
│   ├── sw.js                    # Service worker — runtime caching, /api/* always excluded (Section 8)
│   ├── icon-192.png              # PWA install icon
│   ├── icon-512.png              # PWA install icon
│   └── icon-maskable-512.png     # PWA install icon, Android adaptive-icon safe zone
├── proxy.ts                    # Next 16's renamed "middleware" — seeds the locale cookie
├── e2e/                         # Playwright specs, numbered like kino's
└── lib/dice.test.ts             # Vitest unit test for dice-rolling logic
```

# 3. How to add a new jar

1. Add an entry to `lib/jars.ts` (`id`, `nameKey`, `descriptionKey`, `href`,
   `icon` from lucide-react, `testId`).
2. Add its strings under a new namespace in `messages/en.json` (e.g.
   `jars.<jarId>.name` / `.description`, plus a jar-specific namespace for
   its own UI strings).
3. Create `app/(app)/jars/<jar-id>/page.tsx` and build the jar's UI under
   `components/jars/<jar-id>/`. The jar is free to add its own sub-routes
   under `app/(app)/jars/<jar-id>/*` — that's its "own navigation stack".
4. The home page (`app/(app)/page.tsx`) needs no changes — it renders
   whatever is in the `jars` registry via `JarCard`.
5. If the jar has its own data and should support cross-device sync, pass
   `{ syncNamespace: '<jar-id>' }` as the third argument to
   `createLocalStorageStore` (see Section 7), **and** add a side-effect
   import of the jar's store module (e.g. `import '@/lib/<jar-id>'`) to
   `components/sync-init.tsx`. This must go in `sync-init.tsx` specifically,
   not `app-shell.tsx` — `app-shell.tsx` has no `'use client'` directive
   (it's a Server Component), so an import placed there only runs during
   SSR and never reaches the actual browser bundle for pages that don't
   otherwise need that jar; `sync-init.tsx` is a real client component
   mounted from `app-shell.tsx` specifically so its imports do end up in the
   client bundle on every page. Without this, a jar's sync only activates
   once its own page has been visited in the current tab, so
   generating/linking a code from Settings wouldn't reach it until then —
   this was a real, once-shipped bug (data appeared to vanish when linking a
   fresh device that had never opened the affected jar in that session).

# 4. UI Blocks

- Home page: `app/(app)/page.tsx`
- Settings page: `app/(app)/settings/page.tsx` (includes cross-device sync
  controls — `components/sync-settings.tsx`, see Section 7)
- Dice Roller jar: `app/(app)/jars/dice-roller/page.tsx`
- Idea Board jar: `app/(app)/jars/idea-board/page.tsx` (boards list) and
  `app/(app)/jars/idea-board/[boardId]/page.tsx` (one board)
- Idea Matrix jar: `app/(app)/jars/idea-matrix/page.tsx` (projects list) and
  `app/(app)/jars/idea-matrix/[projectId]/page.tsx` (one project)
- Left/bottom nav data: `lib/nav.ts`
- Top bar: `components/top-bar.tsx`

Note: both `DesktopSidebar` and `MobileBottomNav` render every nav item
in the DOM simultaneously — visibility is toggled by Tailwind breakpoints
(`hidden md:flex` / `md:hidden`), not conditional mounting. Any
`getByTestId` lookup on a nav item in e2e tests will resolve to two
elements; use `.first()`.

# 5. Internationalisation (i18n)

Uses **next-intl**, same cookie-based pattern as kino (no `/en/` URL
prefix). Two locales exist today: `en` (default) and `es`, listed in
`i18n/routing.ts`. Every new UI string needs a matching key added to
**both** `messages/en.json` and `messages/es.json` — nothing falls back
automatically if a key is missing from one of them.

- Server components: `const t = await getTranslations('home')` from
  `next-intl/server`.
- Client components: `const t = useTranslations('nav')` from `next-intl`.
- Components that render arbitrary jar data (e.g. `JarCard`) call
  `useTranslations()` with no namespace and pass a fully-dotted key
  (e.g. `jars.diceRoller.name`) since the key varies per jar.
- `components/language-switcher.tsx` is the picker in the top bar (a
  shadcn `Select`, locale display names hardcoded there rather than
  translated — a language's own name doesn't change based on which
  language you're currently viewing). Switching writes the `locale`
  cookie directly (`document.cookie`) and calls `router.refresh()` to
  re-run server components (including the root layout's `getMessages()`
  call) with the new cookie value — no full page reload needed, and no
  client-side message-swapping logic required.

# 6. Client-side persistence (localStorage-backed jars)

Idea Board and Idea Matrix have their own data, saved to the browser only
(no backend exists yet). The shared building block is
`lib/local-storage-store.ts` — `createLocalStorageStore<T>(storageKey,
emptyState)` returns `{ getSnapshot, getServerSnapshot, subscribe,
writeState, resetForTests }`. **Every localStorage-backed jar should use
this rather than hand-rolling the cache/listener bookkeeping again.**

- One plain module per jar (e.g. `lib/idea-board.ts`) holding the types
  and all CRUD/mutation functions, built on one `createLocalStorageStore`
  call. Re-export `subscribe`, `getSnapshot`, `getServerSnapshot`, and
  `resetForTests` (as `resetXForTests`) from the store instance; every
  mutation function reads `getSnapshot()`, computes the next state, and
  calls `writeState(...)` — plain functions, callable directly from event
  handlers, no hooks required.
- A one-line hook per jar (e.g. `lib/use-idea-boards.ts`) that wires that
  module into React via `useSyncExternalStore(subscribe, getSnapshot,
  getServerSnapshot)`. This is the React-idiomatic way to bridge a
  browser-only store like `localStorage` into SSR-rendered components
  without a hydration mismatch — don't reach for `useState` +
  `useEffect(() => setState(readLocalStorage()), [])` instead, since a
  server/client-differing initial value there causes exactly the
  hydration-mismatch class of bug (see the `top-bar.tsx` theme-icon note
  in Coding Standards below for a real example of that failure mode).
- Storage key namespaced per jar (`software-jars:idea-board`,
  `software-jars:idea-matrix`) so jars never collide with each other's data.
- **Cross-tab sync is handled inside `createLocalStorageStore` itself** —
  it listens for the native `storage` event (fires in every other tab of
  the same origin when the key changes) and refreshes its cached snapshot
  when it fires. This is not optional polish: without it, a tab left open
  before another tab writes new data keeps a stale in-memory snapshot, and
  the next write from that stale tab silently overwrites the newer data —
  a real data-loss bug that shipped in both jars before this was added
  (see `lib/local-storage-store.test.ts` for the regression test). If you
  ever build a store that does *not* go through this factory, you need to
  reimplement this yourself or you will reintroduce that bug.
- `resetForTests` (re-exported per jar as `resetXForTests`) clears both
  the in-memory cache and `localStorage`, called from `beforeEach` in unit
  tests — needed because the cached snapshot is module-scoped and
  otherwise leaks between tests.

# 7. Cross-device sync (optional, per-jar opt-in)

localStorage is per-browser, not per-person — a phone and a laptop never
share it. Cross-device sync is a deliberately login-free, account-free
layer on top of the persistence in Section 6, built around a **pairing
code** rather than identity: whoever has the code (a `crypto.randomUUID()`,
generated client-side) can read/write that data. There's no password, no
email, no OAuth screen — the code itself is the only credential, entered
once on a second device via Settings (`components/sync-settings.tsx`) to
link it. This is the same trust model WhatsApp Web/Signal Desktop use for
linking a browser to a phone (QR code instead of a typed code), not
something novel — see the git history / conversation log around when this
was built for the fuller security discussion (bearer-token model,
brute-force resistance of a 122-bit UUID, what a leaked code exposes).

**One code, shared across every synced jar** — linking a device once in
Settings links it for all jars that opt in, not jar-by-jar. Each jar's
data is still namespaced separately server-side so they can't collide.

- **Opting a jar in**: pass a third argument to `createLocalStorageStore`:
  `{ syncNamespace: 'idea-board' }` (the jar's own id). That's the entire
  integration — `local-storage-store.ts` calls `attachRemoteSync` (in
  `lib/remote-sync.ts`) automatically when this is set. Omit it for jars
  that don't need cross-device sync.
- **`lib/sync-code.ts`** owns the one shared code: `getSyncCode`,
  `generateSyncCode`, `setSyncCode` (used when linking with a code typed
  from another device), `clearSyncCode`, and `subscribeSyncCode` (a
  same-tab event — the native `storage` event only fires in *other* tabs,
  but UI showing the code needs to react when *this* tab changes it).
  `lib/use-sync-code.ts` wraps it for React via `useSyncExternalStore`,
  same pattern as everywhere else in this codebase.
- **`lib/remote-sync.ts`** (`attachRemoteSync(jarNamespace, store)`) is the
  actual push/pull logic: pulls on attach, on the tab regaining focus, and
  whenever the sync code changes; pushes (debounced 800ms) after every
  local write that didn't itself come from applying a pull (guarded by an
  `applyingRemote` flag, to avoid a pull → write → push → pull ping-pong).
  No-ops entirely (never calls `fetch`) when no code is set — the default,
  common case for most visitors, who never touch this feature.
- **Conflict handling is last-write-wins**, compared by a server-set
  `updatedAt` ISO timestamp — deliberately simple, not a CRDT/merge
  strategy. This has the *same* failure mode as the cross-tab bug in
  Section 6, just across devices instead of tabs: two devices editing
  concurrently while both offline can have one's changes silently
  overwritten on reconnect. Acceptable for this app's low-stakes personal
  data; revisit if that assumption ever changes.
- **Backend**: `app/api/sync/[jar]/[code]/route.ts` — `GET` reads,
  `PUT` writes, both via `lib/redis.ts` (`Redis.fromEnv()`, i.e. reads
  `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` from the
  environment — set these in `.env.local` for local dev and in the Vercel
  project's env vars for prod; an Upstash account/database is required).
  Server-side data is namespaced per jar in the Redis key itself
  (`software-jars:sync:{jar}:{code}`), separately from the localStorage
  key namespacing in Section 6. Entries expire after 90 days (`TTL_SECONDS`)
  so abandoned/forgotten codes don't accumulate forever. Both handlers
  catch Redis errors and return `503` rather than throwing — this matters
  because the app must keep working with **zero** Upstash configuration
  (the common case): `Redis.fromEnv()` doesn't throw at construction time
  even with missing env vars, so the build always succeeds regardless, and
  requests just fail gracefully (slowly — a few seconds — without real
  credentials, since the SDK retries before giving up; fast once real
  credentials are set).
- Real drag-style flakiness doesn't apply here, but the same testing
  philosophy does: unit-test the logic with mocked `fetch`/mocked Redis
  (`lib/remote-sync.test.ts`, `lib/sync-code.test.ts`,
  `app/api/sync/[jar]/[code]/route.test.ts`) rather than e2e-testing an
  actual two-browser round trip through real Upstash, which needs live
  credentials CI won't have.
- **Every jar's store must go through `components/sync-init.tsx`'s
  side-effect imports for its `attachRemoteSync` wiring to actually reach
  the browser bundle on every page**, not just its own jar's page. This
  once shipped as a real bug: an import placed in `app-shell.tsx` directly
  (instead of in `sync-init.tsx`) silently did nothing, because
  `app-shell.tsx` has no `'use client'` directive — it's a Server
  Component, so the import only ran during SSR (correctly no-op'd there by
  the `typeof window` guard) and never made it into the actual client
  bundle for pages that don't otherwise import that jar's module. The
  symptom was exactly "I linked the same code on both devices but the
  data still isn't there" — the fix (`sync-init.tsx` as a genuine client
  component, mounted from `app-shell.tsx`) was verified against the real
  Upstash backend with two separate browser contexts standing in for two
  devices, not just mocked unit tests, specifically because this class of
  bug (works in an isolated unit test, silently no-ops in the real app)
  doesn't show up any other way.

# 8. Progressive Web App

Installable (icon on the home screen, opens without browser chrome) and
able to load its app shell without a network connection for pages already
visited this session — see `docs/features/pwa.md` for the full plan,
scope decisions, and why a hand-rolled service worker was used instead of
a precaching library like `@serwist/next`.

- `app/manifest.ts` — Next's file convention for the web app manifest.
- `public/icon-192.png`, `public/icon-512.png`,
  `public/icon-maskable-512.png` — PNG rasters of `components/logo.tsx`'s
  jar mark on a solid indigo background (`#4F46E5`, matching the theme's
  primary color), generated via a throwaway Playwright screenshot script
  (not committed) rather than adding an image-processing dependency for a
  one-time task. Regenerate the same way if the logo mark ever changes.
- `app/layout.tsx`'s `metadata.appleWebApp` / `metadata.icons.apple` /
  `metadata.other['apple-mobile-web-app-capable']` — iOS Safari's "Add to
  Home Screen" predates and diverges from the manifest spec; Next's
  `appleWebApp.capable` only emits the modern non-prefixed
  `mobile-web-app-capable` meta tag, so the legacy `apple-` prefixed one
  is added explicitly via `metadata.other` for older iOS versions that
  only check that one.
- `public/sw.js` — hand-written service worker, **runtime caching only,
  not precaching**: caches a response the first time it's actually
  requested, serves from cache on repeat visits or when offline. Requests
  under `/api/` (in particular `/api/sync/*`) are explicitly never
  intercepted — always network-only, unchanged from before the service
  worker existed. This was verified against the real Upstash backend
  (generate/link a code, confirm data still moves between two browser
  contexts) with the service worker active, since a naively-configured
  service worker caching API responses would silently break sync by
  serving stale data instead of hitting Redis.
- `components/service-worker-init.tsx` — registers `public/sw.js` once,
  mounted from `app-shell.tsx` alongside `sync-init.tsx`.
- Known limitation, by design: only pages visited at least once this
  session work offline. An unvisited page correctly fails to load
  offline — guaranteeing first-visit-offline would need a build-time
  precache manifest (every hashed static asset filename for the current
  deploy), which is real added complexity/a new dependency, not something
  hand-rolled cheaply. Revisit only if that specific guarantee turns out
  to matter in practice.

# 9. Testing

- Unit tests: Vitest, colocated as `*.test.ts` next to the code. `lib/dice.ts`
  (pure functions), `lib/local-storage-store.ts` (the shared store factory —
  including a regression test for the cross-tab sync bug via a dispatched
  `StorageEvent`), `lib/idea-board.ts` / `lib/idea-matrix.ts` (pure CRUD
  logic, no DOM — localStorage is provided by jsdom in tests), and the
  cross-device sync trio (`lib/sync-code.test.ts`, `lib/remote-sync.test.ts`
  with a mocked `fetch`, `app/api/sync/[jar]/[code]/route.test.ts` with a
  mocked `@/lib/redis`) are the examples so far. Run with `npm test`.
- E2E tests: Playwright, in `e2e/`, numbered files like kino
  (`1-home.spec.ts` for the Hub shell; `2-idea-board.spec.ts` and
  `3-idea-matrix.spec.ts` for those jars' non-drag flows). Run with
  `npm run e2e`. Per-jar e2e specs are optional,
  added when a jar's interaction logic is complex enough to warrant it —
  drag-and-drop gestures specifically are **not** simulated in e2e (flaky,
  low-ROI in Playwright); verify those manually or via a throwaway script
  instead, and keep the e2e spec to the non-drag paths (button-based
  add/delete, navigation, confirmation dialogs).
  The dev server runs on **port 3100** (not 3000) specifically to avoid
  colliding with kino's own dev server when both are running locally —
  see `playwright.config.ts` and the `dev`/`start` scripts in
  `package.json`.
- `npm run check` runs both (`vitest run && playwright test`), matching
  kino's convention.

# 10. Coding Standards

No dedicated coding-standards doc exists yet for this project (kino has
one at `frontend/docs/coding_standards.md` if a reference is needed).
Broadly: single quotes, `react-hooks` lint rules enforced (including
`set-state-in-effect` — derive state during render instead of syncing via
`useEffect` where possible), 2-space indentation, no comments beyond what
explains non-obvious *why*.

The `set-state-in-effect` rule has two accepted, deliberately-commented
exceptions in this codebase — not places to "fix" if you see them:
- A one-time client-mount guard (`top-bar.tsx`'s theme icon) — `resolvedTheme`
  from next-themes is `undefined` during SSR, so rendering it directly
  causes a hydration mismatch (server always renders one icon, client may
  immediately resolve to the other). The standard fix is a `mounted` flag
  set via `useEffect(() => setMounted(true), [])`, gating the
  theme-dependent render until after hydration — this is next-themes' own
  documented pattern, not something to replace with a `useSyncExternalStore`
  version (there's no meaningful "external store" here, just a mount check).
- External-store subscription callbacks (event listeners, keydown handlers)
  that call `setState` inside the listener callback, not synchronously in
  the effect body — this is the explicitly-endorsed pattern per the rule's
  own guidance ("subscribe for updates from an external system, calling
  setState in a callback").

For anything that reads from an actual external store with a snapshot
(localStorage, in particular), use `useSyncExternalStore` instead of
`useState` + effect — see Section 6.
