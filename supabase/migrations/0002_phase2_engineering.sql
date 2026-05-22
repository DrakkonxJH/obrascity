create table if not exists public.cronograma_dependencias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  tarefa_predecessora_id uuid not null references public.obras_tarefas(id) on delete cascade,
  tarefa_sucessora_id uuid not null references public.obras_tarefas(id) on delete cascade,
  tipo text not null default 'finish_to_start',
  created_at timestamptz not null default now(),
  constraint cronograma_dependencias_unique unique (empresa_id, tarefa_predecessora_id, tarefa_sucessora_id),
  constraint cronograma_dependencias_diff check (tarefa_predecessora_id <> tarefa_sucessora_id)
);

create table if not exists public.cronograma_baselines (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  tarefa_id uuid not null references public.obras_tarefas(id) on delete cascade,
  baseline_inicio date not null,
  baseline_fim date not null,
  versao integer not null default 1,
  created_at timestamptz not null default now()
);

alter table public.diario_obra
  add column if not exists equipamentos text,
  add column if not exists observacoes_ssma text;

alter table public.nao_conformidades
  add column if not exists responsavel_id uuid references public.profiles(id),
  add column if not exists severidade text not null default 'media',
  add column if not exists resolucao text;

alter table public.medicoes
  add column if not exists retencao numeric(14,2) not null default 0,
  add column if not exists aditivo numeric(14,2) not null default 0,
  add column if not exists aprovado_em timestamptz;

create table if not exists public.qualidade_checklists (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  norma text not null,
  item text not null,
  conforme boolean not null default true,
  observacao text,
  created_at timestamptz not null default now()
);

alter table public.cronograma_dependencias enable row level security;
alter table public.cronograma_baselines enable row level security;
alter table public.qualidade_checklists enable row level security;

create policy cronograma_dependencias_tenant_select on public.cronograma_dependencias
for select using (empresa_id = public.current_empresa_id());
create policy cronograma_dependencias_tenant_insert on public.cronograma_dependencias
for insert with check (empresa_id = public.current_empresa_id());
create policy cronograma_dependencias_tenant_update on public.cronograma_dependencias
for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id());
create policy cronograma_dependencias_tenant_delete on public.cronograma_dependencias
for delete using (empresa_id = public.current_empresa_id());

create policy cronograma_baselines_tenant_select on public.cronograma_baselines
for select using (empresa_id = public.current_empresa_id());
create policy cronograma_baselines_tenant_insert on public.cronograma_baselines
for insert with check (empresa_id = public.current_empresa_id());
create policy cronograma_baselines_tenant_update on public.cronograma_baselines
for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id());
create policy cronograma_baselines_tenant_delete on public.cronograma_baselines
for delete using (empresa_id = public.current_empresa_id());

create policy qualidade_checklists_tenant_select on public.qualidade_checklists
for select using (empresa_id = public.current_empresa_id());
create policy qualidade_checklists_tenant_insert on public.qualidade_checklists
for insert with check (empresa_id = public.current_empresa_id());
create policy qualidade_checklists_tenant_update on public.qualidade_checklists
for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id());
create policy qualidade_checklists_tenant_delete on public.qualidade_checklists
for delete using (empresa_id = public.current_empresa_id());

create trigger diario_obra_audit_trigger
after insert or update or delete on public.diario_obra
for each row execute function public.audit_changes();

create trigger medicoes_audit_trigger
after insert or update or delete on public.medicoes
for each row execute function public.audit_changes();

create trigger nao_conformidades_audit_trigger
after insert or update or delete on public.nao_conformidades
for each row execute function public.audit_changes();
