# GrokForge - Interview Demo Script (5 minutes)

## Setup Before Demo

```bash
# Terminal 1: Start API
cd apps/api && source venv/bin/activate && uvicorn app.main:app --reload

# Terminal 2: Start frontend
cd apps/web && pnpm dev
```

Open browser to `http://localhost:3000`.

---

## Demo Flow

### 0:00-0:30 - The Hook

> "xAI has world-class coding models, but developers still need to stitch Grok into third-party tools. There's no first-party product that turns model capability into a complete software engineering workflow. So I built one."

> "GrokForge is a repo-aware coding workspace with three integrated layers: Workspace for interactive coding, Lens for codebase intelligence, and Ops for autonomous PRs."

### 0:30-1:30 - Repository Onboarding (Lens Layer)

1. Click **"Add Repository"**
2. Enter a repo path (use GrokForge's own repo for meta-demo)
3. Show the scanning progress
4. Point out: **file tree**, **symbol index**, **architecture summary**

> "The Lens layer scans the repo, extracts symbols, and builds an architecture summary. This structured context makes everything downstream more accurate - it's not just dumping files into a context window."

### 1:30-2:30 - Task Composition & Planning (Workspace Layer)

1. Click **"New Session"**
2. Enter a realistic task: _"Add exponential backoff retry logic to the API client"_
3. Add a constraint: _"do not modify tests"_
4. Click **"Generate Plan"**
5. Walk through the plan:
   - Goal statement
   - Numbered steps with affected files
   - Risk assessment
   - Validation checklist

> "The plan isn't just a to-do list. It identifies which files are affected, what could go wrong, and how to verify the changes. This is the difference between code generation and software engineering."

### 2:30-3:30 - Patch Generation & Review

1. Click **"Generate Patch"**
2. Show the diff viewer:
   - Per-file tabs
   - Color-coded diff (green adds, red removes)
   - Rationale panel for each file
3. Point out the **overall rationale**

> "Every change comes with an explanation. When you're reviewing AI-generated code, understanding _why_ a change was made is as important as the change itself."

### 3:30-4:00 - Validation

1. Switch to the **Validate** tab
2. Enter a command: `pytest` or `pnpm lint`
3. Run it and show results:
   - Exit code and duration
   - stdout/stderr output
   - AI analysis of the results

> "The validation runner executes real commands and analyzes the results. If tests fail, the system can explain what went wrong and suggest fixes."

### 4:00-4:30 - Accept & Session Memory

1. Go back to **Review** tab
2. Click **"Accept Changes"** - show status update
3. Navigate back to repo dashboard
4. Show the session in the list with "completed" status
5. Click back into it - everything is preserved

> "Session memory means every task, plan, patch, and validation result is persisted. You can come back to any session and pick up where you left off."

### 4:30-5:00 - Architecture & Closing

> "Let me quickly show the architecture. The AI provider is an abstract interface with five methods. Right now it uses a mock that returns realistic structured data. To switch to real Grok, you set one environment variable: `XAI_API_KEY`. The provider interface maps directly to Grok's structured output capabilities."

> "I designed this as a platform with three layers that strengthen each other. Lens feeds context to Workspace and Ops. Workspace's patch engine powers Ops' autonomous patches. And session memory flows across all layers."

> "This isn't just another AI chatbot. It's the developer workflow product that makes Grok feel like a serious software engineering system."

---

## Key Talking Points If Asked

**"Why not use the real Grok API?"**

> "The entire UX is built against the mock, which proves the interface design is provider-agnostic. The swap is literally one env var. But more importantly, I wanted to demonstrate product and architecture thinking, not just API wiring."

**"How would you scale this?"**

> "SQLite → Postgres, add WebSocket for streaming responses, move validation to sandboxed containers, add user auth. The architecture is clean enough that each of these is a focused change, not a rewrite."

**"What would you build next?"**

> "The Ops layer - autonomous PR generation. The patch engine and context layer are already built. Adding GitHub issue intake and PR creation is mostly integration work. The high-value feature is the evidence bundle: every PR comes with the plan, validation results, and risk assessment."

**"Why this tech stack?"**

> "FastAPI for the Python AI ecosystem and subprocess handling. Next.js for the developer tool UI. SQLite for zero-infrastructure demos. Monorepo with Turborepo for clean boundaries. Every choice optimizes for 'clone it and it works.'"
