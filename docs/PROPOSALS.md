# GrokForge - Product Proposal

## Executive Summary

xAI has world-class coding models but no first-party developer workflow product. GrokForge fills this gap with **one unified product built on three integrated capability layers**.

---

## The Problem

Strong coding models exist (grok-code-fast-1, grok-4-1-fast), but developers still experience a fragmented workflow:

- **No repo awareness**: Models don't understand project structure, architecture, or conventions
- **No task loop**: No plan → execute → validate → repair cycle
- **No review ergonomics**: Generated code is hard to evaluate without diff context and rationale
- **No session memory**: Each interaction starts from scratch

xAI positioned Grok Code Fast 1 through partner integrations (Copilot, Cursor, Cline, Windsurf), reinforcing a "model-first, workflow-second" gap.

---

## The Solution: Three Layers, One Product

GrokForge is **one product with three integrated capability layers**. Each layer strengthens the others.

### Layer 1: GrokForge Workspace — FULLY BUILT

**Interactive repo-aware coding workspace.**

The developer connects a repo, describes a task, and gets a structured engineering workflow:

1. **Repo Onboarding** - Scan, index, summarize the codebase
2. **Task Planning** - Generate structured plans with risks and affected files
3. **Patch Generation** - Produce multi-file patches with per-file rationale (sends real file contents to Grok)
4. **Validation** - Run tests/lint/build with real-time SSE streaming and Grok analysis
5. **Review** - Present diffs with explanations, accept/reject/regenerate with feedback
6. **PR Export** - Export accepted patches as git branches and GitHub PRs

**Current features beyond original spec:**

- Git branch management (list, create, checkout, commit history)
- Grok chat with repo/session context
- GitHub integration (clone repos, list repos/issues)
- Token usage tracking and cost dashboard
- Feedback-driven patch regeneration
- Accept writes files to disk, reject reverts to originals
- Settings page and overview dashboard

### Layer 2: GrokForge Lens — PARTIALLY BUILT

**Codebase intelligence and retrieval layer.**

Makes Grok dramatically better on large, messy multi-file repos:

- **Repo Graph** - File dependency and import relationships
- **Symbol Index** - Function, class, and export extraction
- **Architecture Summary** - Auto-generated project overview
- **Change Impact Analysis** - "If I change this file, what else might break?"
- **Semantic Memory** - Remember architecture decisions across sessions

**Built so far:**

- Repo scanner and symbol indexer (fully implemented)
- Architecture summary generation via AI provider
- Dependency scanner for import analysis
- File contents are read and sent to Grok during patch generation for accurate context

**Remaining:**

- Change impact analysis (planned)
- Persistent semantic memory across sessions (planned)

### Layer 3: GrokForge Ops — PLANNED

**Autonomous PR worker for teams.**

Takes an issue, generates a complete PR with evidence:

1. **Issue Intake** - Read issue description and acceptance criteria
2. **Repro Planning** - Identify reproduction steps and affected areas
3. **Branch & Patch** - Create branch, generate multi-file patches
4. **Validation** - Run test suite, lint, build
5. **PR Draft** - Open PR with evidence bundle, risk score, rollback notes

**Built so far:**

- PR export pipeline (branch creation, commit, push, PR creation via gh CLI)
- GitHub issue listing for any repo
- Branch management (create, checkout, list)

**Remaining:**

- Automatic issue intake → plan → patch → PR pipeline
- Evidence bundle generation
- Risk scoring

---

## Why Unified?

| Interaction      | How Layers Connect                                           |
| ---------------- | ------------------------------------------------------------ |
| Lens → Workspace | Lens feeds repo context to Workspace's planning and patching |
| Lens → Ops       | Lens provides architecture awareness for autonomous patches  |
| Workspace → Ops  | Workspace's patch engine powers Ops' code generation         |
| Workspace → Lens | Session memory enriches Lens's understanding over time       |

Three separate products would duplicate context-building, patch generation, and validation. One product shares infrastructure and compounds intelligence.

---

## Why This Is Compelling for xAI

1. **Fills the product gap**: xAI has the model layer; GrokForge is the workflow layer
2. **First-party advantage**: No more relying on partner integrations
3. **Enterprise angle**: Ops addresses team productivity, not just individual coding
4. **Platform play**: Three layers create lock-in and cross-selling
5. **Data flywheel**: Usage data improves Grok's coding capabilities

---

## Cloud & Mobile Dispatch Vision

GrokForge is built local-first for the MVP, but the architecture is designed to go cloud-native:

### GrokForge Cloud

- **Hosted workspaces**: Connect GitHub/GitLab repos, run everything server-side
- **Cloud validation**: Sandboxed containers for safe test/lint/build execution
- **Team dashboards**: Shared session history, approval workflows, audit trails
- **Webhook triggers**: GitHub issue → automatic Ops pipeline → PR draft in minutes

### GrokForge Mobile (Dispatch from Your Phone)

The most powerful unlock: **dispatch coding tasks from your phone**.

- Open the mobile app or PWA
- Pick a repo, type a task: _"Fix the flaky auth test in CI"_
- GrokForge runs the full loop in the cloud: plan → patch → validate → PR
- Get a push notification when the PR is ready for review
- Review the diff, approve, and merge — all from your phone

**Technical feasibility**: The API-first architecture already supports this. The frontend is a thin client over REST endpoints. A mobile client (React Native or PWA) would call the same API. Cloud execution requires moving the validation runner to sandboxed containers — a scoped infrastructure change, not a rewrite.

---

## Technical Architecture

- **Frontend**: Next.js 14+ (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend**: FastAPI + SQLAlchemy + SQLite (Postgres-ready via SQLAlchemy)
- **AI Layer**: Grok integration via xAI API with structured outputs, mock fallback
- **AI Internals**: Separated into GrokAPIClient (HTTP transport), schemas.py (JSON schemas), TokenTracker (usage recording)
- **Design**: Monorepo, API-first, sidebar-based navigation, ready for cloud deployment

The Grok provider uses the xAI chat completions API at `api.x.ai/v1` with structured outputs (JSON schema in `response_format`). Every AI method returns guaranteed-schema JSON: plans, patches, validation analysis. Set `XAI_API_KEY` to activate real Grok; unset for mock data.
