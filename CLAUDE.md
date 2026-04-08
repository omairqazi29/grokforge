# CLAUDE.md - GrokForge

## Project Overview

GrokForge is a repo-aware coding workspace MVP. Monorepo with Next.js frontend, FastAPI backend, and shared TypeScript types.

## Structure

- apps/web: Next.js 14+ (App Router) + TypeScript + Tailwind + shadcn/ui
- apps/api: FastAPI + SQLAlchemy + SQLite (Python 3.9+)
- packages/shared: TypeScript type definitions

## Commands

- `pnpm dev` - start all apps
- `pnpm build` - build all apps
- `pnpm lint` - lint all apps
- `cd apps/api && source venv/bin/activate && python -m pytest` - run API tests
- `pnpm dlx shadcn@latest add <component>` - add shadcn component (run from apps/web)

## Conventions

- Conventional commits: feat:, fix:, chore:, docs:, refactor:, test:
- Scopes: web, api, shared, docs, infra
- Branch naming: <type>/<short-description>
- PR-based workflow: never push directly to main
- TypeScript strict mode everywhere
- Python: type hints on all function signatures
- Shared types in packages/shared, imported by frontend only

## Architecture Boundaries

- apps/web NEVER calls subprocess or touches filesystem
- apps/api owns all filesystem + subprocess operations
- AI provider interface: apps/api/app/ai/provider.py
- All API responses use Pydantic schemas from apps/api/app/schemas/
- Mock AI provider by default. Real Grok API only when XAI_API_KEY is set.
- SQLite at apps/api/grokforge.db (gitignored)

## Style

- React components: PascalCase files, named exports
- API routes: snake_case, FastAPI Router pattern
- Shared types: camelCase properties matching API JSON
