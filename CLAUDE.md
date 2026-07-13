# Software Jars

## Concept

Software Jars is the **Hub app**: a website for discovering and using
**jars** — small apps that each do one single thing (in the spirit of Unix
philosophy / micro-apps). The Hub is the container/shell; each jar is a
smaller app that lives inside it. "Mini app" is not used as terminology
anywhere in this project — always say **jar**.

- Software Jars (Hub app) = the overall product/shell that hosts everything:
  navigation, the home page, and whatever cross-jar concerns (auth, settings)
  eventually exist.
- A jar = one small app within the Hub, each doing a single thing.
- Each jar has its own independent navigation stack (i.e. jars are
  self-contained, not just pages within one shared app shell) even though
  they're all launched from and live within the Hub. In the frontend, jars
  are routed under a shared `/jars/*` segment, each free to grow its own
  sub-routes.
- Visually, jars are displayed on the home page as an actual jar
  (glass jar illustration/container) with the jar's icon shown inside it —
  this is a core piece of the visual identity, not just a card or icon grid.

## Home Page Structure

Current state (as of the first jar, Dice Roller): the home page has **one**
section, "Jars", listing every available jar — there is no auth yet, so
everyone sees the same list.

Planned future direction, once user accounts exist: split this into two
sections on the same page (not separate routes):

1. **Explore** — browse/discover jars made by others (the catalog/marketplace
   view). Today's single "Jars" section is effectively this, unauthenticated.
2. **My Jars** — the jars the current user has saved, installed, or created.

When that split happens, both sections should still render on the same home
page — the user should never have to navigate away from home to switch
between exploring and their own jars.

## Tech Stack

Frontend lives in `./frontend` — see `frontend/CLAUDE.md` for structure,
conventions, and how to add a new jar. It intentionally mirrors the
infrastructure (not the domain logic) of a sibling project, kino, at
matching dependency versions: Next.js 16.1.1 (App Router), React 19.2.3,
TypeScript, Tailwind CSS 4, shadcn/ui ("new-york" style), next-intl for
i18n, next-themes for dark mode, Vitest for unit tests, Playwright for e2e.
The full rationale for each infra choice (routing, i18n, nav, testing) is
recorded in `kino-infra-patterns.md`.

No backend exists yet, and there is no auth. The Dice Roller jar is
entirely client-side (no server calls needed for random dice rolls).

## Open Questions / Not Yet Decided

These came up implicitly but haven't been specified yet — check with the user
before assuming an answer:

- Backend framework/hosting — not started. Likely to follow kino's FastAPI +
  PostgreSQL pattern given the shared infra approach, but unconfirmed.
- Whether jars are built by the Software Jars team, by third-party
  developers, or both (i.e. is this a platform/marketplace with submissions?).
- Whether "installing/saving" a jar to My Jars is just a bookmark, or involves
  actually running/hosting per-user state for that jar.
- Auth/account model for My Jars (implies user accounts exist) — needed
  before the Explore/My Jars split above can be built.
- What other jars are planned next (only Dice Roller exists today).

## Working Notes

This file covers product intent and cross-jar decisions. Frontend
implementation conventions (file structure, how to add a jar, i18n/nav
usage) live in `frontend/CLAUDE.md` — prefer deriving those specifics from
the code once it exists rather than duplicating them here.
