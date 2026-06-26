create table if not exists public.crm_custom_tabs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.empresas(id) on delete cascade,
  workspace_id uuid references public.crm_workspaces(id) on delete cascade,
  name text not null,
  description text,
  color text default '#3B82F6',
  icon text,
  filter_etapa text[],
  filter_prioridade text[],
  filter_origem text[],
  filter_owner_id uuid[],
  filter_search text,
  sort_order int default 0,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, workspace_id, name)
);

alter table public.crm_custom_tabs enable row level security;

drop policy if exists crm_custom_tabs_tenant_select on public.crm_custom_tabs;
drop policy if exists crm_custom_tabs_tenant_insert on public.crm_custom_tabs;
drop policy if exists crm_custom_tabs_tenant_update on public.crm_custom_tabs;
drop policy if exists crm_custom_tabs_tenant_delete on public.crm_custom_tabs;

create policy crm_custom_tabs_tenant_select
on public.crm_custom_tabs for select
using (company_id = public.current_empresa_id());

create policy crm_custom_tabs_tenant_insert
on public.crm_custom_tabs for insert
with check (company_id = public.current_empresa_id());

create policy crm_custom_tabs_tenant_update
on public.crm_custom_tabs for update
using (company_id = public.current_empresa_id())
with check (company_id = public.current_empresa_id());

create policy crm_custom_tabs_tenant_delete
on public.crm_custom_tabs for delete
using (company_id = public.current_empresa_id());

create index if not exists idx_crm_custom_tabs_company_id on public.crm_custom_tabs(company_id);
create index if not exists idx_crm_custom_tabs_workspace_id on public.crm_custom_tabs(workspace_id);
