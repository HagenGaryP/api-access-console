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
- Do not add auth
- Do not add a database
- Do not turn this into a full-stack production system
- Do not add dependencies unless explicitly requested
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
- Keep mocked data realistic, compact, and easy to understand
- Return safe copies from mock read helpers when exposing module-level records

## Comments and documentation
- Do not over-comment obvious code
- Add short JSDoc comments for exported functions when they clarify behavior or intent
- Comment business rules and non-obvious decisions
- Prefer explaining why over narrating what

## Workflow guidance
- First state which files you plan to modify
- Make the smallest reasonable set of changes
- Do not modify unrelated files
- Stop when the requested slice is complete
- Before declaring work complete, assume the developer should run:
  - `pnpm lint`
  - `pnpm exec tsc --noEmit`
  - `pnpm build`

## When unsure
- Choose the simpler implementation
- Choose the more readable implementation
- Choose the more type-safe implementation
- Choose the implementation with the fewest moving parts
