# GrokForge - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                       Browser                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │           Next.js Frontend (apps/web)              │  │
│  │                                                    │  │
│  │  AppSidebar (persistent) + Main Content Area       │  │
│  │  [Repos] [Sessions] [Plan] [Diff] [Terminal] [Chat]│  │
│  └────────────────────┬───────────────────────────────┘  │
└───────────────────────┼──────────────────────────────────┘
                        │ HTTP/JSON + SSE
                        ▼
┌─────────────────────────────────────────────────────────┐
│               FastAPI Backend (apps/api)                 │
│                                                         │
│  ┌─────────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │  Routers    │  │ Services  │  │   AI Layer       │  │
│  │             │  │           │  │                  │  │
│  │ /repos      │  │ Scanner   │  │ GrokProvider     │  │
│  │ /sessions   │  │ Indexer   │  │ MockProvider     │  │
│  │ /plans      │  │ Validator │  │ GrokAPIClient    │  │
│  │ /patches    │  │ Deps      │  │ TokenTracker     │  │
│  │ /validate   │  │           │  │ Schemas          │  │
│  │ /branches   │  │           │  │ (swappable)      │  │
│  │ /github     │  │           │  │                  │  │
│  │ /chat       │  │           │  │                  │  │
│  │ /tokens     │  │           │  │                  │  │
│  └─────┬───────┘  └───────────┘  └──────────────────┘  │
│        │                                                │
│  ┌─────▼────────────────────────────────────────────┐   │
│  │            SQLAlchemy + SQLite                    │   │
│  │                                                  │   │
│  │  repositories | sessions | file_artifacts        │   │
│  │  patch_artifacts | validation_runs | token_usage  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Directory Structure

