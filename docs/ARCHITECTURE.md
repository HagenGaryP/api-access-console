# API Access Request Console — Architecture v1

## Overview

API Access Request Console is a single-page internal review tool for viewing, filtering, inspecting, and deciding on API access requests.

This project is intentionally scoped as a polished front-end proof piece rather than a production platform. The goal is to demonstrate strong judgment in UI architecture, React/Next.js patterns, TypeScript modeling, and engineering workflow without overbuilding.

## Goals

- Present a clean, credible internal-tool UI
- Show a realistic reviewer workflow:
  - scan requests
  - search/filter/sort
  - inspect request details
  - approve or reject a request
- Keep the code interview-defensible:
  - coherent structure
  - modern App Router patterns
  - clear server/client boundaries
  - minimal unnecessary abstraction
- Use mocked data and simulated latency to make the UI feel realistic

## Non-Goals

These are explicitly out of scope for v1:

- authentication / authorization
- real database or persistence
- audit history
- notifications
- multi-page workflows
- full back-end system design
- role management
- production-grade security and deployment concerns

## Technical Approach

### Framework + Stack
- Next.js App Router
- React 19
- TypeScript
- ESLint
- CSS Modules
- small global stylesheet for true globals only

### Rendering Model
The dashboard route will be server-rendered by default.

- `src/app/page.tsx` acts as the route entry
- initial request data is loaded on the server from the mock data layer
- interactive controls live in client components
- approve/reject interactions can use a server action with simulated latency, while the UI maintains local optimistic state if it remains simple and readable

This keeps the project aligned with modern Next.js usage:
- no unnecessary client-side bootstrapping
- no `useEffect`-driven initial fetch for core page data
- server components by default, client components only where interactivity is required

## Data Flow

### Read Path
1. `page.tsx` requests access-request data from the feature mock layer
2. mock layer simulates network delay
3. validated data is passed into the client-side dashboard surface
4. client components handle:
   - search
   - filter
   - sort
   - row selection
   - detail panel open/close

### Write Path
1. reviewer clicks Approve or Reject from the detail panel
2. action handler validates the requested transition
3. UI shows pending state
4. optimistic UI may update the selected request status immediately if it does not add complexity
5. action resolves with success or failure
6. UI confirms success or rolls back and surfaces error feedback

Because there is no database, persistence is intentionally temporary. This is acceptable for the project because the point is interaction design, state handling, and component architecture rather than permanent storage.

## Feature Structure

The project uses a feature-oriented structure centered on the `access-requests` domain.

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
      components/
      actions.ts
      types.ts
      mock-data.ts
      schema.ts

  components/
    ui/

  lib/
    utils.ts
```

### Responsibilities

#### `src/app`
Route-level composition, layout, and route states.

#### `src/features/access-requests/types.ts`
Domain types and UI-safe TypeScript models for access requests, statuses, and filters.

#### `src/features/access-requests/schema.ts`
Schema validation for mocked request data and action inputs. This keeps the domain model explicit and interview-friendly.

#### `src/features/access-requests/mock-data.ts`
Mocked request records plus async helpers that simulate latency and controlled failures.

#### `src/features/access-requests/actions.ts`
Approve/reject request actions. These should remain thin and readable.

#### `src/features/access-requests/components/`
Feature UI components such as:
- dashboard shell
- filter toolbar
- requests table
- detail drawer/panel
- status badge
- action controls

#### `src/components/ui/`
Small reusable primitives only when reuse is real, not speculative.

## State Strategy

State should stay close to where it is used.

### Server State
- initial request list loaded on the server

### Client UI State
- search term
- selected filters
- sort state
- selected row / open request detail
- mutation pending / success / error feedback

Avoid introducing a global state library for this scope.

## UX States

The app should explicitly support:

- route loading state
- route error state
- table empty state
- detail selection state
- approve/reject pending state
- mutation success feedback
- mutation failure with rollback or recovery path

These states are part of the proof piece, not secondary polish.

## Styling Approach

- CSS Modules for component-scoped styling
- `globals.css` only for:
  - CSS reset/base
  - typography tokens
  - color variables
  - app-level layout primitives if truly global

The UI should read as a modern B2B internal tool:
- restrained color palette
- strong spacing hierarchy
- clear density in tables
- obvious status affordances
- minimal ornamentation

## Engineering Workflow

Work in small vertical slices:
1. data model + mock layer
2. dashboard table
3. filter/sort interactions
4. detail panel
5. approve/reject flow
6. UX state polish

For each slice:
- one scoped GitHub issue
- one scoped branch
- clean commits
- PR before merge
- run lint, typecheck, and build after major changes

## Future Extensions (Post-v1, Not Now)

Possible later additions:
- pagination
- tabs by status
- reviewer notes
- audit timeline
- persisted mock API or lightweight backend
- keyboard accessibility upgrades
- test suite expansion

These should only be considered after the MVP proof piece is stable and polished.
