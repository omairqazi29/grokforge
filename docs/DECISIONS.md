# Architecture Decision Records

## ADR-001: Provider Pattern for AI Abstraction

**Context:** GrokForge needs to work with mock data during development and real Grok API in production.

**Decision:** Use the Strategy pattern with an abstract `AIProvider` base class. Concrete implementations (`MockProvider`, `GrokProvider`) are swapped via a factory function based on the `XAI_API_KEY` environment variable.

**Consequences:**

- Zero-config development (mock by default)
- One env var to switch to production
- Easy to add new providers (OpenAI, Gemini, etc.)
- Provider interface is the contract — frontend doesn't care which backend AI runs

**Files:** `apps/api/app/ai/provider.py`, `apps/api/app/ai/__init__.py`

---

## ADR-002: Separated API Client, Schemas, and Token Tracker

**Context:** The original `GrokProvider` was a 400-line monolith mixing HTTP calls, JSON schema definitions, domain logic, and usage tracking.

**Decision:** Split into three concerns:

- `GrokAPIClient` — HTTP transport, auth, response parsing
- `schemas.py` — JSON schema definitions for structured outputs
- `TokenTracker` — writes usage records to DB

**Consequences:**

- Each class has a single responsibility
- Schemas can be tested independently
- Token tracking can be mocked in tests
- API client can be reused for any endpoint

**Files:** `apps/api/app/ai/grok_client.py`, `apps/api/app/ai/schemas.py`, `apps/api/app/ai/token_tracker.py`

---

## ADR-003: Custom Hooks for State Management

**Context:** The session page had 19 `useState` hooks and 7 async operations in a single component.

**Decision:** Extract workflow state into `useSessionWorkflow` hook. The hook owns the entire state machine (plan → patch → validate → accept). Page components only handle rendering and user events.

**Consequences:**

- Page components are thin render layers
- Business logic is testable without rendering
- State transitions are centralized
- Reusable across different page layouts

**Files:** `apps/web/hooks/use-session-workflow.ts`, `apps/web/hooks/use-async.ts`

---

## ADR-004: Shared CodeBlock Component

**Context:** Terminal output, diff viewer, and validation panel all render colored code lines with line numbers. Each had its own implementation.

**Decision:** Extract a shared `CodeBlock` component that accepts typed `CodeLine[]` data. Parent components handle interaction (selection popups, review comments).

**Consequences:**

- DRY: one rendering path for all code display
- Consistent styling across the app
- Selection/interaction is composable via `onSelect` callback

**Files:** `apps/web/components/code-block.tsx`

---

## ADR-005: SSE Streaming for Terminal Output

**Context:** Users need to see terminal output in realtime, not after the command finishes.

**Decision:** Use Server-Sent Events (SSE) via FastAPI's `StreamingResponse`. The endpoint streams stdout/stderr line by line, then appends Grok analysis after the process exits.

**Consequences:**

- Users see output immediately
- Grok analysis doesn't block the output display
- SSE is simpler than WebSockets for one-directional streams
- Fallback non-streaming endpoint still exists

**Files:** `apps/api/app/routers/validation.py`, `apps/web/components/validation-panel.tsx`

---

## ADR-006: Dark-First Monochromatic Design

**Context:** Building for xAI interview — should match xAI's visual language.

**Decision:** Dark-first design with sharp corners (0px radius), opacity-based hierarchy, monospace uppercase labels. No decorative colors or shadows.

**Consequences:**

- Matches xAI brand identity
- Opacity hierarchy creates depth without color
- Monospace fonts signal "developer tool"
- Light mode vars exist but dark is default

**Files:** `apps/web/app/globals.css`

---

## ADR-007: Local-First with Cloud-Ready Architecture

**Context:** MVP needs to work offline on a dev machine, but the architecture should be deployable to cloud.

**Decision:** SQLite for persistence, subprocess for validation, local filesystem for repo scanning. API-first design so any client (web, mobile, CLI) can use the same backend.

**Migration path:**

- SQLite → Postgres (SQLAlchemy makes this trivial)
- Subprocess → sandboxed containers
- Local FS → GitHub API for repo access
- Single-user → OAuth + teams

**Files:** `apps/api/app/config.py`, `apps/api/app/database.py`
