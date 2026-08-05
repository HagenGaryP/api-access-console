# API Access Console

An internal-tool UI for reviewing API access requests: searching, filtering, inspecting request details, and approving or rejecting pending requests. Built as a portfolio piece to demonstrate modern Next.js App Router architecture, strict TypeScript modeling, accessible UI patterns, and a real automated-testing/CI setup — not a production system.

## Feature set

- **Request table** — requester, team, API, environment, access level, submission date, and status for every request, with a responsive card layout on narrow viewports.
- **Search and filtering** — free-text search across requester name/email/team/API, plus status and environment filters, with sort by newest/oldest.
- **Filtered-empty state** — a distinct message (and one-click "Clear filters") when active filters produce no matches, separate from the true empty-data state.
- **Request detail panel** — an accessible side panel with full request context (requester, request details, justification, reviewer notes, decision metadata) opened per row.
- **Approve/reject workflow** — reviewers can approve or reject pending requests from the detail panel, with pending/success/error feedback states.
- **Light/dark theme toggle** — persisted to `localStorage`, applied before first paint to avoid a flash of the wrong theme.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full breakdown. In short:

- **Next.js App Router** with **Server Components by default** — [src/app/page.tsx](src/app/page.tsx) loads request data on the server and passes it to the client dashboard. No client-side fetch-on-mount for initial page data.
- **React 19 + TypeScript**, with explicit domain models, discriminated result/state unions where useful (e.g. `SubmitDecisionResult`, `ActionState`), and unknown Server Function inputs validated at runtime rather than trusted from their declared types.
- **Client Components** only where interactivity requires them (dashboard, toolbar, detail panel, theme toggle).
- **Server Functions** (`"use server"`) as the decision boundary — [src/features/access-requests/actions.ts](src/features/access-requests/actions.ts) validates and processes approve/reject decisions, treating all inputs as untrusted regardless of their TypeScript types.
- **CSS Modules** for component-scoped styles; `src/app/globals.css` is reserved for reset/base styles, theme tokens, and typography.
- **Feature-oriented structure** under `src/features/access-requests/`, keeping domain types, mock data, validation, Server Functions, and UI components together.

## Testing

- **Vitest** as the test runner, with **jsdom** as the DOM environment.
- **React Testing Library** + **@testing-library/user-event** for behavior-based tests driven by accessible roles, labels, and visible output (not implementation details or snapshots).
- **@testing-library/jest-dom** for readable DOM assertions.
- Coverage includes: search/status/environment filtering, the filtered-empty state and filter reset, opening the detail panel, keyboard focus entering the panel and returning to the trigger on close, approving and rejecting a pending request, and failed-decision error feedback. The Server Function boundary (`submitDecision`) is mocked only where needed for deterministic component tests.
- A smaller unit-test suite covers `validateDecisionInput`, the runtime validation Server Functions rely on for untrusted input.

Run the suite with `pnpm test`.

## Continuous Integration

[.github/workflows/ci.yml](.github/workflows/ci.yml) runs on every pull request targeting `main`, every push to `main`, and on manual dispatch. Each run installs dependencies with a frozen lockfile, then runs tests, lint, TypeScript validation, and the production build as separate steps. This confirms the workflow runs and passes on PRs and pushes — it does not mean branch protection or required-status-checks are configured on the repository.

## Accessibility and responsive design

- Semantic landmarks and headings (`<main>`, `<aside>` detail panel, labeled `<section>`s) rather than generic `<div>` soup.
- The request table has a proper `<caption>`, `<th scope="col">` headers, and an equivalent `<article>`-based card presentation for narrow viewports — both render the same data; CSS controls which one is displayed at a given viewport width.
- The detail panel manages focus deliberately: opening it moves focus to its close button, and closing it (via the close button or Escape) returns focus to the row button that opened it.
- Decision feedback uses `role="status"` for success and `role="alert"` for errors so outcomes are announced without extra wiring.
- Interactive controls have explicit accessible names (`aria-label`, associated `<label>`s) rather than relying on visual context alone.

## Data model and limitations

All data is mocked in [src/features/access-requests/mock-data.ts](src/features/access-requests/mock-data.ts) — there is no database. Reads and writes simulate network latency, and a module-level flag can simulate fetch/decision failures for testing error states.

Decisions (approve/reject) update state **only in the browser session** that made them: the dashboard keeps a local copy of the request list and updates it in place when a decision succeeds. **Reloading the page discards those changes and restores the original seeded mock data.** There is no persistence layer, authentication, or multi-user state by design — this is a UI/interaction proof piece, not a production backend.

## Project scope

**In scope:** reviewing, filtering, and deciding on API access requests in a single-session UI; realistic mocked latency and failure states; accessible and responsive interaction patterns; automated tests and CI validation.

**Intentionally deferred / not implemented:**
- Authentication or authorization
- A real database or persisted storage
- Audit history / decision trails beyond the single most recent decision
- Notifications
- Pagination or multi-page workflows
- Role management
- Deployment configuration

This reflects what's implemented today. The target architecture and product scope for these deferred items are defined in [docs/PRODUCT_BLUEPRINT.md](docs/PRODUCT_BLUEPRINT.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#milestone-3-target-architecture) — none of it is implemented yet.

## Getting started

Requires [pnpm](https://pnpm.io) (version pinned via the `packageManager` field in [package.json](package.json)).

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Available scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Start the Next.js development server |
| `pnpm test` | Run the Vitest suite |
| `pnpm lint` | Run ESLint |
| `pnpm exec tsc --noEmit` | Type-check the project without emitting output |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve the production build |

## Repository structure

```text
src/
  app/                        # Route entry, layout, loading/error states, global styles
  components/ui/              # Small, non-feature-specific UI primitives (e.g. ThemeToggle)
  features/access-requests/   # Domain types, mock data, validation, Server Functions, UI
  lib/                        # Small cross-cutting helpers (e.g. theme storage key)
docs/
  ARCHITECTURE.md             # Detailed architecture and design decisions
.github/workflows/ci.yml      # Pull request / push CI validation
```
