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
│   ├── layout.tsx           # Root layout: html/body, ThemeProvider, NextIntlClientProvider
│   ├── globals.css          # Tailwind v4 theme tokens + custom dice-roll keyframes
│   └── (app)/                # Everything that renders inside the Hub shell
│       ├── layout.tsx        # Wraps children in <AppShell>
│       ├── page.tsx          # Home page — the "Jars" section
│       ├── settings/
│       │   └── page.tsx      # Empty placeholder for now
│       └── jars/
│           ├── dice-roller/
│           │   └── page.tsx    # The Dice Roller jar's route
│           └── idea-board/
│               ├── page.tsx    # Boards list (create/rename/delete boards)
│               └── [boardId]/
│                   └── page.tsx # One board's Kanban view — the jar's own sub-route
├── components/
│   ├── app-shell.tsx         # Composition root: TopBar + DesktopSidebar + MobileBottomNav
│   ├── desktop-sidebar.tsx   # Left nav (desktop), reads lib/nav.ts
│   ├── mobile-bottom-nav.tsx # Bottom tab bar (mobile), same lib/nav.ts data
│   ├── top-bar.tsx           # App name, theme toggle, language indicator
│   ├── theme-provider.tsx    # next-themes wrapper
│   ├── ui/                   # shadcn/ui primitives (button, select, tooltip)
│   └── jars/
│       ├── jar-shape.tsx     # Reusable SVG "glass jar" outline + centered icon
│       ├── jar-card.tsx      # Home page tile: JarShape + name + description, links to the jar
│       ├── dice-roller/
│       │   ├── dice-roller.tsx  # Main jar UI: sides/count pickers, roll button, results, history
│       │   └── dice-face.tsx    # Single die's animated face (tumble while rolling, settle on land)
│       └── idea-board/
│           ├── editable-text.tsx  # Shared click-to-edit text (board/column titles, sticker text)
│           ├── boards-list.tsx    # Boards list page content
│           ├── board-view.tsx     # Kanban view: DndContext, drag handlers, pack + columns
│           ├── sticker-pack.tsx   # The "infinite pack" drag source
│           ├── column.tsx         # One column: title, sticky-note list, add/delete
│           └── sticker.tsx        # One sticky note: draggable, editable text, delete
├── lib/
│   ├── nav.ts                # Hub-level nav items (Home, Settings) — NOT jar-specific
│   ├── jars.ts                # Registry of jars shown on the home page
│   ├── dice.ts                # Pure dice-rolling logic (unit tested)
│   ├── idea-board.ts          # Pure board/column/sticker CRUD + localStorage persistence (unit tested)
│   ├── use-idea-boards.ts     # useSyncExternalStore hook wrapping idea-board.ts for React
│   └── utils.ts                # `cn()` helper (clsx + tailwind-merge)
├── i18n/
│   ├── routing.ts             # locales = ['en'], defaultLocale = 'en'
│   └── request.ts             # next-intl request config, reads `locale` cookie
├── messages/
│   └── en.json                 # All translation strings, namespaced by feature
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

# 4. UI Blocks

- Home page: `app/(app)/page.tsx`
- Settings page: `app/(app)/settings/page.tsx`
- Dice Roller jar: `app/(app)/jars/dice-roller/page.tsx`
- Idea Board jar: `app/(app)/jars/idea-board/page.tsx` (boards list) and
  `app/(app)/jars/idea-board/[boardId]/page.tsx` (one board)
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

Idea Board is the first jar with its own data, saved to the browser only
(no backend exists yet). The pattern it establishes, for any future jar
that needs the same:

- One plain module per jar (e.g. `lib/idea-board.ts`) holding the types,
  all CRUD/mutation functions, and a tiny external-store implementation:
  a module-level cached snapshot, a `Set` of listeners, `subscribe()`,
  `getSnapshot()`, and a server-safe `getServerSnapshot()` that returns an
  empty/default state. Every mutation function reads the current snapshot,
  computes the next state, writes it to `localStorage`, and notifies
  listeners — plain functions, callable directly from event handlers, no
  hooks required.
- A one-line hook per jar (e.g. `lib/use-idea-boards.ts`) that wires that
  module into React via `useSyncExternalStore(subscribe, getSnapshot,
  getServerSnapshot)`. This is the React-idiomatic way to bridge a
  browser-only store like `localStorage` into SSR-rendered components
  without a hydration mismatch — don't reach for `useState` +
  `useEffect(() => setState(readLocalStorage()), [])` instead, since a
  server/client-differing initial value there causes exactly the
  hydration-mismatch class of bug (see the `top-bar.tsx` theme-icon note
  in Coding Standards below for a real example of that failure mode).
- Storage key namespaced per jar (`software-jars:idea-board`) so jars
  never collide with each other's data.
- A `resetXForTests()` export that clears both the module cache and
  `localStorage`, called from `beforeEach` in unit tests — needed because
  the cached snapshot is module-scoped and otherwise leaks between tests.

# 7. Testing

- Unit tests: Vitest, colocated as `*.test.ts` next to the code. `lib/dice.ts`
  (pure functions) and `lib/idea-board.ts` (pure CRUD logic, no DOM —
  localStorage is provided by jsdom in tests) are the two examples so far.
  Run with `npm test`.
- E2E tests: Playwright, in `e2e/`, numbered files like kino
  (`1-home.spec.ts` for the Hub shell; `2-idea-board.spec.ts` for that jar's
  non-drag flows). Run with `npm run e2e`. Per-jar e2e specs are optional,
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

# 8. Coding Standards

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
