# API Access Console — Architecture

## Overview

API Access Console is a single-page internal review tool for viewing, filtering, inspecting, and deciding on API access requests.

This project is intentionally scoped as a polished front-end proof piece rather than a production platform. It demonstrates strong judgment in UI architecture, React/Next.js patterns, TypeScript modeling, and engineering workflow (tests + CI) without overbuilding.

## Goals

- A clean, credible internal-tool UI
- A realistic reviewer workflow: scan requests, search/filter/sort, inspect request details, approve or reject a request
- A coherent, interview-defensible codebase: modern App Router patterns, clear server/client boundaries, minimal unnecessary abstraction
- Mocked data and simulated latency/failure to make the UI feel realistic without a backend
- Automated tests and CI as first-class parts of the project, not an afterthought

## Non-goals

Explicitly out of scope:

- Authentication / authorization
- A real database or persistence
- Audit history beyond the most recent decision
- Notifications
- Multi-page workflows / pagination
- Role management
- Production-grade deployment and security hardening

## Rendering model

The dashboard route is server-rendered by default:

- [src/app/page.tsx](../src/app/page.tsx) is an `async` Server Component and the route entry. It calls `fetchAccessRequests()` directly and passes the resolved list to `RequestsDashboard`.
- There is no client-side `useEffect`-driven fetch for the initial page data.
- [src/app/loading.tsx](../src/app/loading.tsx) renders a skeleton (mirroring the dashboard's layout) while the server request resolves, and [src/app/error.tsx](../src/app/error.tsx) is the route-level error boundary.

### Client boundaries

Everything below the initial data load that needs interactivity is a Client Component (`"use client"`), and only that:

- `RequestsDashboard` — owns session-local request state, search/filter/sort state, selection state, and focus-restoration bookkeeping.
- `RequestsToolbar` — search input and filter/sort controls; fully controlled by `RequestsDashboard`.
- `RequestDetailPanel` — request detail rendering, the approve/reject action UI, and its own local `ActionState` (idle/submitting/success/error).
- `ThemeToggle` — reads/writes the `data-theme` attribute and `localStorage`, independent of the request data flow entirely.

`RequestsTable` and `StatusBadge` are plain (server-renderable) components; they only become part of a client subtree because their parent (`RequestsDashboard`) is a Client Component, not because they need their own interactivity.

## Server Function decision boundary

[src/features/access-requests/actions.ts](../src/features/access-requests/actions.ts) is a `"use server"` module. `submitDecision(id, action)` is the only exported function and is the sole write path in the app.

Because Server Functions are reachable independently of the UI (e.g. a direct POST), `submitDecision` treats `id` and `action` as untrusted at runtime regardless of their declared TypeScript types:

1. `validateDecisionInput` (in [schema.ts](../src/features/access-requests/schema.ts)) checks that `id` is a non-empty string and `action` is exactly `"approve"` or `"reject"`, returning a structured `ValidationResult` rather than throwing.
2. Simulated latency and a simulated-failure flag run next, so the UI's pending/error states are exercised the same way they would be against a real backend.
3. The request is looked up, its current status is checked (only `pending` requests can be decided), and a new record is returned — the mock dataset itself is never mutated.

This same validation function backs the "runtime decision-input validation" unit tests, independent of the UI.

## Session-local state and mock data

- [mock-data.ts](../src/features/access-requests/mock-data.ts) holds a module-level, read-only array of seeded requests plus `fetchAccessRequests` / `fetchAccessRequestById` (simulated latency + failure) and a synchronous `findMockAccessRequest` for server-side callers. Read helpers always return deep-ish safe copies (`cloneAccessRequest`) so callers can't mutate the shared dataset.
- `RequestsDashboard` copies the server-provided list into local `useState` on mount (`localRequests`) and applies decisions to that copy via `handleDecision`. The original `requests` prop is never mutated.
- **This means all state is session-local to the browser tab.** There is no persistence layer: reloading the page re-runs the Server Component, which re-reads the original seeded mock data, discarding any decisions made in the previous session. This is a deliberate limitation for a UI/interaction proof piece, not an oversight.

## Testing strategy

- **Vitest** (jsdom environment) + **React Testing Library** + **@testing-library/user-event**, configured in [vitest.config.ts](../vitest.config.ts) and [vitest.setup.ts](../vitest.setup.ts).
- Tests query by accessible role/label/name and assert on visible output, not internal state or markup structure.
- `RequestsDashboard.test.tsx` covers the primary user-facing workflows: search/status/environment filtering, the filtered-empty state and filter reset, opening the detail panel, focus moving into the panel on open and back to the trigger on close (via Escape), approving a pending request, rejecting a pending request, and a failed decision surfacing visible error feedback.
- The Server Function boundary (`submitDecision`) is mocked with `vi.mock`/`vi.mocked` only in these tests, so decision outcomes are deterministic instead of depending on the mock module's simulated latency/controlled simulated failure.
- `schema.test.ts` unit-tests `validateDecisionInput` directly (valid input, empty/non-string/missing id, invalid/missing action), since that function is the actual runtime input-validation boundary and benefits from being exercised in isolation. It validates shape and allowed values only — it is not an authentication or authorization check.
- The suite deliberately does not chase coverage percentages, snapshot-test markup, or assert on CSS class names/implementation details.

## Accessibility approach

- Semantic structure: `<main>`, an `<aside>` landmark for the detail panel (`aria-labelledby` pointing at its heading), labeled `<section>`s for summary/table/empty states.
- The request table has a `<caption>`, `<th scope="col">` headers, and an equivalent `<article>`-based card presentation for narrow viewports — both render the same data, with CSS controlling which one is displayed, so screen-reader and mobile users get equivalent information.
- Deliberate focus management in `RequestsDashboard`/`RequestDetailPanel`: opening the panel focuses its close button; explicitly closing it (close button click or Escape) restores focus to the row button that opened it, with a fallback to the page heading if that button no longer exists (e.g. its row was filtered out while the panel was open).
- Decision feedback uses `role="status"` (success) and `role="alert"` (error) so outcomes are announced to assistive tech without extra plumbing.
- Interactive controls have explicit accessible names via `aria-label` or associated `<label>` elements.

## CI validation

[.github/workflows/ci.yml](../.github/workflows/ci.yml) runs on pull requests targeting `main`, pushes to `main`, and manual dispatch. A single job installs dependencies with `pnpm install --frozen-lockfile`, then runs `pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build` as separate steps, with a 15-minute timeout and concurrency cancellation for superseded runs. This validates that the workflow itself passes — it does not imply branch protection or required status checks are enabled on the repository.

## Feature structure

```text
src/
  app/
    layout.tsx
    page.tsx
    loading.tsx
    error.tsx
    globals.css

  features/
    access-requests/
      actions.ts       # Server Function decision boundary
      types.ts         # Domain types and string-literal unions
      mock-data.ts      # Seeded records + simulated fetch/latency/failure
      schema.ts         # Runtime validation for mock data and decision input
      components/       # Dashboard, toolbar, table, detail panel, status badge

  components/
    ui/                 # Small, non-feature-specific primitives (ThemeToggle)

  lib/
    theme.ts            # Theme storage key/event constants shared by layout + ThemeToggle
```

## Styling approach

- CSS Modules for component-scoped styling.
- `globals.css` holds only true globals: CSS reset, light/dark theme tokens (`:root` / `html[data-theme]`), and app-level body defaults.
- Restrained, internal-tool visual language: neutral palette, clear density in the table, explicit status affordances via `StatusBadge`.

## Current limitations and future extension points

Known limitations, by design:

- No persistence — decisions don't survive a page reload.
- No authentication, authorization, or multi-user concept.
- No pagination; a small seeded dataset is used by design.
- Audit trail is limited to the single most recent decision (`DecisionMetadata`), not a full history.

Reasonable future extensions, if this project grows beyond its current scope:

- A real or lightweight persisted backend (would replace `mock-data.ts`/`actions.ts` without needing to change the component layer, since components already only see `AccessRequest[]` and `SubmitDecisionResult`)
- Pagination or status-based tabs for larger datasets
- A fuller decision/audit history per request
- Expanded keyboard-navigation coverage (e.g. table row arrow-key navigation)

These are not planned work — they're noted here so the current scope reads as a deliberate stopping point rather than an unfinished one.
