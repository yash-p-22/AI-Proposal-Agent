/*
 * Initialize Supabase schema by creating required tables if they don't already exist.
 *
 * Usage:
 *   node scripts/init-db.js
 *
 * Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your environment
 * (for example by copying .env.example to .env.local and updating values).
 */

import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local' });
config({ path: '.env' });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const host = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

const client = new Client({
  host,
  port: 5432,
  user: 'postgres',
  password: key,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

const sql = `
create table if not exists job_posts (
  id text primary key,
  raw_text text not null,
  parsed_skills jsonb not null default '[]'::jsonb,
  budget text not null,
  timeline text not null,
  industry text not null,
  client text not null,
  tone text not null,
  created_at timestamptz not null default now()
);

create table if not exists case_studies (
  id text primary key,
  title text not null,
  description text not null,
  skills jsonb not null default '[]'::jsonb,
  industry text not null,
  results text not null,
  tags jsonb not null default '[]'::jsonb
);

create table if not exists proposals (
  id text primary key,
  job_post_id text not null,
  case_studies_used jsonb not null default '[]'::jsonb,
  proposal_text text not null,
  sections jsonb not null default '[]'::jsonb,
  status text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  approved_at timestamptz,
  approved_by text,
  rejected_at timestamptz,
  rejection_reason text
);

alter table proposals add column if not exists approved_by text;

create table if not exists audit_logs (
  id text primary key,
  action text not null,
  agent_step text not null,
  metadata jsonb not null default '{}'::jsonb,
  timestamp timestamptz not null default now()
);
`;

async function main() {
  try {
    await client.connect();
    console.log('Connected to Supabase database. Creating tables if missing...');
    await client.query(sql);
    console.log('✅ Tables ensure-created successfully.');
  } catch (err) {
    console.error('❌ Failed to create tables:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
