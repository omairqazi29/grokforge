# GrokForge

A repo-aware coding workspace that turns Grok into a first-party software engineering system.

## What is GrokForge?

GrokForge is a unified developer platform with three integrated capability layers:

- **Workspace** - Interactive repo-aware coding: plan, patch, validate, and review code changes
- **Lens** - Codebase intelligence: repo scanning, symbol index, architecture summaries, dependency analysis
- **Ops** - PR export pipeline: branch creation, patch commits, GitHub PR generation

Each layer strengthens the others. Lens feeds context to Workspace and Ops. Workspace's patch engine powers Ops' PR generation. Session memory flows across all layers.

## Features

### Core Workflow

- **Repo Onboarding** - Scan any local repo, build file tree, extract symbols, generate AI summary
- **Task Planning** - Describe a task in natural language, get a structured plan with steps, affected files, and risks
- **Patch Generation** - Multi-file patches with unified diffs and per-file rationale (real file contents sent to Grok)
- **Validation** - Run test/lint/build commands with real-time streaming output (SSE) and Grok analysis
- **Diff Review** - Color-coded diffs with rationale panel, accept/reject/regenerate with feedback
- **Session Persistence** - All artifacts stored in SQLite, browse and resume past sessions

### Git & GitHub Integration

- **Branch Management** - List, create, checkout branches; view commit history
- **PR Export** - Export accepted patches as git branches with commits, push + create GitHub PRs
- **GitHub Integration** - Clone repos, browse user repos and issues (via gh CLI)

### AI Features

- **Grok Chat** - Chat with Grok with full repo and session context
- **Feedback Loop** - Provide written feedback on patches and regenerate with context
- **Token Dashboard** - Track token usage and cost per operation and globally
- **Mock Provider** - Full functionality without API key for development/demos

### Design

- **Dark-first UI** - Monochromatic design matching xAI visual language
- **Sidebar Navigation** - Persistent sidebar with repos, branches, sessions, settings
- **Thinking Indicator** - Visual AI thinking animation during operations
- **Terminal Emulator** - Terminal-style output display for validation

## Tech Stack

| Layer    | Technology                                                     |
| -------- | -------------------------------------------------------------- |
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui  |
| Backend  | FastAPI, SQLAlchemy, SQLite, Pydantic                          |
| AI       | xAI API (grok-4-1-fast) with structured outputs, mock fallback |
| Monorepo | pnpm workspaces + Turborepo                                    |
| Quality  | husky, commitlint, lint-staged, ESLint, Prettier               |
| CI       | GitHub Actions                                                 |

## Project Structure

```
apps/
  api/           FastAPI backend (Python)
    app/
      ai/        AI provider layer (grok_client, schemas, token_tracker, providers)
      models/    SQLAlchemy ORM (6 tables)
      schemas/   Pydantic request/response schemas
      routers/   Route handlers (repos, sessions, plans, patches, validation,
                 branches, github, chat, tokens)
      services/  Business logic (repo_scanner, dependency_scanner, validation_runner)
  web/           Next.js frontend (TypeScript)
    app/         App Router pages (repos, sessions, dashboard, settings, github)
    components/  React components + sidebar/ + ui/ (shadcn)
    hooks/       Custom hooks (use-session-workflow, use-async, use-sidebar-data,
                 use-step-progression)
    lib/         API client, types, constants, diff utilities
packages/
  shared/        Shared TypeScript type definitions
docs/            Product documentation (PRD, proposals, architecture, decisions)
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9+
- Python 3.9+

### Setup

```bash
# Install JavaScript dependencies
pnpm install

# Set up Python environment
cd apps/api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ../..

# Start all services
pnpm dev
```

The web app runs at `http://localhost:3000` and the API at `http://localhost:8000`.

### Demo Repository

A sample project for demos is available as a separate repo at `~/Projects/weather-api-demo`. It's a small Python weather API with intentional gaps (no retry logic, unbounded cache) — perfect tasks to demo with GrokForge.

To use it:

1. Start GrokForge
2. Click "Add Repository" in the sidebar
3. Enter the absolute path to the weather-api-demo repo

### Using Grok (xAI API)

By default, GrokForge uses a mock AI provider. To connect real Grok:

```bash
export XAI_API_KEY=xai-your-api-key-here
```

The Grok provider uses structured outputs (`response_format` with JSON schema) to guarantee schema-compliant plans, patches, and analysis. Model: `grok-4-1-fast`.

### GitHub Integration

GrokForge uses the `gh` CLI for GitHub operations (PR creation, repo cloning, issue listing). Authenticate with:

```bash
gh auth login
```

## Documentation

- [Product Requirements (PRD)](docs/PRD.md)
- [Product Proposals](docs/PROPOSALS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Architecture Decisions](docs/DECISIONS.md)

## License

MIT
