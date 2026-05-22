alter table public.privacy_requests
  add column if not exists requested_by uuid references public.profiles(id) on delete set null,
  add column if not exists processed_at timestamptz,
  add column if not exists resolution_notes text,
  add column if not exists payload jsonb not null default '{}'::jsonb;

create table if not exists public.consent_events (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  consent_type text not null,
  accepted boolean not null,
  accepted_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists consent_events_empresa_profile_idx
  on public.consent_events (empresa_id, profile_id, accepted_at desc);

create index if not exists privacy_requests_empresa_status_idx
  on public.privacy_requests (empresa_id, status, created_at desc);

alter table public.consent_events enable row level security;

drop policy if exists consent_events_tenant_select on public.consent_events;
drop policy if exists consent_events_tenant_insert on public.consent_events;
drop policy if exists consent_events_tenant_update on public.consent_events;
drop policy if exists consent_events_tenant_delete on public.consent_events;

create policy consent_events_tenant_select on public.consent_events
for select
to authenticated
using (empresa_id = public.current_empresa_id());

create policy consent_events_tenant_insert on public.consent_events
for insert
to authenticated
with check (empresa_id = public.current_empresa_id());

create policy consent_events_admin_update on public.consent_events
for update
to authenticated
using (empresa_id = public.current_empresa_id() and public.is_empresa_admin())
with check (empresa_id = public.current_empresa_id() and public.is_empresa_admin());

create policy consent_events_admin_delete on public.consent_events
for delete
to authenticated
using (empresa_id = public.current_empresa_id() and public.is_empresa_admin());

create or replace function public.purge_lgpd_retention(
  p_signup_days integer default 180,
  p_resolved_request_days integer default 730
)
returns table(deleted_signup_attempts bigint, deleted_privacy_requests bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_signup bigint := 0;
  v_privacy bigint := 0;
begin
  delete from public.signup_attempts
  where created_at < now() - make_interval(days => greatest(p_signup_days, 1));
  get diagnostics v_signup = row_count;

  delete from public.privacy_requests
  where status in ('concluido', 'negado')
    and created_at < now() - make_interval(days => greatest(p_resolved_request_days, 30));
  get diagnostics v_privacy = row_count;

  return query select v_signup, v_privacy;
end;
$$;