```
grokforge/
├── apps/
│   ├── api/                          # FastAPI backend
│   │   ├── app/
│   │   │   ├── ai/                   # AI provider abstraction
│   │   │   │   ├── __init__.py       # Provider factory (get_ai_provider)
│   │   │   │   ├── provider.py       # ABC with 5 methods + dataclasses
│   │   │   │   ├── mock_provider.py  # Returns structured mock data
│   │   │   │   ├── grok_provider.py  # Real xAI API integration
│   │   │   │   ├── grok_client.py    # HTTP transport, auth, response parsing
│   │   │   │   ├── schemas.py        # JSON schema definitions for structured outputs
│   │   │   │   └── token_tracker.py  # Token usage + cost tracking to DB
│   │   │   ├── models/               # SQLAlchemy ORM models
│   │   │   │   ├── repository.py
│   │   │   │   ├── session.py
│   │   │   │   ├── file_artifact.py
│   │   │   │   ├── patch_artifact.py # includes pr_branch, pr_url, pr_commit_sha
│   │   │   │   ├── validation_run.py
│   │   │   │   └── token_usage.py    # Token/cost tracking per operation
│   │   │   ├── schemas/              # Pydantic request/response schemas
│   │   │   │   ├── repository.py
│   │   │   │   ├── session.py
│   │   │   │   ├── plan.py
│   │   │   │   ├── patch.py          # includes PatchGenerate with feedback field
│   │   │   │   └── validation.py
│   │   │   ├── routers/              # FastAPI route handlers
│   │   │   │   ├── repositories.py   # Repo CRUD + scanning
│   │   │   │   ├── sessions.py       # Session CRUD
│   │   │   │   ├── plans.py          # Plan generation
│   │   │   │   ├── patches.py        # Patch generation + accept/reject (writes files)
│   │   │   │   ├── validation.py     # SSE streaming + non-streaming validation
│   │   │   │   ├── branches.py       # Git branch list/create/checkout/commits
│   │   │   │   ├── github.py         # PR export, GitHub user/repos/issues/clone
│   │   │   │   ├── chat.py           # Grok chat endpoint
│   │   │   │   └── tokens.py         # Token usage listing + summary
│   │   │   ├── services/
│   │   │   │   ├── repo_scanner.py         # File tree + symbol extraction
│   │   │   │   ├── dependency_scanner.py   # Import/dependency analysis
│   │   │   │   └── validation_runner.py    # Subprocess command execution
│   │   │   ├── config.py             # Environment-based settings
│   │   │   ├── database.py           # Async SQLAlchemy session
│   │   │   └── main.py               # App factory + CORS + lifespan
│   │   └── tests/
│   └── web/                          # Next.js frontend
│       ├── app/                      # App Router pages
│       │   ├── layout.tsx            # Root layout with AppSidebar
│       │   ├── page.tsx              # Landing/redirect to first repo
│       │   ├── repos/[id]/page.tsx   # Repo dashboard
│       │   ├── sessions/[id]/page.tsx # Session workspace
│       │   ├── dashboard/page.tsx    # Overview dashboard
│       │   ├── settings/page.tsx     # Settings page
│       │   ├── github/page.tsx       # GitHub integration page
│       │   └── globals.css           # Dark-first design system
│       ├── components/
│       │   ├── app-sidebar.tsx       # Persistent sidebar with repos + sessions
│       │   ├── sidebar/
│       │   │   ├── add-repo-dialog.tsx     # Add repository dialog
│       │   │   └── create-branch-dialog.tsx # Create git branch dialog
│       │   ├── new-session-dialog.tsx # Create new session dialog
│       │   ├── file-tree.tsx         # Recursive file tree viewer
│       │   ├── file-tree-panel.tsx   # File tree panel wrapper
│       │   ├── task-composer.tsx     # Task description input
│       │   ├── plan-viewer.tsx       # Plan display with steps/risks
│       │   ├── diff-viewer.tsx       # Per-file diff with rationale
│       │   ├── code-block.tsx        # Shared code rendering component
│       │   ├── validation-panel.tsx  # Validation runner + results
│       │   ├── terminal-emulator.tsx # Terminal-style output display
│       │   ├── grok-chat.tsx         # Chat with Grok panel
│       │   ├── thinking-indicator.tsx # AI thinking/loading animation
│       │   ├── commits-list.tsx      # Git commit history display
│       │   ├── session-sidebar.tsx   # Session list in sidebar
│       │   ├── error-alert.tsx       # Error display component
│       │   └── ui/                   # shadcn/ui primitives
│       │       ├── badge.tsx
│       │       ├── button.tsx
│       │       ├── card.tsx
│       │       ├── dialog.tsx
│       │       ├── input.tsx
│       │       ├── scroll-area.tsx
│       │       ├── separator.tsx
│       │       ├── skeleton.tsx
│       │       ├── tabs.tsx
│       │       └── textarea.tsx
│       ├── hooks/
│       │   ├── use-session-workflow.ts  # Session state machine (plan/patch/validate/accept)
│       │   ├── use-async.ts             # Generic async operation hook
│       │   ├── use-sidebar-data.ts      # Sidebar repos + sessions data
│       │   └── use-step-progression.ts  # Step-by-step workflow progression
│       └── lib/
│           ├── api-client.ts        # Typed API wrapper with all endpoints
│           ├── api-types.ts         # TypeScript interfaces for all API responses
│           ├── constants.ts         # Session/patch statuses, sidebar config
│           ├── diff-utils.ts        # Unified diff parser (CodeLine types)
│           └── utils.ts             # cn() utility
├── packages/
│   └── shared/                      # Shared TypeScript type definitions
│       └── src/types/
└── docs/                            # Product documentation
```

## UI Architecture

The frontend uses a **sidebar layout** (not separate pages for each view):

- **AppSidebar** (`app-sidebar.tsx`) is rendered in the root layout and is always visible
- It shows all connected repos, their branches, sessions, and navigation
- The main content area renders based on the current route
- Session workspace shows plan/diff/validation/chat in a tabbed interface
- Dialogs (add repo, create branch, new session) overlay the current view

## Data Flow

### 1. Repository Onboarding

```
User enters repo path (via AddRepoDialog in sidebar)
  → POST /api/repos
  → RepoScanner.scan() walks filesystem
  → SymbolIndexer extracts function/class names
  → AIProvider.summarize_repo() generates summary
  → Repository saved to SQLite
  → Sidebar updates with new repo + file tree
```

### 2. Task → Plan → Patch → Review

