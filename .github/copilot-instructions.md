# API Access Console — Copilot Instructions

## Project purpose
Build a polished internal tool for reviewing API access requests.

## Core stack
- Next.js App Router
- React 19
- TypeScript
- ESLint
- CSS Modules
- `src/app/globals.css` for true global styles only

## Constraints
- Do not add Tailwind
- Do not add Docker
- Do not add auth, persistence, or new dependencies opportunistically
- Auth, persistence, and new dependencies are permitted only when explicitly required by an approved GitHub Issue/task, the documented Milestone 3 architecture/product direction (see `docs/ARCHITECTURE.md` and `docs/PRODUCT_BLUEPRINT.md`), or explicit human instruction — and any such work must stay within that issue/task's scope
- Do not treat planned Milestone 3 functionality as already implemented; keep current-main, feature-branch, and planned behavior clearly distinguished
- Do not turn this into a full-stack production system
- If replacing a missing dependency would require more than ~10 lines of non-trivial inline code, stop and ask the developer before proceeding
- Do not implement more than the requested issue or scope

## Architecture guidance
- Default to Server Components
- Use Client Components only when interactivity requires them
- Do not use `useEffect` for initial page data loading when a Server Component can handle it
- Keep server/client boundaries strict
- Keep logic close to where it is used
- Prefer feature-local code over global abstractions
- Avoid speculative abstractions and unnecessary indirection

## TypeScript guidance
- Prefer explicit, readable types
- Prefer `as const` objects and string literal unions over TypeScript `enum`
- Avoid `any`
- Avoid unsafe or blind casting
- Narrow `unknown` safely before use
- Do not weaken types just to silence errors
- Validate unknown inputs before reading fields from them

## React / Next.js guidance
- Use modern React and current Next.js App Router patterns
- Keep components small and purposeful
- Avoid unnecessary hooks, memoization, and state
- Keep loading, empty, error, and success states explicit where relevant

## Styling guidance
- Use CSS Modules for component-scoped styles
- Use `globals.css` only for reset/base styles, CSS variables, typography, and app-level defaults
- Do not put feature-specific styling in global CSS
- Aim for a restrained, professional internal-tool UI

## Data and validation guidance
- Prefer small, readable validators over heavy validation systems unless explicitly requested
- Keep mocked data to 5–10 records maximum, using flat structures unless nesting is required by the feature
- Return safe copies from mock read helpers when exposing module-level records

## Comments and documentation
- Do not over-comment obvious code
- Add short JSDoc comments for exported functions when they clarify behavior or intent
- Comment business rules and non-obvious decisions
- Prefer explaining why over narrating what

## Workflow guidance
- First state which files you plan to modify
- If the developer objects to the file plan, revise the plan before writing any code. Do not begin implementation until the plan is accepted or the developer explicitly says to proceed
- Change only the files listed in your upfront plan. If an unlisted file must change, state why before editing it
- Do not modify unrelated files
- Stop when the requested slice is complete
- Before declaring work complete, assume the developer should run:
  - `pnpm lint`
  - `pnpm exec tsc --noEmit`
  - `pnpm build`

## When unsure
- Prefer, in this order:
  1. the most type-safe implementation
  2. the most readable implementation
  3. the simplest implementation
  4. the implementation with the fewest moving parts
- If two options tie on all four, choose the one requiring fewer new files
