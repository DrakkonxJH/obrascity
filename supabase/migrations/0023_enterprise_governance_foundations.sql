create or replace function public.jsonb_diff(old_data jsonb, new_data jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(
    jsonb_object_agg(
      key,
      jsonb_build_object(
        'old', old_data -> key,
        'new', new_data -> key
      )
    ),
    '{}'::jsonb
  )
  from (
    select key from jsonb_object_keys(coalesce(old_data, '{}'::jsonb))
    union
    select key from jsonb_object_keys(coalesce(new_data, '{}'::jsonb))
  ) keys
  where (old_data -> key) is distinct from (new_data -> key);
$$;

create or replace function public.audit_changes()
returns trigger
language plpgsql
security definer
as $$
declare
  target_empresa_id uuid;
  old_payload jsonb;
  new_payload jsonb;
begin
  target_empresa_id := coalesce(new.empresa_id, old.empresa_id);
  old_payload := to_jsonb(old);
  new_payload := to_jsonb(new);

  insert into public.audit_logs (
    empresa_id,
    actor_id,
    acao,
    entidade,
    entidade_id,
    metadata
  )
  values (
    target_empresa_id,
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    jsonb_build_object(
      'old', old_payload,
      'new', new_payload,
      'diff', public.jsonb_diff(old_payload, new_payload),
      'at', now()
    )
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$$;

drop policy if exists audit_logs_tenant_update on public.audit_logs;
drop policy if exists audit_logs_tenant_delete on public.audit_logs;

create table if not exists public.tenant_retention_policies (
  empresa_id uuid primary key references public.empresas(id) on delete cascade,
  audit_retention_days integer not null default 365,
  report_retention_days integer not null default 365,
  log_retention_days integer not null default 180,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tenant_retention_policies enable row level security;

create policy tenant_retention_policies_tenant_select on public.tenant_retention_policies
for select using (empresa_id = public.current_empresa_id());

create policy tenant_retention_policies_tenant_insert on public.tenant_retention_policies
for insert with check (empresa_id = public.current_empresa_id());

create policy tenant_retention_policies_tenant_update on public.tenant_retention_policies
for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id());

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  entity_ref text,
  amount numeric(14,2) not null default 0,
  requester_id uuid references public.profiles(id) on delete set null,
  requester_role text not null,
  required_role text not null,
  status text not null default 'pending',
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists approval_requests_empresa_status_idx
  on public.approval_requests (empresa_id, status, created_at desc);

create index if not exists approval_requests_entity_idx
  on public.approval_requests (empresa_id, entity_type, entity_id);

alter table public.approval_requests enable row level security;

create policy approval_requests_tenant_select on public.approval_requests
for select using (empresa_id = public.current_empresa_id());

create policy approval_requests_tenant_insert on public.approval_requests
for insert with check (empresa_id = public.current_empresa_id());

create policy approval_requests_tenant_update on public.approval_requests
for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id());
