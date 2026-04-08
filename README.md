# GrokForge

A repo-aware coding workspace that turns Grok into a first-party software engineering system.

## What is GrokForge?

GrokForge is a unified developer platform with three integrated capability layers:

- **Workspace** - Interactive repo-aware coding: plan, patch, validate, and review code changes
- **Lens** - Codebase intelligence: repo graph, symbol index, architecture summaries, change impact analysis
- **Ops** - Autonomous PR worker: issue intake, branch creation, patch generation, test execution, PR drafting

Each layer strengthens the others. Lens feeds context to Workspace and Ops. Workspace's patch engine powers Ops' autonomous patches. Session memory flows across all layers.

## Tech Stack

| Layer    | Technology                                                                   |
| -------- | ---------------------------------------------------------------------------- |
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, Monaco Editor |
| Backend  | FastAPI, SQLAlchemy, SQLite, Pydantic                                        |
| Monorepo | pnpm workspaces + Turborepo                                                  |
| Quality  | husky, commitlint, lint-staged, ESLint, Prettier                             |
| CI       | GitHub Actions                                                               |

## Project Structure

```
apps/
  api/     - FastAPI backend (Python)
  web/     - Next.js frontend (TypeScript)
packages/
  shared/  - Shared TypeScript type definitions
docs/      - PRD, proposals, architecture, demo script
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

### Using a Real AI Provider

By default, GrokForge uses a mock AI provider. To use the real Grok API:

```bash
export XAI_API_KEY=your-api-key-here
```

## Documentation

- [Product Requirements (PRD)](docs/PRD.md)
- [Product Proposals](docs/PROPOSALS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Interview Demo Script](docs/INTERVIEW_DEMO.md)

## License

MIT
