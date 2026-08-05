# API Access Console — Architecture

> **Scope note:** Everything from here through "Current limitations and future extension points" documents the **implemented** architecture as of PR #29 (Milestone 1–2) — nothing in that range is aspirational. The **[Milestone 3 target architecture](#milestone-3-target-architecture)** section at the end of this document describes the *planned* stack and domain model from Issue #30; none of it is implemented yet. For product/UX/domain scope behind that target architecture, see [PRODUCT_BLUEPRINT.md](PRODUCT_BLUEPRINT.md).

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

The Milestone 3 target architecture below replaces persistence, authorization, and audit history for this project; see that section for the planned direction rather than an informal extensions list. Reasonable extensions that fall outside even that target remain open (e.g. expanded keyboard-navigation coverage such as table row arrow-key navigation), but are not planned work.

---

## Milestone 3 target architecture

> **Not implemented.** This section documents the target stack and domain model from Issue #30. No code, dependencies, migrations, or runtime behavior described here exists yet. Product/UX/domain rationale lives in [PRODUCT_BLUEPRINT.md](PRODUCT_BLUEPRINT.md); this section stays implementation-focused and cross-links there instead of repeating it.

### Locked stack (target)

- Next.js 16, React 19, TypeScript — a single deployable TypeScript modular monolith (see "Modular monolith boundaries" below; no separately deployed runtime services)
- **Auth.js** for session management (demo-identity personas only — see the blueprint's "Demo-identity entry experience")
- **Neon Serverless Postgres** as the persistence backend
- **Drizzle ORM** for schema and queries (schema design itself is out of scope for Issue #30 — no table/column definitions here; it's covered under the persistence-foundation step in the dependency order)
- **Zod** for runtime validation at server boundaries, extending the existing untrusted-input validation pattern already used by `validateDecisionInput`
- **Vercel** for deployment
- No FastAPI, no required Python runtime — all server logic stays in TypeScript

### Modular monolith boundaries (target)

The application remains a single deployable Next.js app — no separately deployed runtime services (no extracted microservice, no standalone API server). Internally, code is organized into purpose-specific modules under `src/features/` rather than one undifferentiated layer:

- **Service modules** — request/grant/credential business logic
- **Repository modules** — Drizzle-backed data access, one per entity family
- **Policy modules** — `PolicyDefinition` evaluation logic
- **Audit modules** — `AuditEvent` recording, never bypassed by other modules
- **Provider modules** — swappable boundaries around external capabilities, notably `AiReviewProvider` (the reserved AI integration point) and `ProvisioningProvider` (the credential-provisioning integration point), so their eventual real implementations stay isolated from policy and decision logic

This keeps the codebase organized without introducing a distributed system.

### Server-only authorization and mutations

- All authorization checks and mutations (decisions, provisioning, rotation, suspension, revocation) run in server-only code (Server Functions/Route Handlers), never trusting client-supplied role or identity claims — consistent with how `submitDecision` already treats its inputs as untrusted today.
- **Self-approval prevention** is enforced server-side: a decision is rejected if the deciding identity matches the request's requester identity, regardless of the decider's role. This check happens before any policy or AI advisory content is even considered.
- **Ownership enforcement** is likewise server-side and independent of role: any authenticated user may only view or resubmit records (requests, grants, credentials) where they are the owner, regardless of any client-supplied identity claim. Reviewer-tier authority (policy findings, deciding, requesting more information) is checked server-side and applies only when the acting user is not the record's owner — an owner never receives policy-finding visibility on their own request, no matter what role they hold.

### Deterministic policy evaluation, AI advice, and human decision

Three distinct responsibilities, never merged into one record or one code path:

1. **Deterministic policy evaluation** — plain TypeScript rules (`PolicyDefinition`s) evaluated against a request on every submission and resubmission (a `PolicyEvaluation` run), producing immutable `PolicyFinding`-shaped output. Fully explainable, no model inference. A failed or timed-out evaluation keeps the request in `Submitted` with the evaluation marked failed — see the blueprint's edge-state table; no separate request lifecycle state is introduced for this.
2. **AI advisory (reserved, not implemented)** — a future, server-only, structured AI integration that may attach advisory notes to a request. Conceptually owned by an `AiReviewSnapshot` entity (see the blueprint's entity map) so introducing it later doesn't reshape existing entities. Never a decision-maker. Implementation is deferred to Milestone 4; no UI surface exists for it in Milestone 3.
3. **Human decision** — recorded as a `ReviewerDecision`, the only entity authorized to approve, reject, or request more information. Always attributable to a specific identity; never inferred from policy findings or AI advice. A request accumulates multiple `ReviewerDecision` records across a `NeedsInformation` cycle.

### Entity shape sketch (conceptual, not schema)

Mirrors [PRODUCT_BLUEPRINT.md](PRODUCT_BLUEPRINT.md#core-entity-and-relationship-map) — restated here only to note persistence-relevant boundaries, not to define columns or Drizzle schemas:

- `AccessRequest`, `AccessGrant`, and `ApiCredential` remain separate persisted entities/tables, linked by reference (request → grant → credential), never collapsed into one row with status flags. The same holds for the supporting entities in the blueprint's entity map (`User`, `Team`, `Role`, `ApiProduct`, `ApiScope`, `AccessRequestScope`, `PolicyDefinition`, `PolicyEvaluation`, `ReviewerDecision`) — not redefined here to avoid drifting out of sync with the blueprint.
- `AccessGrant` is persisted from the moment it's created in `Provisioning` — no code path creates a grant already `Active`.
- `ApiCredential` rotation never updates a row in place: a new `ApiCredential` record is created referencing the old one via `replaces`, and the old record's status moves to `Replaced`. This is a modeling constraint carried into future schema design, not a schema definition itself.
- `AuditEvent` is append-only: no update or delete path is exposed anywhere in the design, by any role, including Administrator. Every `PolicyEvaluation` run and every `ReviewerDecision` is recorded as its own `AuditEvent`, alongside lifecycle transitions. A grant revocation and each nonterminal credential revocation it cascades to (covering both `Active` and `Suspended` credentials, never `Expired`/`Revoked`/`Replaced`) are recorded as separate `AuditEvent` entries.
- `PolicyFinding` records are produced by a `PolicyEvaluation` run and are immutable once produced; re-evaluation (including after a `NeedsInformation` resubmission) produces new findings rather than mutating prior ones.

### Provisioning, expiration, rotation, suspension, and revocation

- Approval creates a grant directly in `Provisioning`; provisioning a credential against that grant is the next, distinct server-only step, and no usable access exists until it succeeds. A failed attempt moves the grant to `ProvisioningFailed`, which exposes an explicit retry action rather than a silent dead end.
- A grant may also be revoked directly from `Provisioning` or `ProvisioningFailed` (explicit cancellation) — revocation is not limited to an already-`Active` grant.
- Expiration (grant or credential) is time-based and surfaced, not silently swept — see the blueprint's edge-state table.
- Rotation never mutates a credential in place: it creates a new `ApiCredential` record referencing the old one via `replaces`, and the old record moves to `Replaced` — an auditable replacement lineage rather than an assumption that a rotated credential keeps the same identity.
- Suspension is reversible (grant/credential returns to active); revocation is terminal. Revoking a grant cascades to revoke every nonterminal (`Active` or `Suspended`) credential under it; credentials already `Expired`, `Revoked`, or `Replaced` are left unchanged. The grant's revocation and each cascaded credential revocation are recorded as separate, immutable `AuditEvent` entries.

### Credential security boundaries (target)

- Credential secrets are generated using a cryptographically secure random source — never derived from predictable or user-supplied input.
- Plaintext is returned exactly once, in the creation/rotation response payload only. It is never persisted, logged, or included in an `AuditEvent`.
- Persisted verification material is a one-way hash sufficient to verify a presented credential without reconstructing the plaintext, plus a separate non-secret fingerprint (e.g. a short prefix) for display and audit purposes.
- Every credential-authenticated request enforces, in order: matching API/product, matching environment, matching granted scope(s), non-expired, lifecycle status `Active` (`Suspended`, `Expired`, `Revoked`, and `Replaced` are all rejected), and that the credential's parent `AccessGrant` is also `Active` — a credential under a `Suspended`, `Expired`, or `Revoked` grant is rejected even if the credential record itself is still `Active`.
- Sandbox requests are enforced through the same path production traffic would use, with no separate, weaker sandbox check; each attempt, success or failure, is recorded as its own `AuditEvent`.

### Transactional invariants (target)

- Reviewer decisions are recorded using optimistic concurrency protection (an expected-version check against the request's current state): a decision submitted against a stale request state is rejected, not silently applied — the mechanism behind the "two reviewers decide concurrently" edge case in the blueprint.
- Approving a request, creating the resulting `AccessGrant` (in `Provisioning`), and recording the corresponding `AuditEvent` happen as a single atomic transaction — never partially applied.
- Retrying a `ProvisioningFailed` grant is idempotent: repeated or duplicate retry attempts never produce more than one live `ApiCredential` for that attempt.
- An `AccessRequest` produces at most one `AccessGrant`; a grant has at most one nonterminal `ApiCredential` (`Active` or `Suspended`) at a time. Duplicate grants and credentials are structurally prevented, not just avoided by convention.
- Every lifecycle transition (request, grant, credential) is validated against its allowed-transition set server-side before being applied, regardless of what the client UI displayed.

### Sequencing

See [PRODUCT_BLUEPRINT.md](PRODUCT_BLUEPRINT.md#milestone-3-dependency-order) for the full dependency order across product and architecture work — not duplicated here to avoid the two documents drifting out of sync.
