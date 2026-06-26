create table if not exists public.crm_workspaces (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.empresas(id) on delete cascade,
  name text not null,
  description text,
  color text default '#3B82F6',
  icon text,
  sort_order int default 0,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, name)
);

alter table public.crm_deals
  add column if not exists workspace_id uuid references public.crm_workspaces(id) on delete set null;

alter table public.crm_workspaces enable row level security;

drop policy if exists crm_workspaces_tenant_select on public.crm_workspaces;
drop policy if exists crm_workspaces_tenant_insert on public.crm_workspaces;
drop policy if exists crm_workspaces_tenant_update on public.crm_workspaces;
drop policy if exists crm_workspaces_tenant_delete on public.crm_workspaces;

create policy crm_workspaces_tenant_select
on public.crm_workspaces for select
using (company_id = public.current_empresa_id());

create policy crm_workspaces_tenant_insert
on public.crm_workspaces for insert
with check (company_id = public.current_empresa_id());

create policy crm_workspaces_tenant_update
on public.crm_workspaces for update
using (company_id = public.current_empresa_id())
with check (company_id = public.current_empresa_id());

create policy crm_workspaces_tenant_delete
on public.crm_workspaces for delete
using (company_id = public.current_empresa_id());

create index if not exists idx_crm_workspaces_company_id on public.crm_workspaces(company_id);
create index if not exists idx_crm_deals_workspace_id on public.crm_deals(workspace_id);
