create extension if not exists "pgcrypto";

create type public.role_type as enum ('administrador', 'gestor', 'engenheiro', 'tecnico', 'visualizador');
create type public.obra_status as enum ('planejamento', 'andamento', 'atencao', 'concluida');
create type public.ticket_status as enum ('aberto', 'em_analise', 'concluido', 'negado');

create or replace function public.current_empresa_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'empresa_id', '')::uuid
$$;

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  plano text not null default 'starter',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete restrict,
  nome text not null,
  email text not null unique,
  cargo text,
  role public.role_type not null default 'visualizador',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.equipes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  especialidade text,
  created_at timestamptz not null default now()
);

create table if not exists public.membros (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  equipe_id uuid references public.equipes(id) on delete set null,
  cargo text,
  crea text,
  created_at timestamptz not null default now()
);

create table if not exists public.obras (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  cliente text not null,
  status public.obra_status not null default 'planejamento',
  progresso integer not null default 0 check (progresso between 0 and 100),
  lat numeric,
  lng numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.obras_tarefas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  nome text not null,
  inicio date not null,
  fim date not null,
  status text not null default 'planejado',
  created_at timestamptz not null default now()
);

create table if not exists public.obras_financeiro (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  categoria text not null,
  orcado numeric(14,2) not null default 0,
  realizado numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.materiais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  unidade text not null,
  quantidade numeric(14,2) not null default 0,
  minimo numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.pedidos_compra (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  material_id uuid not null references public.materiais(id) on delete restrict,
  obra_id uuid not null references public.obras(id) on delete restrict,
  status text not null default 'pendente',
  valor numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.atividades (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid references public.obras(id) on delete cascade,
  tipo text not null,
  descricao text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  titulo text not null,
  lida boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

create table if not exists public.relatorios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid references public.obras(id) on delete set null,
  tipo text not null,
  url text,
  gerado_em timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.fotos_obra (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  url text not null,
  descricao text,
  created_at timestamptz not null default now()
);

create table if not exists public.diario_obra (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  data_ref date not null,
  clima text,
  efetivo integer not null default 0,
  ocorrencias text,
  assinatura_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (empresa_id, obra_id, data_ref)
);

create table if not exists public.medicoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  referencia text not null,
  valor numeric(14,2) not null,
  status text not null default 'rascunho',
  aprovado_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.nao_conformidades (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  categoria text not null,
  descricao text not null,
  prazo date,
  status text not null default 'aberta',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  acao text not null,
  entidade text not null,
  entidade_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  titular_email text not null,
  tipo text not null,
  status public.ticket_status not null default 'aberto',
  observacao text,
  created_at timestamptz not null default now()
);

alter table public.empresas enable row level security;
alter table public.profiles enable row level security;
alter table public.equipes enable row level security;
alter table public.membros enable row level security;
alter table public.obras enable row level security;
alter table public.obras_tarefas enable row level security;
alter table public.obras_financeiro enable row level security;
alter table public.materiais enable row level security;
alter table public.pedidos_compra enable row level security;
alter table public.atividades enable row level security;
alter table public.notificacoes enable row level security;
alter table public.relatorios enable row level security;
alter table public.fotos_obra enable row level security;
alter table public.diario_obra enable row level security;
alter table public.medicoes enable row level security;
alter table public.nao_conformidades enable row level security;
alter table public.audit_logs enable row level security;
alter table public.privacy_requests enable row level security;

do $$
declare
  table_name text;
begin
  for table_name in
    select unnest(array[
      'profiles','equipes','membros','obras','obras_tarefas','obras_financeiro','materiais',
      'pedidos_compra','atividades','notificacoes','relatorios','fotos_obra','diario_obra',
      'medicoes','nao_conformidades','audit_logs','privacy_requests'
    ])
  loop
    execute format(
      'create policy %I_select on public.%I for select using (empresa_id = public.current_empresa_id())',
      table_name || '_tenant',
      table_name
    );
    execute format(
      'create policy %I_insert on public.%I for insert with check (empresa_id = public.current_empresa_id())',
      table_name || '_tenant',
      table_name
    );
    execute format(
      'create policy %I_update on public.%I for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id())',
      table_name || '_tenant',
      table_name
    );
    execute format(
      'create policy %I_delete on public.%I for delete using (empresa_id = public.current_empresa_id())',
      table_name || '_tenant',
      table_name
    );
  end loop;
end $$;

create policy empresas_tenant_select on public.empresas
for select using (id = public.current_empresa_id());

create policy empresas_tenant_update on public.empresas
for update
using (id = public.current_empresa_id())
with check (id = public.current_empresa_id());

create or replace function public.audit_changes()
returns trigger
language plpgsql
security definer
as $$
declare
  target_empresa_id uuid;
begin
  target_empresa_id := coalesce(new.empresa_id, old.empresa_id);

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
      'old', to_jsonb(old),
      'new', to_jsonb(new),
      'at', now()
    )
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$$;

create trigger obras_audit_trigger
after insert or update or delete on public.obras
for each row execute function public.audit_changes();

create trigger obras_financeiro_audit_trigger
after insert or update or delete on public.obras_financeiro
for each row execute function public.audit_changes();

create trigger pedidos_compra_audit_trigger
after insert or update or delete on public.pedidos_compra
for each row execute function public.audit_changes();
