# GrokForge - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser                           │
│  ┌─────────────────────────────────────────────────┐ │
│  │          Next.js Frontend (apps/web)            │ │
│  │                                                 │ │
│  │  Landing → Repo Dashboard → Session Workspace   │ │
│  │  [Compose] → [Plan] → [Review] → [Validate]    │ │
│  └───────────────────┬─────────────────────────────┘ │
└──────────────────────┼──────────────────────────────┘
                       │ HTTP/JSON
                       ▼
┌─────────────────────────────────────────────────────┐
│              FastAPI Backend (apps/api)              │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Routers  │  │ Services │  │   AI Providers   │  │
│  │          │  │          │  │                  │  │
│  │ /repos   │  │ Scanner  │  │ MockProvider     │  │
│  │ /sessions│  │ Indexer  │  │ GrokProvider     │  │
│  │ /plans   │  │ Validator│  │ (swappable)      │  │
│  │ /patches │  │          │  │                  │  │
│  │ /validate│  │          │  │                  │  │
│  └────┬─────┘  └──────────┘  └──────────────────┘  │
│       │                                             │
│  ┌────▼──────────────────────────────────────────┐  │
│  │           SQLAlchemy + SQLite                 │  │
│  │                                               │  │
│  │  repositories │ sessions │ file_artifacts     │  │
│  │  patch_artifacts │ validation_runs            │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Directory Structure

```
grokforge/
├── apps/
│   ├── api/                    # FastAPI backend
│   │   ├── app/
│   │   │   ├── ai/            # AI provider abstraction
│   │   │   │   ├── provider.py      # ABC with 5 methods
│   │   │   │   ├── mock_provider.py # Returns structured mock data
│   │   │   │   └── grok_provider.py # Real xAI API (stub)
│   │   │   ├── models/        # SQLAlchemy ORM models
│   │   │   ├── schemas/       # Pydantic request/response schemas
│   │   │   ├── routers/       # FastAPI route handlers
│   │   │   ├── services/      # Business logic
│   │   │   │   ├── repo_scanner.py     # File tree + symbol extraction
│   │   │   │   └── validation_runner.py # Subprocess command execution
│   │   │   ├── config.py      # Environment-based settings
│   │   │   ├── database.py    # Async SQLAlchemy session
│   │   │   └── main.py        # App factory + CORS + lifespan
│   │   └── tests/
│   └── web/                    # Next.js frontend
│       ├── app/               # App Router pages
│       │   ├── repos/[id]/    # Repo dashboard
│       │   └── sessions/[id]/ # Session workspace
│       ├── components/        # React components
│       │   ├── ui/            # shadcn/ui primitives
│       │   ├── file-tree.tsx
│       │   ├── task-composer.tsx
│       │   ├── plan-viewer.tsx
│       │   ├── diff-viewer.tsx
│       │   ├── validation-panel.tsx
│       │   └── session-sidebar.tsx
│       └── lib/
│           └── api-client.ts  # Typed API wrapper
├── packages/
│   └── shared/                # TypeScript type definitions
│       └── src/types/
└── docs/                      # Product documentation
```

## Data Flow

### 1. Repository Onboarding

```
User enters repo path
  → POST /api/repos
  → RepoScanner.scan() walks filesystem
  → SymbolIndexer extracts function/class names
  → MockProvider.summarize_repo() generates summary
  → Repository saved to SQLite
  → Frontend shows file tree + summary
```

### 2. Task → Plan → Patch → Review

```
User describes task + constraints
  → POST /api/sessions (create session)
  → POST /api/sessions/:id/plan
    → MockProvider.generate_plan()
    → PatchArtifact created with plan JSON
    → Frontend shows plan with steps/risks

User clicks "Generate Patch"
  → POST /api/sessions/:id/patch
    → MockProvider.propose_patch()
    → PatchArtifact updated with changes + rationale
    → Frontend shows diff viewer

User clicks "Run Validation"
  → POST /api/sessions/:id/validate
    → ValidationRunner executes command via subprocess
    → MockProvider.analyze_validation() summarizes results
    → Frontend shows command output + analysis

User clicks "Accept" or "Reject"
  → PATCH /api/sessions/:id/patches/:pid
    → Status updated, session marked completed
```

