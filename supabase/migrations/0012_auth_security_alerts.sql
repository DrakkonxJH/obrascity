create table if not exists public.security_alerts (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  severity text not null check (severity in ('medium', 'high')),
  email text,
  ip_hash text,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists security_alerts_category_created_idx
  on public.security_alerts (category, created_at desc);

create index if not exists security_alerts_severity_created_idx
  on public.security_alerts (severity, created_at desc);

create index if not exists signup_attempts_ip_created_idx
  on public.signup_attempts (ip_hash, created_at desc);

alter table public.security_alerts enable row level security;

-- No policies: only service role can read/write
