# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by pnpm (`pnpm-workspace.yaml`), with provider and core libraries under `packages/aws`, `packages/cloudflare`, `packages/core`, and `packages/terraform` (source in `src`, builds in `dist` when present).
- `formation/` hosts the TypeScript infrastructure engine: author code in `formation/src`, keep tests in `formation/test`, and treat `formation/dist` as generated output.
- Shared configuration lives at the repo root (`tsconfig.json`, `package.json`, `pnpm-lock.yaml`); avoid committing changes to `node_modules` or built artifacts.

## Build, Test, and Development Commands
- `pnpm install` — installs workspace dependencies.
- `pnpm build` — builds the core and terraform packages (`packages/*/dist` via tsup).
- `pnpm test` — runs package-level test suites (Vitest) for core and terraform.
- `pnpm -C formation build` — builds the formation package to `formation/dist`.
- `pnpm -C formation exec vitest` — runs the formation test suite in `formation/test`; use `--runInBand` for determinism when needed.

## Coding Style & Naming Conventions
- Language: TypeScript with ESM; keep explicit `.ts` extensions in imports and prefer `strict`-friendly code (see `tsconfig.json`).
- Indentation: tabs (match existing files); max clarity over cleverness.
- Naming: PascalCase for classes (e.g., `App`, `Stack`), camelCase for functions/variables, kebab-case for filenames.
- Formatting/Linting: follow Prettier + ESLint defaults (`pnpm exec prettier --check .`, `pnpm exec eslint . --ext .ts`); organize imports before committing.

## Testing Guidelines
- Framework: Vitest with BDD style (`describe`/`it`). Test fixtures live alongside helpers (see `formation/test/_mock.ts`).
- Add focused unit tests for new behaviors; prefer deterministic assertions over snapshot churn.
- Name new specs with `*.test.ts` and group by feature (e.g., `formation/test/deploy.test.ts`).
- Run relevant suites (`pnpm test` or `pnpm -C formation exec vitest`) before submitting; ensure tests pass without relying on external cloud resources.

## Commit & Pull Request Guidelines
- Commits: use concise, imperative messages; Conventional Commit prefixes (`feat:`, `fix:`, `chore:`) are preferred even though history is light.
- Pull Requests: include a short summary of changes, linked issues, and the commands/tests executed. Update docs or examples when APIs change. If behavior is user-visible, note it and attach logs or screenshots where helpful.

## Security & Configuration Tips
- Never commit credentials, Terraform state, or lock files; use environment variables or local config files ignored by Git.
- Keep generated artifacts (`dist/`) out of reviews unless they are the intended deliverable. Remove stray `.DS_Store` files before opening a PR.
