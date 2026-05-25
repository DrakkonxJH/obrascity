alter table public.relatorios
  add column if not exists storage_bucket text,
  add column if not exists storage_path text,
  add column if not exists error_message text;

create table if not exists public.relatorio_execucoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  relatorio_id uuid not null references public.relatorios(id) on delete cascade,
  status text not null,
  erro text,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists relatorio_execucoes_relatorio_idx
  on public.relatorio_execucoes (empresa_id, relatorio_id, started_at desc);

alter table public.relatorio_execucoes enable row level security;

create policy relatorio_execucoes_tenant_select on public.relatorio_execucoes
for select using (empresa_id = public.current_empresa_id());

create policy relatorio_execucoes_tenant_insert on public.relatorio_execucoes
for insert with check (empresa_id = public.current_empresa_id());

create policy relatorio_execucoes_tenant_update on public.relatorio_execucoes
for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id());

alter table public.portal_shares
  add column if not exists obra_ids uuid[] not null default '{}';

create table if not exists public.diario_evidencias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  diario_id uuid not null references public.diario_obra(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  arquivo_url text not null,
  arquivo_path text,
  mime_type text,
  size_bytes bigint,
  descricao text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists diario_evidencias_diario_idx
  on public.diario_evidencias (empresa_id, diario_id, created_at desc);

alter table public.diario_evidencias enable row level security;

create policy diario_evidencias_tenant_select on public.diario_evidencias
for select using (empresa_id = public.current_empresa_id());

create policy diario_evidencias_tenant_insert on public.diario_evidencias
for insert with check (empresa_id = public.current_empresa_id());

create policy diario_evidencias_tenant_update on public.diario_evidencias
for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id());

create table if not exists public.tenant_observability_events (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas(id) on delete cascade,
  source text not null,
  event_type text not null,
  severity text not null default 'info',
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tenant_observability_events_idx
  on public.tenant_observability_events (empresa_id, created_at desc);

alter table public.tenant_observability_events enable row level security;

create policy tenant_observability_events_tenant_select on public.tenant_observability_events
for select using (empresa_id = public.current_empresa_id() or empresa_id is null);

create policy tenant_observability_events_tenant_insert on public.tenant_observability_events
for insert with check (empresa_id = public.current_empresa_id() or empresa_id is null);

insert into storage.buckets (id, name, public)
values ('reports-artifacts', 'reports-artifacts', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('diario-evidencias', 'diario-evidencias', false)
on conflict (id) do nothing;
