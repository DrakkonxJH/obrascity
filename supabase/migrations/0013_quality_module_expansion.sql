alter table public.nao_conformidades
  add column if not exists resolvido_em timestamptz,
  add column if not exists fechado_em timestamptz,
  add column if not exists reaberturas integer not null default 0;

alter table public.qualidade_checklists
  add column if not exists status text not null default 'pendente',
  add column if not exists responsavel_id uuid references public.profiles(id) on delete set null,
  add column if not exists inspecionado_em timestamptz;

update public.qualidade_checklists
set status = case
  when conforme = true then 'conforme'
  else 'pendente'
end
where status is null or btrim(status) = '';

create table if not exists public.qualidade_planos_acao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nao_conformidade_id uuid not null references public.nao_conformidades(id) on delete cascade,
  titulo text not null,
  descricao text,
  responsavel_id uuid references public.profiles(id) on delete set null,
  prazo date,
  status text not null default 'pendente',
  concluido_em timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.qualidade_evidencias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nao_conformidade_id uuid not null references public.nao_conformidades(id) on delete cascade,
  url text not null,
  descricao text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_nc_empresa_status_severidade
  on public.nao_conformidades (empresa_id, status, severidade, prazo);
create index if not exists idx_qc_empresa_status
  on public.qualidade_checklists (empresa_id, status, created_at desc);
create index if not exists idx_qpa_empresa_status
  on public.qualidade_planos_acao (empresa_id, status, prazo);
create index if not exists idx_qev_empresa_nc
  on public.qualidade_evidencias (empresa_id, nao_conformidade_id, created_at desc);

alter table public.qualidade_planos_acao enable row level security;
alter table public.qualidade_evidencias enable row level security;

create policy qualidade_planos_acao_tenant_select on public.qualidade_planos_acao
for select using (empresa_id = public.current_empresa_id());
create policy qualidade_planos_acao_tenant_insert on public.qualidade_planos_acao
for insert with check (empresa_id = public.current_empresa_id());
create policy qualidade_planos_acao_tenant_update on public.qualidade_planos_acao
for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id());
create policy qualidade_planos_acao_tenant_delete on public.qualidade_planos_acao
for delete using (empresa_id = public.current_empresa_id());

create policy qualidade_evidencias_tenant_select on public.qualidade_evidencias
for select using (empresa_id = public.current_empresa_id());
create policy qualidade_evidencias_tenant_insert on public.qualidade_evidencias
for insert with check (empresa_id = public.current_empresa_id());
create policy qualidade_evidencias_tenant_update on public.qualidade_evidencias
for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id());
create policy qualidade_evidencias_tenant_delete on public.qualidade_evidencias
for delete using (empresa_id = public.current_empresa_id());
