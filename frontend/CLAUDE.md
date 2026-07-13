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
│           └── dice-roller/
│               └── page.tsx  # The Dice Roller jar's route
├── components/
│   ├── app-shell.tsx         # Composition root: TopBar + DesktopSidebar + MobileBottomNav
│   ├── desktop-sidebar.tsx   # Left nav (desktop), reads lib/nav.ts
│   ├── mobile-bottom-nav.tsx # Bottom tab bar (mobile), same lib/nav.ts data
│   ├── top-bar.tsx           # App name, theme toggle (dev-only), language indicator
│   ├── theme-provider.tsx    # next-themes wrapper
│   ├── ui/                   # shadcn/ui primitives (button, select, tooltip)
│   └── jars/
│       ├── jar-shape.tsx     # Reusable SVG "glass jar" outline + centered icon
│       ├── jar-card.tsx      # Home page tile: JarShape + name + description, links to the jar
│       └── dice-roller/
│           ├── dice-roller.tsx  # Main jar UI: sides/count pickers, roll button, results, history
│           └── dice-face.tsx    # Single die's animated face (tumble while rolling, settle on land)
├── lib/
│   ├── nav.ts                # Hub-level nav items (Home, Settings) — NOT jar-specific
│   ├── jars.ts                # Registry of jars shown on the home page
│   ├── dice.ts                # Pure dice-rolling logic (unit tested)
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
- Left/bottom nav data: `lib/nav.ts`
- Top bar: `components/top-bar.tsx`

Note: both `DesktopSidebar` and `MobileBottomNav` render every nav item
in the DOM simultaneously — visibility is toggled by Tailwind breakpoints
(`hidden md:flex` / `md:hidden`), not conditional mounting. Any
`getByTestId` lookup on a nav item in e2e tests will resolve to two
elements; use `.first()`.

# 5. Internationalisation (i18n)

Uses **next-intl**, same cookie-based pattern as kino (no `/en/` URL
prefix). Only one locale exists today (`en`) — the plumbing (`i18n/`,
`proxy.ts` seeding the `locale` cookie, `messages/en.json`) is in place
so adding a second locale later doesn't require restructuring.

- Server components: `const t = await getTranslations('home')` from
  `next-intl/server`.
- Client components: `const t = useTranslations('nav')` from `next-intl`.
- Components that render arbitrary jar data (e.g. `JarCard`) call
  `useTranslations()` with no namespace and pass a fully-dotted key
  (e.g. `jars.diceRoller.name`) since the key varies per jar.

# 6. Testing

- Unit tests: Vitest, colocated as `*.test.ts` next to the code (e.g.
  `lib/dice.test.ts`). Run with `npm test`.
- E2E tests: Playwright, in `e2e/`, numbered files like kino
  (currently just `1-home.spec.ts`, covering the Hub shell — nav, home,
  settings). Run with `npm run e2e`. Per-jar e2e specs (e.g. a
  `2-dice-roller.spec.ts`) are optional scaffolding, not a requirement —
  add one for a jar when its interaction logic is complex enough to
  warrant it, following the same numbered-file convention.
  The dev server runs on **port 3100** (not 3000) specifically to avoid
  colliding with kino's own dev server when both are running locally —
  see `playwright.config.ts` and the `dev`/`start` scripts in
  `package.json`.
- `npm run check` runs both (`vitest run && playwright test`), matching
  kino's convention.

# 7. Coding Standards

No dedicated coding-standards doc exists yet for this project (kino has
one at `frontend/docs/coding_standards.md` if a reference is needed).
Broadly: single quotes, `react-hooks` lint rules enforced (including
`set-state-in-effect` — derive state during render instead of syncing via
`useEffect` where possible), 2-space indentation, no comments beyond what
explains non-obvious *why*.
