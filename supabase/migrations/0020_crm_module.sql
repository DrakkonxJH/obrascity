create table if not exists public.crm_companies (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  segmento text,
  cidade text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_companies_empresa_created_idx
  on public.crm_companies (empresa_id, created_at desc);

create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  company_id uuid references public.crm_companies(id) on delete set null,
  nome text not null,
  email text,
  telefone text,
  cargo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_contacts_empresa_created_idx
  on public.crm_contacts (empresa_id, created_at desc);

create table if not exists public.crm_deals (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  company_id uuid references public.crm_companies(id) on delete set null,
  contact_id uuid references public.crm_contacts(id) on delete set null,
  obra_id uuid references public.obras(id) on delete set null,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  nome text not null,
  descricao text,
  stage text not null default 'novos',
  status text not null default 'aberto',
  priority text not null default 'media',
  valor numeric(14,2) not null default 0,
  tags text[] not null default '{}'::text[],
  last_activity_at timestamptz,
  next_activity_at timestamptz,
  won_at timestamptz,
  lost_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_deals_empresa_stage_idx
  on public.crm_deals (empresa_id, stage, created_at desc);

create index if not exists crm_deals_owner_idx
  on public.crm_deals (owner_profile_id, next_activity_at);

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  deal_id uuid not null references public.crm_deals(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  tipo text not null default 'follow_up',
  descricao text not null,
  due_at timestamptz,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists crm_activities_empresa_due_idx
  on public.crm_activities (empresa_id, due_at, done);

create index if not exists crm_activities_deal_created_idx
  on public.crm_activities (deal_id, created_at desc);

create or replace function public.crm_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists crm_companies_touch_updated_at on public.crm_companies;
create trigger crm_companies_touch_updated_at
before update on public.crm_companies
for each row execute function public.crm_touch_updated_at();

drop trigger if exists crm_contacts_touch_updated_at on public.crm_contacts;
create trigger crm_contacts_touch_updated_at
before update on public.crm_contacts
for each row execute function public.crm_touch_updated_at();

drop trigger if exists crm_deals_touch_updated_at on public.crm_deals;
create trigger crm_deals_touch_updated_at
before update on public.crm_deals
for each row execute function public.crm_touch_updated_at();

alter table public.crm_companies enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.crm_deals enable row level security;
alter table public.crm_activities enable row level security;

drop policy if exists crm_companies_tenant_select on public.crm_companies;
drop policy if exists crm_companies_tenant_insert on public.crm_companies;
drop policy if exists crm_companies_tenant_update on public.crm_companies;
drop policy if exists crm_companies_tenant_delete on public.crm_companies;

drop policy if exists crm_contacts_tenant_select on public.crm_contacts;
drop policy if exists crm_contacts_tenant_insert on public.crm_contacts;
drop policy if exists crm_contacts_tenant_update on public.crm_contacts;
drop policy if exists crm_contacts_tenant_delete on public.crm_contacts;

drop policy if exists crm_deals_tenant_select on public.crm_deals;
drop policy if exists crm_deals_tenant_insert on public.crm_deals;
drop policy if exists crm_deals_tenant_update on public.crm_deals;
drop policy if exists crm_deals_tenant_delete on public.crm_deals;

drop policy if exists crm_activities_tenant_select on public.crm_activities;
drop policy if exists crm_activities_tenant_insert on public.crm_activities;
drop policy if exists crm_activities_tenant_update on public.crm_activities;
drop policy if exists crm_activities_tenant_delete on public.crm_activities;

create policy crm_companies_tenant_select on public.crm_companies
for select to authenticated
using (empresa_id = public.current_empresa_id());

create policy crm_companies_tenant_insert on public.crm_companies
for insert to authenticated
with check (empresa_id = public.current_empresa_id() and public.is_empresa_admin());

create policy crm_companies_tenant_update on public.crm_companies
for update to authenticated
using (empresa_id = public.current_empresa_id() and public.is_empresa_admin())
with check (empresa_id = public.current_empresa_id() and public.is_empresa_admin());

create policy crm_companies_tenant_delete on public.crm_companies
for delete to authenticated
using (empresa_id = public.current_empresa_id() and public.is_empresa_admin());

create policy crm_contacts_tenant_select on public.crm_contacts
for select to authenticated
using (empresa_id = public.current_empresa_id());

create policy crm_contacts_tenant_insert on public.crm_contacts
for insert to authenticated
with check (empresa_id = public.current_empresa_id() and public.is_empresa_admin());

create policy crm_contacts_tenant_update on public.crm_contacts
for update to authenticated
using (empresa_id = public.current_empresa_id() and public.is_empresa_admin())
with check (empresa_id = public.current_empresa_id() and public.is_empresa_admin());

create policy crm_contacts_tenant_delete on public.crm_contacts
for delete to authenticated
using (empresa_id = public.current_empresa_id() and public.is_empresa_admin());

create policy crm_deals_tenant_select on public.crm_deals
for select to authenticated
using (empresa_id = public.current_empresa_id());

create policy crm_deals_tenant_insert on public.crm_deals
for insert to authenticated
with check (empresa_id = public.current_empresa_id() and public.is_empresa_admin());

create policy crm_deals_tenant_update on public.crm_deals
for update to authenticated
using (empresa_id = public.current_empresa_id() and public.is_empresa_admin())
with check (empresa_id = public.current_empresa_id() and public.is_empresa_admin());

create policy crm_deals_tenant_delete on public.crm_deals
for delete to authenticated
using (empresa_id = public.current_empresa_id() and public.is_empresa_admin());

create policy crm_activities_tenant_select on public.crm_activities
for select to authenticated
using (empresa_id = public.current_empresa_id());

create policy crm_activities_tenant_insert on public.crm_activities
for insert to authenticated
with check (empresa_id = public.current_empresa_id() and public.is_empresa_admin());

create policy crm_activities_tenant_update on public.crm_activities
for update to authenticated
using (empresa_id = public.current_empresa_id() and public.is_empresa_admin())
with check (empresa_id = public.current_empresa_id() and public.is_empresa_admin());

create policy crm_activities_tenant_delete on public.crm_activities
for delete to authenticated
using (empresa_id = public.current_empresa_id() and public.is_empresa_admin());

create trigger crm_deals_audit_trigger
after insert or update or delete on public.crm_deals
for each row execute function public.audit_changes();