## API Contract

| Endpoint                         | Method | Purpose                              |
| -------------------------------- | ------ | ------------------------------------ |
| `/api/repos`                     | POST   | Scan and onboard a repository        |
| `/api/repos`                     | GET    | List all repositories                |
| `/api/repos/:id`                 | GET    | Get repository details               |
| `/api/sessions`                  | POST   | Create a coding session              |
| `/api/sessions`                  | GET    | List sessions (optional repo filter) |
| `/api/sessions/:id`              | GET    | Get session details                  |
| `/api/sessions/:id`              | PATCH  | Update session status/title          |
| `/api/sessions/:id/plan`         | POST   | Generate a task plan                 |
| `/api/sessions/:id/patch`        | POST   | Generate code patches                |
| `/api/sessions/:id/patches/:pid` | PATCH  | Accept/reject a patch                |
| `/api/sessions/:id/validate`     | POST   | Run a validation command             |
| `/api/health`                    | GET    | Health check                         |

## AI Provider Interface

```python
class AIProvider(ABC):
    async def summarize_repo(file_tree, sample_files) -> RepoSummary
    async def generate_plan(task, context, constraints) -> GeneratedPlan
    async def propose_patch(plan, file_contents) -> GeneratedPatch
    async def analyze_validation(result) -> ValidationAnalysis
    async def explain_diff(diff, file_path) -> str
```

**Mock Provider**: Returns realistic structured data. Used when `XAI_API_KEY` is not set.

**Grok Provider**: Fully implemented xAI API integration. Calls `api.x.ai/v1/chat/completions` with `response_format` JSON schema for guaranteed structured responses. Uses `grok-4-1-fast` by default. Activate by setting `XAI_API_KEY`.

```python
# How Grok structured outputs work in GrokForge:
response = await httpx.post("https://api.x.ai/v1/chat/completions", json={
    "model": "grok-4-1-fast",
    "messages": [...],
    "response_format": {
        "type": "json_schema",
        "json_schema": {
            "name": "plan",
            "strict": True,
            "schema": { ... }  # Guarantees schema-compliant JSON
        }
    }
})
```

## Database Schema

```sql
repositories    (id, name, path, file_tree JSON, symbol_index JSON, summary, timestamps)
sessions        (id, repository_id FK, title, task_description, constraints JSON, status, timestamps)
file_artifacts  (id, session_id FK, path, content, role, timestamp)
patch_artifacts (id, session_id FK, plan JSON, changes JSON, overall_rationale, status, timestamp)
validation_runs (id, session_id FK, patch_artifact_id FK, command, exit_code, stdout, stderr, analysis, duration_ms, timestamp)
```

## Key Design Decisions

| Decision             | Rationale                                                                      |
| -------------------- | ------------------------------------------------------------------------------ |
| Grok + mock fallback | Real Grok via structured outputs; mock for zero-cost demos. 1 env var swap.    |
| SQLite               | Zero infrastructure. Clone + run = working app. SQLAlchemy → Postgres trivial. |
| FastAPI + Next.js    | Python handles subprocess/filesystem (security). Mirrors real infra patterns.  |
| API-first design     | Same REST endpoints work for web, mobile, CLI, or webhook clients.             |
| Local-first          | Interviewer can clone and demo immediately. No Docker required.                |

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
- Backend validation runner: allowlisted commands only, timeout protection
- No `shell=True` in subprocess execution
- File scanning respects `.gitignore` and size limits
- CORS restricted to `localhost:3000` by default
- API key never sent to frontend; Grok calls happen server-side only