```
User creates session (via NewSessionDialog)
  → POST /api/sessions (create session)

User describes task + constraints
  → POST /api/sessions/:id/plan
    → AIProvider.generate_plan()
    → PatchArtifact created with plan JSON
    → Frontend shows plan with steps/risks

User clicks "Generate Patch"
  → POST /api/sessions/:id/patch
    → Reads actual file contents from disk for affected files
    → AIProvider.propose_patch(plan, file_contents)
    → PatchArtifact updated with changes + rationale
    → Frontend shows diff viewer

User can provide feedback and regenerate
  → POST /api/sessions/:id/patch (with feedback array)
    → Re-generates patch incorporating feedback

User runs validation
  → POST /api/sessions/:id/validate-stream (SSE)
    → Streams stdout/stderr line by line in realtime
    → After process exits, streams Grok analysis
    → Saves ValidationRun to DB
  OR
  → POST /api/sessions/:id/validate (non-streaming fallback)

User clicks "Accept" → files written to disk, session completed
User clicks "Reject" → files reverted to original content
  → PATCH /api/sessions/:id/patches/:pid
```

### 3. PR Export

```
User exports accepted patch as PR
  → POST /api/sessions/:id/export-pr
    → Creates git branch from clean state
    → Applies patched files, commits
    → Pushes to remote (if available)
    → Creates GitHub PR via gh CLI (if authenticated)
    → Stores pr_branch, pr_url, pr_commit_sha on patch
```

### 4. Chat with Grok

```
User asks a question in the chat panel
  → POST /api/chat
    → Builds system prompt with repo context + session context
    → Calls GrokAPIClient for response
    → Tracks token usage
    → Returns reply
```

## API Contract

| Endpoint                            | Method | Purpose                                        |
| ----------------------------------- | ------ | ---------------------------------------------- |
| `/api/repos`                        | POST   | Scan and onboard a repository                  |
| `/api/repos`                        | GET    | List all repositories                          |
| `/api/repos/:id`                    | GET    | Get repository details                         |
| `/api/repos/:id`                    | DELETE | Delete a repository                            |
| `/api/repos/:id/branches`           | GET    | List git branches                              |
| `/api/repos/:id/branches`           | POST   | Create a new branch                            |
| `/api/repos/:id/branch/current`     | GET    | Get current branch name                        |
| `/api/repos/:id/branch/checkout`    | POST   | Checkout a branch                              |
| `/api/repos/:id/commits`            | GET    | List recent commits (optional branch filter)   |
| `/api/sessions`                     | POST   | Create a coding session                        |
| `/api/sessions`                     | GET    | List sessions (optional repo filter)           |
| `/api/sessions/:id`                 | GET    | Get session details                            |
| `/api/sessions/:id`                 | PATCH  | Update session status/title                    |
| `/api/sessions/:id/plan`            | POST   | Generate a task plan                           |
| `/api/sessions/:id/patch`           | POST   | Generate code patches (with optional feedback) |
| `/api/sessions/:id/patches`         | GET    | List patches for a session                     |
| `/api/sessions/:id/patches/:pid`    | PATCH  | Accept/reject a patch (writes/reverts files)   |
| `/api/sessions/:id/validate-stream` | POST   | **SSE** streaming validation with live output  |
| `/api/sessions/:id/validate`        | POST   | Non-streaming validation fallback              |
| `/api/sessions/:id/validations`     | GET    | List past validation runs                      |
| `/api/sessions/:id/export-pr`       | POST   | Export accepted patch as git branch + PR       |
| `/api/chat`                         | POST   | Chat with Grok (repo/session context)          |
| `/api/tokens`                       | GET    | List token usage records                       |
| `/api/tokens/summary`               | GET    | Aggregate token usage summary                  |
| `/api/github/user`                  | GET    | Get authenticated GitHub user                  |
| `/api/github/repos`                 | GET    | List user's GitHub repos                       |
| `/api/github/issues`                | GET    | List issues for a GitHub repo                  |
| `/api/github/clone`                 | POST   | Clone a GitHub repo locally                    |
| `/api/health`                       | GET    | Health check                                   |

## AI Provider Interface

```python
class AIProvider(ABC):
    async def summarize_repo(file_tree, sample_files) -> RepoSummary
    async def generate_plan(task, context, constraints) -> GeneratedPlan
    async def propose_patch(plan, file_contents, feedback?) -> GeneratedPatch
    async def analyze_validation(result) -> ValidationAnalysis
    async def explain_diff(diff, file_path) -> str
```

### Refactored AI Layer

The AI layer is split into focused modules:

