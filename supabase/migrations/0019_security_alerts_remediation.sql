alter table public.security_alerts
  add column if not exists status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'ignored')),
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_by_profile_id uuid references public.profiles(id),
  add column if not exists resolution_note text;

create index if not exists security_alerts_status_created_idx
  on public.security_alerts (status, created_at desc);
