# GrokForge - Product Requirements Document

## Problem Statement

xAI has built strong coding models (grok-code-fast-1, grok-4-1-fast) with features like structured outputs, function calling, and multi-agent orchestration. However, developers still need to stitch Grok into third-party tools (Cursor, Copilot, Cline) because there is no first-party product that turns these model capabilities into a complete software engineering workflow.

The gap is not model quality. The gap is **product execution**: no tool gives developers a clean loop of understand repo → plan task → make changes → validate → review.

## Target Users

1. **Software engineers** who want AI-assisted coding beyond autocomplete
2. **Technical founders** building with Grok and wanting a native dev experience
3. **Internal xAI teams** using Grok for their own codebase work
4. **Developer tool evaluators** comparing xAI's ecosystem against competitors

## Product Summary

GrokForge is a repo-aware coding workspace that makes Grok feel like a first-party software engineering system. A developer connects a repository, describes a task in plain language, and gets a structured plan, code patches, validation results, and a reviewable diff with explanations.

## Core User Story

A developer opens GrokForge, connects a repo, and asks:

> "Add exponential backoff retry logic to the API client and update tests."

GrokForge:

1. Scans and indexes the repository
2. Generates a structured plan with affected files and risks
3. Produces code patches with per-file rationale
4. Runs tests/lint/build and summarizes results
5. Presents a diff with explanations
6. Lets the developer accept, reject, or regenerate

## Feature Requirements

### P0 - Must Have (MVP) — ALL IMPLEMENTED

| Feature              | Description                                                                      | Status |
| -------------------- | -------------------------------------------------------------------------------- | ------ |
| Repo Onboarding      | Scan local repo, build file tree, extract symbols, generate architecture summary | Done   |
| Task Composer        | Natural language task input with optional constraints                            | Done   |
| Plan Generation      | Structured plan: goal, steps, affected files, risks, validation checklist        | Done   |
| Patch Proposal       | Multi-file patch with unified diff and per-file rationale                        | Done   |
| Validation Runner    | Execute test/lint/build commands, capture output, analyze results                | Done   |
| Diff Review          | Diff viewer with rationale panel, accept/reject/regenerate                       | Done   |
| Session Persistence  | Store all artifacts (task, plan, patches, validation) in SQLite                  | Done   |
| Provider Abstraction | Swappable AI provider (mock default, real Grok via env var)                      | Done   |

### P1 - Should Have — ALL IMPLEMENTED

| Feature              | Description                                                           | Status |
| -------------------- | --------------------------------------------------------------------- | ------ |
| Auto-fix Loop        | Feedback-driven regeneration: provide feedback, regenerate patch      | Done   |
| Multi-file Awareness | File contents sent to Grok during patch generation for accurate diffs | Done   |
| Session History      | Browse and reopen past sessions with full context                     | Done   |
| Dark Mode            | Dark-first monochromatic design matching xAI visual language          | Done   |

### P2 - Nice to Have — PARTIALLY IMPLEMENTED

| Feature              | Description                                                    | Status  |
| -------------------- | -------------------------------------------------------------- | ------- |
| GitHub PR Generation | Export accepted patches as git branches + draft PRs via gh CLI | Done    |
| Multi-agent Mode     | Separate planner/coder/reviewer agents                         | Planned |
| Token Dashboard      | Cost and token usage tracking per session and globally         | Done    |
| Repo Memory Graph    | Persistent architecture knowledge across sessions              | Planned |
| Cloud Execution      | Sandboxed containers for validation, no local env required     | Planned |
| Mobile Dispatch      | PWA/mobile app to dispatch tasks and review PRs from phone     | Planned |

### Additional Features Built (not in original PRD)

| Feature                  | Description                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| SSE Streaming Validation | Real-time terminal output via Server-Sent Events during validation |
| Git Branch Management    | List, create, checkout branches; view commit history               |
| Grok Chat                | Chat with Grok with repo/session context awareness                 |
| GitHub Integration       | Clone repos, list user repos/issues, authenticated via gh CLI      |
| Sidebar Navigation       | Persistent sidebar with repos, branches, sessions, settings        |
| Thinking Indicator       | Visual AI thinking/loading animation during operations             |
| Terminal Emulator        | Terminal-style output display for validation results               |
| Patch Feedback Loop      | Provide written feedback on patches and regenerate with context    |
| Accept Writes to Disk    | Accepting a patch writes patched files directly to the repository  |
| Reject Reverts Files     | Rejecting a patch restores original file contents                  |
| Dependency Scanner       | Import and dependency analysis for repo intelligence               |
| Settings Page            | Application settings configuration                                 |
| Dashboard Page           | Overview dashboard for all repos and sessions                      |

## Non-Goals for MVP

- Full IDE replacement
- Multi-user collaboration
- Fine-grained per-tool permissions

## Success Criteria

1. Can scan a medium-sized repo (500+ files) in under 5 seconds
2. Produces a useful plan with correct file targeting for common tasks
3. Generates multi-file patches that apply cleanly
4. Runs validation commands and presents results clearly (with real-time streaming)
5. Shows reviewable diffs with meaningful explanations
6. Stores and retrieves session state reliably
7. Provider swap from mock to real Grok works with a single env var
8. Can export accepted patches as git branches and GitHub PRs

## Technical Constraints

- Python 3.9+ (system Python compatibility)
- SQLite for zero-infrastructure persistence
- Local-first architecture (no cloud dependencies for MVP)
- Provider-agnostic AI interface
- OpenAI-compatible API format (xAI API at api.x.ai/v1)

## Competitive Landscape

| Product        | Strengths                        | Gap GrokForge Fills                       |
| -------------- | -------------------------------- | ----------------------------------------- |
| Codex (OpenAI) | Cloud execution, parallel agents | First-party xAI product, local-first      |
| Cursor         | IDE integration, inline editing  | Standalone product, full engineering loop |
| Copilot        | GitHub integration, autocomplete | Planning + validation + review workflow   |
