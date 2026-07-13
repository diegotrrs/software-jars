# Infrastructure Patterns from Kino

Extracted from `/Users/diego/Documents/projects/kino` on 2026-07-13. These are
the domain-agnostic, cross-cutting technical patterns — not the calendar/trip
domain logic — that are worth reusing as a starting template for a new
full-stack app with a backend (e.g. Software Jars). Kino's stack:
Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui on the frontend,
FastAPI + PostgreSQL (raw SQL via psycopg2) + JWT on the backend.

## 1. Routing

- Next.js App Router with **route groups** to separate layout concerns
  without affecting the URL:
  - `app/(app)/` — authenticated routes, wrapped in a shell with nav
    (`app/(app)/layout.tsx` → `<AppShell>`).
  - `app/(marketing)/` — public/unauthenticated routes (login, signup,
    landing page), no nav chrome.
  - `app/auth/actions.ts` — server actions for login/signup/logout/reset,
    outside both groups since they're actions, not pages.
- **Auth guard pattern**: no middleware-based redirect for protected pages.
  Instead, each protected page reads the `token` cookie itself at the top of
  its server-side data-fetching function and calls `redirect('/login')` if
  missing, e.g. `app/(app)/home/page.tsx`:
  ```ts
  const getAuthToken = async (): Promise<string> => {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) redirect('/login');
    return token;
  };
  ```
  Also redirects to `/login` on a `401` from the backend fetch. This is
  simple and explicit but means the check is duplicated per page — worth
  deciding upfront whether to keep that or centralize it (e.g. in a shared
  `layout.tsx` or middleware) for a new project.
- `middleware.ts` is used only for locale cookie detection (see i18n below),
  not for auth — matcher excludes `_next/static`, `_next/image`,
  `favicon.ico`.
- Dynamic segments follow standard Next.js conventions:
  `app/(app)/calendars/[uuid]/page.tsx`, `[uuid]/edit/page.tsx`.

## 2. Translations / i18n

- Library: **next-intl**.
- Locales are **not** URL-prefixed (no `/en/...`) — instead resolved from a
  `locale` cookie per request:
  - `i18n/routing.ts` — locale list + default (`locales = ['en','es','pt','de']`,
    `defaultLocale = 'en'`).
  - `i18n/request.ts` — `getRequestConfig` reads the `locale` cookie, falls
    back to default, dynamically imports `messages/<locale>.json`.
  - `middleware.ts` sets the `locale` cookie from `Accept-Language` **only on
    first visit** (never overwrites an explicit user choice).
  - `lib/locale.ts` — `detectLocale()` parses `Accept-Language` with quality
    weights, does exact then prefix matching against supported locales.
- Message files: `messages/<locale>.json`, flat-ish nested JSON keyed by
  feature/section (`nav`, `topBar`, `marketing.landing`, etc.) — one
  top-level namespace per screen/concern.
- Usage:
  - Server components: `const t = await getTranslations('home')` from
    `next-intl/server`.
  - Client components: `const t = useTranslations('nav')` from `next-intl`.
- Login flow restores the user's saved locale from the DB after login,
  which can race with cookie state — worth noting if you add
  server-persisted locale preference later.
- Library version: `next-intl@^4.11.1`.
- Kino's own `NOTES.md` flags this cookie-based approach as a deliberate
  tradeoff: *"If SEO becomes important then the i18n approach would need to
  change. Having the language in the url would make it easier to discover
  /en/home."* Worth deciding upfront for Software Jars whether SEO matters
  (a public Explore/marketplace page plausibly wants to be indexed per
  locale) — if so, prefer URL-prefixed locales from the start rather than
  retrofitting.

## 3. UI Navigation

- **Single source of truth** for nav items, consumed by multiple nav
  surfaces: `lib/nav.ts` exports a typed `navItems: NavItem[]` array
  (`labelKey`, `href`, `icon` (lucide-react), `section: 'main' | 'bottom'`,
  `testId`).
- Both `components/desktop-sidebar.tsx` and `components/mobile-bottom-nav.tsx`
  read from the same `navItems` list and filter by `section` — avoids
  duplicating nav structure per breakpoint.
- `components/app-shell.tsx` is the composition root: fetches the current
  user server-side from a cookie token, then renders `TopBar` +
  `DesktopSidebar` + `MobileBottomNav` + `<main>`, passing `isLoggedIn`/`user`
  down. This is the one place that decides "am I logged in" for chrome
  purposes (separate from the per-page auth **guard**, which decides
  whether to redirect).
- Responsive nav pattern: desktop sidebar + mobile bottom tab bar, toggled
  via Tailwind breakpoints (`md:hidden` / `md:ml-16`), not separate routes.
- Every nav link carries a `data-testid` (e.g. `nav-home`) specifically so
  e2e tests can target it reliably instead of relying on text/label
  matching that breaks across locales.

## 4. E2E Tests

- Framework: **Playwright** (`@playwright/test`), config at
  `frontend/playwright.config.ts`.
- Tests live in `frontend/e2e/`, one file per feature area, **numbered** for
  intended run order and readability (`1-landing-page.spec.ts`,
  `2-authentication.spec.ts`, ... `13-hot-trips.spec.ts`), each wrapped in a
  `test.describe('@1. landing page', ...)` block with numbered test names
  (`@1.1`, `@1.2`) — makes it easy to reference a specific test in
  conversation/CI logs.
