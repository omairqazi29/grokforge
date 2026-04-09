# Build Progress

## Phase 0: Project Infrastructure

- [x] Git init + GitHub repo
- [x] Monorepo tooling (pnpm, turborepo)
- [x] Conventional commits (husky, commitlint, lint-staged)
- [x] Project docs + README

## Phase 1: Shared Types + API Skeleton

- [x] TypeScript type definitions (packages/shared)
- [x] SQLAlchemy models (6 tables: repositories, sessions, file_artifacts, patch_artifacts, validation_runs, token_usage)
- [x] Pydantic schemas
- [x] FastAPI app skeleton with stub routers
- [x] Database setup (SQLite)

## Phase 2: Mock AI Provider + Repo Scanner

- [x] AIProvider ABC (5 methods)
- [x] MockProvider implementation
- [x] GrokProvider (full xAI API integration with structured outputs)
- [x] GrokAPIClient (HTTP transport, auth, response parsing, cost calculation)
- [x] JSON schema definitions (schemas.py)
- [x] TokenTracker (usage + cost recording to DB)
- [x] RepoScanner service
- [x] SymbolIndexer service
- [x] DependencyScanner service
- [x] Tests for repo scanner

## Phase 3: API Routes

- [x] Repository endpoints (POST/GET/DELETE)
- [x] Session CRUD
- [x] Plan generation endpoint
- [x] Patch proposal + accept/reject endpoints (accept writes to disk, reject reverts)
- [x] Patch feedback + regeneration (PatchGenerate with feedback field)
- [x] Validation runner endpoint (non-streaming)
- [x] SSE streaming validation endpoint (/validate-stream)
- [x] Git branch management (list/create/checkout/current/commits)
- [x] GitHub PR export (branch creation, commit, push, PR via gh CLI)
- [x] GitHub user/repos/issues/clone endpoints
- [x] Chat endpoint (Grok with repo/session context)
- [x] Token usage listing + summary endpoints
- [x] Health check endpoint
- [x] Integration tests

## Phase 4: Frontend Shell

- [x] Next.js app with Tailwind + shadcn/ui
- [x] App layout with persistent AppSidebar
- [x] Typed API client (lib/api-client.ts)
- [x] TypeScript API types (lib/api-types.ts)
- [x] Frontend constants (lib/constants.ts)
- [x] Diff utilities (lib/diff-utils.ts)
- [x] Landing page (auto-redirect to first repo)

## Phase 5: Core UI Components

- [x] AppSidebar with repos, branches, sessions, navigation
- [x] AddRepoDialog (sidebar/add-repo-dialog.tsx)
- [x] CreateBranchDialog (sidebar/create-branch-dialog.tsx)
- [x] NewSessionDialog
- [x] File tree viewer + file tree panel
- [x] Task composer
- [x] Plan viewer
- [x] Session sidebar
- [x] Commits list
- [x] Grok chat panel
- [x] Thinking indicator (AI loading animation)
- [x] Error alert component

## Phase 6: Diff Viewer + Review + Validation

- [x] Diff viewer with per-file tabs and color-coded diffs
- [x] Rationale panel
- [x] Code block (shared code rendering component)
- [x] Validation panel with SSE streaming support
- [x] Terminal emulator (terminal-style output display)
- [x] Accept/reject/regenerate flow (with feedback)

## Phase 7: Pages

- [x] Repo dashboard (repos/[id])
- [x] Session workspace (sessions/[id])
- [x] Dashboard overview (dashboard/)
- [x] Settings page (settings/)
- [x] GitHub integration page (github/)

## Phase 8: Custom Hooks

- [x] useSessionWorkflow — full session state machine (plan/patch/validate/accept)
- [x] useAsync — generic async operation hook
- [x] useSidebarData — sidebar repos + sessions data fetching
- [x] useStepProgression — step-by-step workflow progression

## Phase 9: Documentation + CI

- [x] PRD (docs/PRD.md)
- [x] Product proposals (docs/PROPOSALS.md)
- [x] Architecture doc (docs/ARCHITECTURE.md)
- [x] Architecture decisions (docs/DECISIONS.md)
- [x] GitHub Actions CI workflow
- [x] PR template
- [x] README polish

## Phase 10: shadcn/ui Components

- [x] badge
- [x] button
- [x] card
- [x] dialog
- [x] input
- [x] scroll-area
- [x] separator
- [x] skeleton
- [x] tabs
- [x] textarea
