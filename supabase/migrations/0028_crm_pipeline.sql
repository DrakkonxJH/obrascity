create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  contato text not null default '',
  cargo text not null default '',
  email text not null default '',
  telefone text not null default '',
  valor numeric(14,2) not null default 0,
  etapa text not null default 'Contato',
  origem text not null default 'Manual',
  obra text not null default '',
  prioridade text not null default 'Média',
  ultima_atividade date not null default current_date,
  notas text not null default '',
  created_by uuid null references auth.users(id) on delete set null,
  updated_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_leads_etapa_check check (etapa in ('Contato', 'Qualificação', 'Proposta', 'Negociação', 'Fechado', 'Perdido')),
  constraint crm_leads_prioridade_check check (prioridade in ('Alta', 'Média', 'Baixa'))
);

create index if not exists idx_crm_leads_empresa_etapa on public.crm_leads(empresa_id, etapa);
create index if not exists idx_crm_leads_empresa_updated_at on public.crm_leads(empresa_id, updated_at desc);
create index if not exists idx_crm_leads_empresa_nome on public.crm_leads(empresa_id, nome);

alter table public.crm_leads enable row level security;

drop policy if exists crm_leads_tenant_select on public.crm_leads;
drop policy if exists crm_leads_tenant_insert on public.crm_leads;
drop policy if exists crm_leads_tenant_update on public.crm_leads;
drop policy if exists crm_leads_tenant_delete on public.crm_leads;

create policy crm_leads_tenant_select
on public.crm_leads
for select
using (empresa_id = public.current_empresa_id());

create policy crm_leads_tenant_insert
on public.crm_leads
for insert
with check (empresa_id = public.current_empresa_id());

create policy crm_leads_tenant_update
on public.crm_leads
for update
using (empresa_id = public.current_empresa_id())
with check (empresa_id = public.current_empresa_id());

create policy crm_leads_tenant_delete
on public.crm_leads
for delete
using (empresa_id = public.current_empresa_id());
