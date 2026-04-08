# Build Progress

## Phase 0: Project Infrastructure

- [x] Git init + GitHub repo
- [x] Monorepo tooling (pnpm, turborepo)
- [x] Conventional commits (husky, commitlint, lint-staged)
- [x] CLAUDE.md + README

## Phase 1: Shared Types + API Skeleton

- [x] TypeScript type definitions (packages/shared)
- [x] SQLAlchemy models (5 tables)
- [x] Pydantic schemas
- [x] FastAPI app skeleton with stub routers
- [x] Database setup (SQLite)

## Phase 2: Mock AI Provider + Repo Scanner

- [x] AIProvider ABC (5 methods)
- [x] MockProvider implementation
- [x] GrokProvider stub
- [x] RepoScanner service
- [x] SymbolIndexer service
- [x] Tests for repo scanner

## Phase 3: API Routes

- [x] Repository endpoints (POST/GET)
- [x] Session CRUD
- [x] Plan generation endpoint
- [x] Patch proposal + accept/reject endpoints
- [x] Validation runner endpoint
- [x] Integration tests

## Phase 4: Frontend Shell

- [x] Next.js app with Tailwind + shadcn/ui
- [x] App layout (sidebar + main content)
- [x] Typed API client
- [x] Landing page

## Phase 5: Core UI Components

- [x] Repo onboarding form
- [x] File tree viewer
- [x] Task composer
- [x] Plan viewer
- [x] Session sidebar
- [x] Repo dashboard page
- [x] Session workspace page

## Phase 6: Diff Viewer + Review

- [x] Diff viewer with per-file tabs
- [x] Rationale panel
- [x] Validation panel
- [x] Accept/reject/regenerate flow

## Phase 7: Documentation

- [x] PRD (docs/PRD.md)
- [x] Product proposals (docs/PROPOSALS.md)
- [x] Architecture doc (docs/ARCHITECTURE.md)
- [x] Interview demo script (docs/INTERVIEW_DEMO.md)
- [x] Polish README

## Phase 8: CI + Polish

- [x] GitHub Actions CI workflow
- [x] PR template
- [x] Final polish
