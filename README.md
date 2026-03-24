# Drafter.ai — AI Proposal Writing Agent

A production-grade **Next.js + TypeScript** application that runs a fully
autonomous AI agent pipeline to generate, review, and approve freelance
proposals.

---

## Stack

| Layer     | Tech                              |
|-----------|-----------------------------------|
| Framework | Next.js 14 (App + Pages Router)   |
| Language  | TypeScript (strict)               |
| AI        | Google Gemini (gemini-1.5-pro)     |
| Database  | Supabase (PostgreSQL)             |
| Integrations | ClickUp API, Slack Webhooks    |
| Styling   | Inline CSS (zero runtime, pixel-perfect) + Tailwind utility classes |

---

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

| Variable                     | Required | Description                                  |
|------------------------------|----------|----------------------------------------------|
| `GEMINI_API_KEY`             | ✅       | Your Google Gemini API key                    |
| `SUPABASE_URL`               | ✅       | Supabase project URL (e.g. https://xyz.supabase.co) |
| `SUPABASE_SERVICE_ROLE_KEY`  | ✅       | Supabase service role key (server side only)  |
| `CLICKUP_API_KEY`            | ☑️ opt  | ClickUp Personal API token                   |
| `CLICKUP_LIST_ID`            | ☑️ opt  | ClickUp List ID for tasks                    |
| `SLACK_WEBHOOK_URL`          | ☑️ opt  | Slack Incoming Webhook URL                   |
| `NEXT_PUBLIC_APP_URL`        | ☑️ opt  | Public URL (used in Slack links)             |

### 3. Initialize the database (required)

Run the helper script to create the required Supabase tables:

```bash
npm run db:init
```

### 4. Seed case studies (optional but recommended)

```bash
npm run db:seed
```

### 4. Run

```bash
npm run dev
```

Open → **http://localhost:3000**

---

## Pages

| Route              | Description                              |
|--------------------|------------------------------------------|
| `/`                | **Proposal Workspace** — main UI         |
| `/dashboard`       | Stats, recent proposals, activity feed   |
| `/audit`           | Full agent action audit log              |
| `/proposals/[id]`  | Public review page (linked from Slack)   |

---

## API Routes (Next.js API handlers)

| Method | Route                               | Description                     |
|--------|-------------------------------------|---------------------------------|
| POST   | `/api/agent/run`                    | Run the full 10-step agent      |
| GET    | `/api/proposals`                    | List all proposals              |
| GET    | `/api/proposals/[id]`               | Get a single proposal           |
| POST   | `/api/proposals/[id]?action=approve`| Approve a proposal              |
| POST   | `/api/proposals/[id]?action=reject` | Reject a proposal               |
| POST   | `/api/proposals/[id]?action=regenerate` | Regenerate a section        |
| GET    | `/api/jobs`                         | List job posts                  |
| POST   | `/api/jobs`                         | Create a job post               |
| GET    | `/api/audit`                        | List audit logs                 |

---

## Agent Pipeline (10 steps)

```
1. Receive job post
2. Parse with LLM → structured JSON { skills, budget, timeline, … }
3. Search Supabase `case_studies` table by skill similarity
4. Select top 3 matches
5. Generate 4-section proposal (Introduction, Project Plan, Case Studies, Questions)
6. Create ClickUp task
7. Send Slack notification with Approve / Reject links
8. Await human approval
9. Update proposal status (approved / rejected)
10. Log every action to audit_logs
```

---

## Supabase tables

These tables power the agent’s persistence layer. You can create them via SQL in the Supabase dashboard.

- `job_posts` — Raw + parsed job descriptions
- `case_studies` — Portfolio / past work (seed with `scripts/seed.ts`)
- `proposals` — Generated proposals + status tracking
- `audit_logs` — Every agent action with metadata

### Supabase Setup

1. Go to https://app.supabase.com and create a project.
2. In the **SQL Editor**, run the SQL below to create the required tables.
3. Go to **Settings → API → Service key** and copy the **Service Role** key.
4. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.

#### Example SQL (run in Supabase SQL editor)

```sql
create table job_posts (
  id text primary key,
  raw_text text not null,
  parsed_skills jsonb not null,
  budget text not null,
  timeline text not null,
  industry text not null,
  client text not null,
  tone text not null,
  created_at timestamptz not null
);

create table case_studies (
  id text primary key,
  title text not null,
  description text not null,
  skills jsonb not null,
  industry text not null,
  results text not null,
  tags jsonb not null
);

create table proposals (
  id text primary key,
  job_post_id text not null,
  case_studies_used jsonb not null,
  proposal_text text not null,
  sections jsonb not null,
  status text not null,
  metadata jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text
);

create table audit_logs (
  id text primary key,
  action text not null,
  agent_step text not null,
  metadata jsonb not null,
  timestamp timestamptz not null
);
```

---

## License

MIT
