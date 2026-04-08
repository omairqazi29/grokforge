# GrokForge - Interview Demo Script (5 minutes)

## Setup Before Demo

```bash
# Terminal 1: Start API (with or without Grok)
cd apps/api && source venv/bin/activate
export XAI_API_KEY=xai-...  # optional: enables real Grok
uvicorn app.main:app --reload

# Terminal 2: Start frontend
cd apps/web && pnpm dev
```

Open browser to `http://localhost:3000`.

**Demo repo**: Use `demo-repo/` (a small WeatherAPI project included in the repo — intentionally has no retry logic and unbounded cache, perfect demo tasks).

---

## Demo Flow

### 0:00-0:30 - The Hook

> "xAI has world-class coding models, but developers still stitch Grok into third-party tools. There's no first-party product that turns model capability into a complete software engineering workflow. So I built one."

> "GrokForge is a repo-aware coding workspace with three integrated layers: Workspace for interactive coding, Lens for codebase intelligence, and Ops for autonomous PRs. It connects to Grok via the xAI API using structured outputs."

### 0:30-1:30 - Repository Onboarding (Lens Layer)

1. Click **"Connect Repository"**
2. Enter: the absolute path to `demo-repo/`
3. Watch the scanning animation
4. Point out: **file tree**, **symbol index** (shows `WeatherClient`, `WeatherCache`, `format_temperature`), **architecture summary**

> "The Lens layer scans the repo, extracts symbols, and generates an architecture summary using Grok's structured outputs. This structured context makes everything downstream more accurate — it's not just dumping files into a context window."

### 1:30-2:30 - Task Composition & Planning (Workspace Layer)

1. Click **"New Session"**
2. Title: _"Add retry logic"_
3. Task: _"Add exponential backoff retry logic to the WeatherClient API calls"_
4. Add constraint: _"do not modify tests"_
5. Click **"Generate Plan"**
6. Walk through the plan:
   - Goal statement
   - Numbered steps with affected files (`src/weather_client.py`)
   - Risk assessment
   - Validation checklist

> "The plan isn't just a to-do list. Grok identifies which files are affected, what could go wrong, and how to verify the changes. This is the difference between code generation and software engineering."

### 2:30-3:30 - Patch Generation & Review

1. Click **"Generate Patch"**
2. Show the diff viewer:
   - Per-file tabs
   - Color-coded diff (green adds, red removes)
   - Rationale panel explaining _why_ each change was made
3. Point out the **overall rationale**

> "Every change comes with an explanation. When you're reviewing AI-generated code, understanding _why_ is as important as the _what_. All of this is powered by Grok's structured output — the response is guaranteed to match our schema."

### 3:30-4:00 - Validation

1. Switch to the **Validate** tab
2. Enter command: `pytest`
3. Run it and show results:
   - Exit code and duration
   - stdout/stderr output
   - Grok's analysis of the results

> "The validation runner executes real commands and Grok analyzes the output. If tests fail, it explains what went wrong and suggests fixes."

### 4:00-4:30 - Accept & Session Memory

1. Go back to **Review** tab
2. Click **"Accept Changes"** — show status badge change to green "completed"
3. Navigate back to repo dashboard
4. Show the session in the list with completed status
5. Click back into it — everything is preserved

> "Session memory means every task, plan, patch, and validation result is persisted. You can come back to any session and pick up where you left off."

### 4:30-5:00 - Vision & Closing

> "This works locally today, but the architecture is API-first — ready to go cloud-native. The most exciting unlock is **mobile dispatch**: open your phone, type 'fix the flaky CI test,' and get a reviewed PR back in minutes. The backend already supports it; it's just a frontend surface away."

> "Three layers that strengthen each other: Lens feeds context to Workspace and Ops. Workspace's patch engine powers Ops' autonomous patches. Each layer uses Grok's structured outputs to guarantee schema-compliant responses."

> "This isn't another AI chatbot. It's the developer workflow product that makes Grok feel like a serious software engineering system."

---

## Key Talking Points If Asked

**"Is this actually using Grok?"**

> "Yes — set `XAI_API_KEY` and it calls `api.x.ai/v1/chat/completions` with `response_format` for structured outputs. Every AI method returns guaranteed-schema JSON: plans, patches, validation analysis. Without the key, it falls back to a mock provider with the same schema shape."

**"How would you scale this?"**

> "SQLite → Postgres, add WebSocket for streaming, move validation to sandboxed containers, add OAuth. The architecture is clean enough that each of these is a focused change, not a rewrite. Most importantly, the API-first design means a mobile client or a Slack bot could call the same endpoints."

**"Tell me about the mobile dispatch idea."**

> "The killer use case is dispatching from your phone. Engineering leads and on-call devs need to unblock work without opening a laptop. Imagine: GitHub issue notification on your phone, open GrokForge, tap 'Fix it,' and get a reviewed PR with test results and rationale in 10 minutes. The API surface already supports it — we just need a thin mobile client and cloud execution."

**"What would you build next?"**

> "Three things: (1) The Ops layer — autonomous PR generation from GitHub issues. The patch engine and context layer are already built. (2) Cloud execution — sandboxed containers for validation. (3) A mobile PWA for dispatch. The high-value feature is the evidence bundle: every PR comes with the plan, validation results, and risk assessment."

**"Why this tech stack?"**

> "FastAPI for the Python AI ecosystem and subprocess handling. Next.js for the developer tool UI with great component libraries. SQLite for zero-infrastructure demos — clone it and it works. Monorepo with Turborepo for clean boundaries. The xAI API is OpenAI-compatible, so the provider could work with any OpenAI-compatible model, but the prompts and schemas are optimized for Grok."
