# Repository Guidelines

## Project Structure & Module Organization
Next.js 15 App Router drives UI inside `app/`, with authentication under `app/(auth)/` and server actions in `app/actions/`. Feature slices live in `features/` (e.g., `compositor`, `timeline`, `export`), sharing UI primitives from `components/` and state stores from `stores/`. Reusable integrations stay in `lib/`, Supabase DDL and setup in `supabase/`, and workers or static assets in `public/`. Update supporting docs in `docs/` and `specs/` whenever behavior changes.

## Build, Test, and Development Commands
- `npm run dev` – Start the Next.js dev server with Supabase SSR hooks.
- `npm run build` / `npm run start` – Produce and serve the production bundle.
- `npm run lint` – Apply ESLint rules defined in `eslint.config.mjs`.
- `npm run format[:check]` – Run Prettier across TS/JS/MD content.
- `npm run type-check` – Execute `tsc --noEmit` to verify types.
- `npm run test` – Run Vitest suites under `tests/`.
- `npm run test:e2e` – Execute Playwright specs in `tests/e2e`.
- `npm run setup:ffmpeg` – Fetch FFmpeg.wasm assets for local export.

## Coding Style & Naming Conventions
TypeScript is the default; keep ambient types in `types/`. Prettier enforces two-space indentation, trailing commas, and single quotes—format before committing. Name components and stores in PascalCase, hooks in camelCase prefixed with `use`, and utilities in lower camelCase. Import within the monorepo using the `@/` alias and prefer feature-level barrels for public APIs.

## Testing Guidelines
Place unit and integration specs in `tests/unit` or `tests/integration` using `*.test.ts(x)` names, and isolate external services with the helpers in `lib/`. Playwright lives in `tests/e2e`; record new snapshots when UI behavior changes and run `npm run test:e2e -- --ui` to debug. Every PR should run `npm run test` locally and call out manual checks when touching compositor, export, or Supabase flows.

## Commit & Pull Request Guidelines
Follow the observed `type(scope): summary` format (e.g., `fix(video): guard blob fallback`). Combine closely related scopes on separate lines when necessary. PRs must link to the relevant item in `DEVELOPMENT_STATUS.md` or `specs/001-proedit-mvp-browser/tasks.md`, list verification commands, and attach screenshots or screen captures for UI updates.

## Environment & Configuration Notes
Duplicate `VERCEL_ENV_SETUP.md` values into `.env.local`, then apply Supabase credentials per `supabase/SETUP_INSTRUCTIONS.md`. After installing dependencies, run `npm run setup:ffmpeg` to keep `public/workers` exporters usable offline. Schema changes belong in `supabase/migrations/` and should include rollback notes in the PR.
