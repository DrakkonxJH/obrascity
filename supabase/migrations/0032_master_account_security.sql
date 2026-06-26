alter table public.empresas
  add column if not exists is_master boolean not null default false;

create index if not exists idx_empresas_is_master on public.empresas(is_master);

alter table public.crm_workspaces enable row level security;

drop policy if exists crm_workspaces_tenant_select on public.crm_workspaces;

create policy crm_workspaces_tenant_select
on public.crm_workspaces for select
using (
  company_id = public.current_empresa_id()
  and (
    not exists (
      select 1
      from public.empresas e
      where e.id = public.crm_workspaces.company_id
        and e.is_master = true
    )
    or company_id = public.current_empresa_id()
  )
);
