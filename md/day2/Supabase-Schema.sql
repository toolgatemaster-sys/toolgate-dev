-- Toolgate — Supabase Schema (events + approvals)

create extension if not exists pgcrypto;

create table if not exists events (
  id bigserial primary key,
  event_id uuid default gen_random_uuid(),
  parent_event_id uuid,
  ts timestamptz not null default now(),
  org_id text,
  project_id text,
  agent_id text,
  trace_id text not null,
  type text not null,
  tool text,
  target text,
  action text,
  latency_ms int,
  status int,
  decision text,
  risk_score int,
  attrs jsonb not null default '{}'
);

create index if not exists idx_events_trace_ts on events(trace_id, ts);
create index if not exists idx_events_agent_window on events(agent_id, ts);
create index if not exists idx_events_parent on events(parent_event_id);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  requested_at timestamptz not null default now(),
  status text not null default 'pending', -- pending|approved|denied|expired
  reason text,
  requester text,
  approver text,
  expires_at timestamptz,
  trace_id text,
  action jsonb not null
);

create index if not exists idx_approvals_status on approvals(status);
