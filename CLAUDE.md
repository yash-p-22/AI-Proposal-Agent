# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Drafter.ai** — an autonomous AI agent that generates freelance proposals. A Next.js 14 (Pages Router) + TypeScript app using Google Gemini for AI, Supabase (PostgreSQL) for persistence, with optional ClickUp and Slack integrations.

## Commands

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # Lint with next lint
npm run db:init      # Create Supabase tables (scripts/init-db.js)
npm run db:seed      # Seed case studies (scripts/seed.ts)
```

## Architecture

### Agent Pipeline (`lib/proposalAgent.ts`)

The core logic is a 10-step sequential pipeline triggered via `POST /api/agent/run`:

1. Receive job post → 2. Parse with Gemini → 3. Search case studies by skill matching → 4. Select top 3 → 5. Generate 4-section proposal → 6. Create ClickUp task → 7. Send Slack notification → 8. Await human approval → 9-10. Status update + audit logging

Each step produces an `AgentStep` with status (done/error/pending/skipped). Steps 6-7 gracefully degrade if integrations aren't configured.

### Key Layers

- **`lib/aiService.ts`** — Direct Gemini REST API calls (no SDK). Handles rate-limit retries, JSON mode, and robust response parsing. Two main functions: `parseJobPost` (structured extraction) and `generateProposal` (4-section output). Model configured via `GEMINI_MODEL` env var (defaults to `gemini-2.5-flash`).
- **`lib/supabaseService.ts`** — All database CRUD. Case study search uses in-memory skill/tag/industry scoring (not vector search). This is the actual implementation.
- **`lib/firebaseService.ts`** / **`lib/firebase.ts`** — Legacy compatibility shims that re-export from `supabaseService` and `supabase` respectively. The app does **not** use Firebase.
- **`lib/clickupService.ts`** / **`lib/slackService.ts`** — Optional integration services; skip gracefully when env vars are missing.
- **`lib/apiClient.ts`** — Frontend HTTP client wrapping the API routes.

### Frontend

Pages Router with inline CSS + Tailwind utility classes. Main workspace at `/` with `JobInputPanel` (left) and `ProposalPreview` (right). Dashboard at `/dashboard`, audit log at `/audit`, public proposal review at `/proposals/[id]`.

### Types

All domain types in `types/index.ts`: `Proposal`, `JobPost`, `CaseStudy`, `ParsedJob`, `ProposalOutput`, `AgentStep`, `AgentRunResult`, and API request/response types.

### Database Tables (Supabase)

`job_posts`, `case_studies`, `proposals`, `audit_logs` — schema defined in README.md and `scripts/init-db.js`.

## Environment

Required: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
Optional: `GEMINI_MODEL`, `CLICKUP_API_KEY`, `CLICKUP_LIST_ID`, `SLACK_WEBHOOK_URL`, `NEXT_PUBLIC_APP_URL`

Configure in `.env.local` (copy from `.env.example`).