- `playwright.config.ts` highlights:
  - `webServer` auto-starts `npm run dev` and reuses an existing server
    outside CI.
  - `globalSetup` (`e2e/global-setup.ts`) ensures a test user exists before
    any test runs (signs up, or logs in if already exists, to validate the
    stored password) — avoids needing manual test-data seeding per run.
  - `retries: CI ? 2 : 1`, `workers: CI ? undefined : 2`, screenshots/video
    only retained on failure.
- `e2e/helpers/api.ts` is a shared helper module with typed functions that
  call the **real backend API directly** (not mocked) to set up state for
  tests: `login()`, `getToken()`, `createCalendar()`, `deleteCalendar()`,
  `inviteMember()`, `createEvent()`, etc. Tests compose these to build
  fixtures instead of clicking through the UI for setup, keeping tests
  focused on the behavior under test.
- **Test-only backend reset endpoints**, gated by a shared secret header,
  used only for e2e cleanup — not reachable in normal use:
  `backend/app/routers/test.py` exposes `DELETE /api/test/reset` and
  `DELETE /api/test/users/{id}`, both requiring an `X-Test-Secret` header
  matched against a `test_reset_secret` setting (503 if unconfigured, 403 if
  wrong secret, and a simple in-process rate limit of 1 call/5s on the reset
  endpoint). This is a clean pattern for letting e2e tests reset state
  without exposing destructive endpoints to real users.
- `.env.local` holds `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`,
  `E2E_TEST_RESET_SECRET`, `API_BASE_URL`, `BASE_URL` — e2e config is
  entirely env-driven, nothing hardcoded.
- Locale-sensitivity gotcha handled explicitly: the shared `login()` helper
  force-sets the `locale` cookie to `en` and reloads after login, because a
  concurrently-running i18n test could otherwise leave the DB-restored
  locale as `es` and break assertions in other test files.
- No CI workflow is actually wired up yet (`.github/workflows/` exists but
  is empty) — e2e currently runs locally only.

## 5. Backend structure (for context on how frontend connects)

FastAPI, layered by concern under `backend/app/`:

```
app/
├── routers/      # thin HTTP layer — validate input, call crud, return response
├── crud/         # all SQL lives here, no business/HTTP concerns
├── schemas/      # Pydantic request/response models, pure data shapes
├── auth.py       # JWT issuing/verification, password hashing, auth dependencies
├── database.py   # DB connection + FastAPI dependency (get_db)
├── email.py      # transactional email (Resend)
└── config.py     # settings via pydantic-settings (env-driven)
```

- Frontend talks to the backend over plain REST (`fetch`), not a generated
  client or GraphQL. Auth is a JWT passed as `Authorization: Bearer <token>`
  header; the token itself is stored in an httpOnly-ish cookie on the
  frontend side and attached manually per fetch call server-side (see
  `app-shell.tsx`, page-level `getAuthToken()`).
- `routers/test.py` + `crud/test.py` are backend-side test-only endpoints
  supporting the e2e pattern above — kept in the same layered structure as
  everything else, just gated by a secret.
- `main.py` wires routers with a URL prefix + OpenAPI tag per feature
  (`app.include_router(calendars_router, prefix="/api/calendars", tags=["calendars"])`),
  and conditionally mounts the test-only router only when
  `get_settings().env != "production"` — a second layer of protection on top
  of the shared-secret header, worth replicating.
- CORS is explicit and credentialed (`allow_credentials=True`,
  `allow_origins=["http://localhost:3000"]`) since auth relies on a cookie
  round-trip between frontend and backend origins.
- Dependencies (`backend/requirements.txt`): `fastapi`, `uvicorn[standard]`,
  `psycopg2-binary`, `pydantic-settings`, `passlib[bcrypt]`, `PyJWT`,
  `resend` (email), `ruff` (lint), `pytest`/`pytest-cov`/`httpx` (backend
  tests, separate from the Playwright e2e suite).

## What's kino-specific and should NOT be copied

- Actual nav items (`home`, `createCalendar`, `events`, `settings`) and their
  icons — these are calendar-app-specific; Software Jars needs its own
  (e.g. `explore`, `myJars`).
- Message content in `messages/*.json` (calendar/trip copy).
- Domain routes: `calendars/`, `events/`, `feedback/` page structure —
  reusable as a *pattern* (route groups, dynamic segments) but not the
  actual route names.
- `CurrentUser`/`Calendar`/`Event` types in `lib/types.ts`.
- The specific e2e spec files themselves — reuse the *structure*
  (numbered files, shared API helpers, test-reset endpoint) not the tests.

## Open question for Software Jars

Kino's per-page auth-guard-via-cookie-check works for a handful of
protected pages but duplicates the check everywhere. Since Software Jars'
home page needs both public (Explore) and private (My Jars) content on the
**same page**, a single per-page redirect guard won't fit — worth deciding
whether My Jars is conditionally rendered within one page (check auth,
render section or a "sign in to see your jars" prompt) rather than gating
navigation to the page itself.
