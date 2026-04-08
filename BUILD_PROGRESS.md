# Build Progress

## Phase 0: Project Infrastructure

- [ ] Git init + GitHub repo
- [ ] Monorepo tooling (pnpm, turborepo)
- [ ] Conventional commits (husky, commitlint, lint-staged)
- [ ] CLAUDE.md + README

## Phase 1: Shared Types + API Skeleton

- [ ] TypeScript type definitions (packages/shared)
- [ ] SQLAlchemy models (5 tables)
- [ ] Pydantic schemas
- [ ] FastAPI app skeleton with stub routers
- [ ] Database setup (SQLite)

## Phase 2: Mock AI Provider + Repo Scanner

- [ ] AIProvider ABC (5 methods)
- [ ] MockProvider implementation
- [ ] GrokProvider stub
- [ ] RepoScanner service
- [ ] SymbolIndexer service
- [ ] Tests for repo scanner

## Phase 3: API Routes

- [ ] Repository endpoints (POST/GET)
- [ ] Session CRUD
- [ ] Plan generation endpoint
- [ ] Patch proposal + accept/reject endpoints
- [ ] Validation runner endpoint
- [ ] Integration tests

## Phase 4: Frontend Shell

- [ ] Next.js app with Tailwind + shadcn/ui
- [ ] App layout (sidebar + main content)
- [ ] Typed API client
- [ ] Landing page

## Phase 5: Core UI Components

- [ ] Repo onboarding form
- [ ] File tree viewer
- [ ] Task composer
- [ ] Plan viewer
- [ ] Session sidebar
- [ ] Repo dashboard page
- [ ] Session workspace page

## Phase 6: Diff Viewer + Review

- [ ] Monaco diff editor
- [ ] Rationale panel
- [ ] Validation panel
- [ ] Accept/reject/regenerate flow

## Phase 7: Documentation

- [ ] PRD (docs/PRD.md)
- [ ] Product proposals (docs/PROPOSALS.md)
- [ ] Architecture doc (docs/ARCHITECTURE.md)
- [ ] Interview demo script (docs/INTERVIEW_DEMO.md)
- [ ] Polish README

## Phase 8: CI + Polish

- [ ] GitHub Actions CI workflow
- [ ] PR template
- [ ] Final polish
