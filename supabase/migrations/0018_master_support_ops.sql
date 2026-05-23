create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  opened_by_profile_id uuid null references public.profiles(id) on delete set null,
  owner_profile_id uuid null references public.profiles(id) on delete set null,
  title text not null,
  category text not null default 'geral',
  priority text not null default 'media',
  status text not null default 'aberto',
  description text null,
  sla_deadline timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_empresa_status_idx
  on public.support_tickets (empresa_id, status, priority, created_at desc);

create table if not exists public.support_ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  actor_profile_id uuid null references public.profiles(id) on delete set null,
  event_type text not null,
  message text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists support_ticket_events_ticket_created_idx
  on public.support_ticket_events (ticket_id, created_at desc);

create table if not exists public.master_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid null references public.profiles(id) on delete set null,
  actor_email text null,
  action text not null,
  target_type text not null,
  target_id text null,
  empresa_id uuid null references public.empresas(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists master_audit_logs_created_idx
  on public.master_audit_logs (created_at desc);

create index if not exists master_audit_logs_action_idx
  on public.master_audit_logs (action, created_at desc);

alter table public.support_tickets enable row level security;
alter table public.support_ticket_events enable row level security;
alter table public.master_audit_logs enable row level security;

drop policy if exists support_tickets_tenant_select on public.support_tickets;
drop policy if exists support_tickets_tenant_insert on public.support_tickets;
drop policy if exists support_tickets_admin_update on public.support_tickets;
drop policy if exists support_ticket_events_tenant_select on public.support_ticket_events;
drop policy if exists support_ticket_events_tenant_insert on public.support_ticket_events;
drop policy if exists master_audit_logs_service_select on public.master_audit_logs;

create policy support_tickets_tenant_select on public.support_tickets
for select to authenticated
using (empresa_id = public.current_empresa_id());

create policy support_tickets_tenant_insert on public.support_tickets
for insert to authenticated
with check (empresa_id = public.current_empresa_id());

create policy support_tickets_admin_update on public.support_tickets
for update to authenticated
using (empresa_id = public.current_empresa_id() and public.is_empresa_admin())
with check (empresa_id = public.current_empresa_id() and public.is_empresa_admin());

create policy support_ticket_events_tenant_select on public.support_ticket_events
for select to authenticated
using (
  exists (
    select 1
    from public.support_tickets t
    where t.id = ticket_id
      and t.empresa_id = public.current_empresa_id()
  )
);

create policy support_ticket_events_tenant_insert on public.support_ticket_events
for insert to authenticated
with check (
  exists (
    select 1
    from public.support_tickets t
    where t.id = ticket_id
      and t.empresa_id = public.current_empresa_id()
  )
);

create policy master_audit_logs_service_select on public.master_audit_logs
for select to service_role
using (true);