- **`provider.py`** - Abstract base class with 5 methods + shared dataclasses (RepoSummary, GeneratedPlan, FileChange, GeneratedPatch, ValidationAnalysis, ValidationResult)
- **`grok_provider.py`** - Full xAI API integration using structured outputs. Calls `api.x.ai/v1/chat/completions` with `response_format` JSON schema for guaranteed structured responses. Uses `grok-4-1-fast` by default.
- **`grok_client.py`** - HTTP transport layer. Handles auth, request construction, response parsing, cost calculation. Reusable across any endpoint (chat, structured outputs, etc.)
- **`schemas.py`** - JSON schema definitions for structured outputs (plan schema, patch schema, etc.). Tested independently.
- **`token_tracker.py`** - Records token usage and cost to the `token_usage` DB table per operation.
- **`mock_provider.py`** - Returns realistic structured data. Used when `XAI_API_KEY` is not set.

### File Contents During Patch Generation

When generating patches, the backend reads actual file contents from disk for all affected files identified in the plan. This gives Grok real code context rather than just file paths, producing accurate diffs against the actual current state of the codebase.

```python
# From patches.py — reads real files before calling Grok
for filepath in affected:
    full_path = os.path.join(repo.path, filepath)
    if os.path.isfile(full_path):
        with open(full_path, "r", errors="ignore") as f:
            file_contents[filepath] = f.read()

provider = get_ai_provider()
patch = await provider.propose_patch(existing_patch.plan, file_contents, feedback=body.feedback)
```

### SSE Streaming Validation

The `/validate-stream` endpoint uses Server-Sent Events to stream terminal output in realtime:

1. Spawns subprocess with the validation command
2. Streams stdout/stderr lines as SSE events (`type: "stdout"` / `type: "stderr"`)
3. Sends exit code and duration (`type: "exit"`)
4. Runs Grok analysis on the output (`type: "analyzing"` then `type: "analysis"`)
5. Saves ValidationRun to DB (`type: "done"` with `run_id`)

The non-streaming `/validate` endpoint still exists as a fallback.

## Database Schema

```sql
repositories    (id, name, path, file_tree JSON, symbol_index JSON, summary, timestamps)
sessions        (id, repository_id FK, title, task_description, constraints JSON, status, timestamps)
file_artifacts  (id, session_id FK, path, content, role, timestamp)
patch_artifacts (id, session_id FK, plan JSON, changes JSON, overall_rationale, status,
                 pr_branch, pr_url, pr_commit_sha, timestamp)
validation_runs (id, session_id FK, patch_artifact_id FK, command, exit_code, stdout, stderr,
                 analysis, duration_ms, timestamp)
token_usage     (id, session_id FK, operation, model, prompt_tokens, completion_tokens,
                 total_tokens, cost_usd, timestamp)
```

## Key Design Decisions

| Decision                       | Rationale                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| Grok + mock fallback           | Real Grok via structured outputs; mock for zero-cost demos. 1 env var swap.        |
| SQLite                         | Zero infrastructure. Clone + run = working app. SQLAlchemy makes Postgres trivial. |
| FastAPI + Next.js              | Python handles subprocess/filesystem. Mirrors real infra patterns.                 |
| API-first design               | Same REST endpoints work for web, mobile, CLI, or webhook clients.                 |
| Local-first                    | Can be cloned and demoed immediately. No Docker required.                          |
| SSE for validation streaming   | Simpler than WebSockets for one-directional streams. Users see output immediately. |
| Sidebar layout                 | All navigation in persistent sidebar. No page-per-view jumping.                    |
| Custom hooks for state         | useSessionWorkflow owns the entire state machine. Pages are thin render layers.    |
| Separated AI layer             | grok_client.py / schemas.py / token_tracker.py each have single responsibility.    |
| File contents sent to Grok     | Patches are generated against actual code, not just file paths.                    |
| Accept writes / Reject reverts | Accepting a patch writes patched files to disk. Rejecting restores originals.      |

## Cloud-Ready Architecture

The system is designed to go cloud-native with scoped changes:

```
Local (MVP)              →    Cloud (Next)
─────────────────────────────────────────────
SQLite                   →    Postgres
Local filesystem scan    →    GitHub/GitLab API
Subprocess validation    →    Sandboxed containers
Browser-only frontend    →    PWA + mobile dispatch
Single-user              →    OAuth + team dashboards
```

## Security Boundaries

- Frontend never touches filesystem or subprocess
- Backend validation runner: timeout protection on all subprocesses
- File scanning respects `.gitignore` and size limits
- CORS restricted to configured origins
- API key never sent to frontend; Grok calls happen server-side only
- GitHub operations use `gh` CLI (inherits local auth)
