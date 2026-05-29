create table if not exists public.crm_companies (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  segmento text not null default '',
  site text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_companies_empresa_nome_unique unique (empresa_id, nome)
);

create index if not exists idx_crm_companies_empresa_nome on public.crm_companies(empresa_id, nome);

create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  company_id uuid null references public.crm_companies(id) on delete set null,
  nome text not null,
  email text not null default '',
  telefone text not null default '',
  cargo text not null default '',
  origem text not null default '',
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_contacts_empresa_email_unique unique (empresa_id, email)
);

create index if not exists idx_crm_contacts_empresa_nome on public.crm_contacts(empresa_id, nome);
create index if not exists idx_crm_contacts_empresa_company on public.crm_contacts(empresa_id, company_id);

create table if not exists public.crm_deals (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  company_id uuid null references public.crm_companies(id) on delete set null,
  contact_id uuid null references public.crm_contacts(id) on delete set null,
  obra_id uuid null references public.obras(id) on delete set null,
  owner_profile_id uuid null references public.profiles(id) on delete set null,
  nome text not null,
  descricao text not null default '',
  stage text not null default 'novos',
  status text not null default 'aberto',
  priority text not null default 'media',
  source text not null default 'manual',
  valor numeric(14,2) not null default 0,
  probability integer not null default 0,
  tags text[] not null default '{}'::text[],
  last_activity_at timestamptz null,
  next_activity_at timestamptz null,
  expected_close_at date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_deals_stage_check check (stage in ('novos', 'qualificacao', 'proposta', 'negociacao', 'ganho', 'perdido')),
  constraint crm_deals_status_check check (status in ('aberto', 'ganho', 'perdido')),
  constraint crm_deals_priority_check check (priority in ('alta', 'media', 'baixa')),
  constraint crm_deals_probability_check check (probability >= 0 and probability <= 100)
);

create index if not exists idx_crm_deals_empresa_stage on public.crm_deals(empresa_id, stage);
create index if not exists idx_crm_deals_empresa_status on public.crm_deals(empresa_id, status);
create index if not exists idx_crm_deals_empresa_next_activity on public.crm_deals(empresa_id, next_activity_at);
create index if not exists idx_crm_deals_empresa_updated_at on public.crm_deals(empresa_id, updated_at desc);
create index if not exists idx_crm_deals_empresa_owner on public.crm_deals(empresa_id, owner_profile_id);
create index if not exists idx_crm_deals_tags_gin on public.crm_deals using gin (tags);

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  deal_id uuid not null references public.crm_deals(id) on delete cascade,
  type text not null default 'follow_up',
  subject text not null,
  body text not null default '',
  channel text not null default 'manual',
  due_at timestamptz null,
  completed_at timestamptz null,
  done boolean not null default false,
  created_by_profile_id uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_activities_type_check check (type in ('follow_up', 'call', 'email', 'meeting', 'proposal', 'note', 'task')),
  constraint crm_activities_channel_check check (channel in ('manual', 'whatsapp', 'email', 'call', 'meeting', 'reuniao'))
);

create index if not exists idx_crm_activities_empresa_deal on public.crm_activities(empresa_id, deal_id, done, due_at);
create index if not exists idx_crm_activities_empresa_done_created on public.crm_activities(empresa_id, done, created_at desc);

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
with check (empresa_id = public.current_empresa_id());

create policy crm_companies_tenant_update on public.crm_companies
for update to authenticated
using (empresa_id = public.current_empresa_id())
with check (empresa_id = public.current_empresa_id());

create policy crm_companies_tenant_delete on public.crm_companies
for delete to authenticated
using (empresa_id = public.current_empresa_id());

create policy crm_contacts_tenant_select on public.crm_contacts
for select to authenticated
using (empresa_id = public.current_empresa_id());

create policy crm_contacts_tenant_insert on public.crm_contacts
for insert to authenticated
with check (empresa_id = public.current_empresa_id());

create policy crm_contacts_tenant_update on public.crm_contacts
for update to authenticated
using (empresa_id = public.current_empresa_id())
with check (empresa_id = public.current_empresa_id());

create policy crm_contacts_tenant_delete on public.crm_contacts
for delete to authenticated
using (empresa_id = public.current_empresa_id());

create policy crm_deals_tenant_select on public.crm_deals
for select to authenticated
using (empresa_id = public.current_empresa_id());

create policy crm_deals_tenant_insert on public.crm_deals
for insert to authenticated
with check (empresa_id = public.current_empresa_id());

create policy crm_deals_tenant_update on public.crm_deals
for update to authenticated
using (empresa_id = public.current_empresa_id())
with check (empresa_id = public.current_empresa_id());

create policy crm_deals_tenant_delete on public.crm_deals
for delete to authenticated
using (empresa_id = public.current_empresa_id());

create policy crm_activities_tenant_select on public.crm_activities
for select to authenticated
using (empresa_id = public.current_empresa_id());

create policy crm_activities_tenant_insert on public.crm_activities
for insert to authenticated
with check (empresa_id = public.current_empresa_id());

create policy crm_activities_tenant_update on public.crm_activities
for update to authenticated
using (empresa_id = public.current_empresa_id())
with check (empresa_id = public.current_empresa_id());

create policy crm_activities_tenant_delete on public.crm_activities
for delete to authenticated
using (empresa_id = public.current_empresa_id());
