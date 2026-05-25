create table if not exists public.viabilidade_estudos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  status_tecnico text not null default 'pendente',
  status_legal text not null default 'pendente',
  status_economico text not null default 'pendente',
  parecer text,
  riscos jsonb not null default '[]'::jsonb,
  go_no_go text not null default 'pendente',
  aprovado_por uuid references public.profiles(id) on delete set null,
  aprovado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, obra_id)
);

create table if not exists public.projetos_documentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  disciplina text not null,
  revisao text not null,
  status text not null default 'em_revisao',
  arquivo_url text,
  observacoes text,
  aprovado_por uuid references public.profiles(id) on delete set null,
  aprovado_em timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projetos_conflitos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  projeto_id uuid references public.projetos_documentos(id) on delete set null,
  titulo text not null,
  descricao text not null,
  severidade text not null default 'media',
  status text not null default 'aberto',
  responsavel_id uuid references public.profiles(id) on delete set null,
  prazo date,
  resolvido_em timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.cronograma_replanejamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  motivo text not null,
  impacto_prazo_dias integer not null default 0,
  impacto_custo numeric(14,2) not null default 0,
  status text not null default 'pendente',
  solicitado_por uuid references public.profiles(id) on delete set null,
  aprovado_por uuid references public.profiles(id) on delete set null,
  aprovado_em timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.cotacoes_compra (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  material_id uuid references public.materiais(id) on delete set null,
  titulo text not null,
  status text not null default 'aberta',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.cotacoes_fornecedores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  cotacao_id uuid not null references public.cotacoes_compra(id) on delete cascade,
  fornecedor text not null,
  valor_unitario numeric(14,2) not null default 0,
  quantidade numeric(14,2) not null default 0,
  prazo_dias integer not null default 0,
  condicoes text,
  selecionado boolean not null default false,
  aprovado boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.change_requests (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  tipo text not null,
  titulo text not null,
  descricao text not null,
  impacto_prazo_dias integer not null default 0,
  impacto_custo numeric(14,2) not null default 0,
  status text not null default 'pendente',
  solicitado_por uuid references public.profiles(id) on delete set null,
  aprovado_por uuid references public.profiles(id) on delete set null,
  aprovado_em timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.comissionamento_itens (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  sistema text not null,
  ambiente text not null,
  item text not null,
  status text not null default 'pendente',
  responsavel_id uuid references public.profiles(id) on delete set null,
  evidencia_url text,
  observacao text,
  testado_em timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.entregas_obra (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  status text not null default 'preparacao',
  termo_url text,
  chaves_entregues boolean not null default false,
  data_entrega timestamptz,
  aceite_cliente_nome text,
  aceite_cliente_doc text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, obra_id)
);

create table if not exists public.garantia_chamados (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  unidade text,
  sistema text not null,
  titulo text not null,
  descricao text not null,
  criticidade text not null default 'media',
  status text not null default 'aberto',
  sla_horas integer not null default 24,
  aberto_por uuid references public.profiles(id) on delete set null,
  responsavel_id uuid references public.profiles(id) on delete set null,
  prazo_resposta_em timestamptz,
  prazo_solucao_em timestamptz,
  resolvido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.garantia_interacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  chamado_id uuid not null references public.garantia_chamados(id) on delete cascade,
  autor_id uuid references public.profiles(id) on delete set null,
  tipo text not null default 'comentario',
  mensagem text not null,
  anexo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_security_policies (
  empresa_id uuid primary key references public.empresas(id) on delete cascade,
  mfa_required_roles text[] not null default '{}'::text[],
  sso_enabled boolean not null default false,
  sso_provider text,
  sso_entrypoint text,
  sso_certificate text,
  session_timeout_minutes integer not null default 43200,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_auth_sessions (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  device_label text,
  ip_hash text,
  user_agent text,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.mobile_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pendente',
  direction text not null default 'upload',
  pendentes_criar integer not null default 0,
  pendentes_atualizar integer not null default 0,
  pendentes_deletar integer not null default 0,
  conflitos integer not null default 0,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mobile_sync_conflicts (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  sync_job_id uuid not null references public.mobile_sync_jobs(id) on delete cascade,
  entidade text not null,
  entidade_id uuid,
  campo text not null,
  valor_local text,
  valor_remoto text,
  resolucao text,
  status text not null default 'aberto',
  resolvido_por uuid references public.profiles(id) on delete set null,
  resolvido_em timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists viabilidade_estudos_empresa_obra_idx on public.viabilidade_estudos (empresa_id, obra_id);
create index if not exists projetos_documentos_empresa_obra_idx on public.projetos_documentos (empresa_id, obra_id, created_at desc);
create index if not exists projetos_conflitos_empresa_status_idx on public.projetos_conflitos (empresa_id, status, created_at desc);
create index if not exists cronograma_replanejamentos_empresa_obra_idx on public.cronograma_replanejamentos (empresa_id, obra_id, created_at desc);
create index if not exists cotacoes_compra_empresa_obra_idx on public.cotacoes_compra (empresa_id, obra_id, created_at desc);
create index if not exists cotacoes_fornecedores_cotacao_idx on public.cotacoes_fornecedores (empresa_id, cotacao_id, created_at desc);
create index if not exists change_requests_empresa_status_idx on public.change_requests (empresa_id, status, created_at desc);
create index if not exists comissionamento_itens_empresa_obra_idx on public.comissionamento_itens (empresa_id, obra_id, sistema, created_at desc);
create index if not exists garantia_chamados_empresa_status_idx on public.garantia_chamados (empresa_id, status, created_at desc);
create index if not exists garantia_interacoes_chamado_idx on public.garantia_interacoes (empresa_id, chamado_id, created_at desc);
create index if not exists tenant_auth_sessions_empresa_profile_idx on public.tenant_auth_sessions (empresa_id, profile_id, last_seen_at desc);
create index if not exists mobile_sync_jobs_empresa_obra_idx on public.mobile_sync_jobs (empresa_id, obra_id, created_at desc);
create index if not exists mobile_sync_conflicts_empresa_status_idx on public.mobile_sync_conflicts (empresa_id, status, created_at desc);

alter table public.viabilidade_estudos enable row level security;
alter table public.projetos_documentos enable row level security;
alter table public.projetos_conflitos enable row level security;
alter table public.cronograma_replanejamentos enable row level security;
alter table public.cotacoes_compra enable row level security;
alter table public.cotacoes_fornecedores enable row level security;
alter table public.change_requests enable row level security;
alter table public.comissionamento_itens enable row level security;
alter table public.entregas_obra enable row level security;
alter table public.garantia_chamados enable row level security;
alter table public.garantia_interacoes enable row level security;
alter table public.tenant_security_policies enable row level security;
alter table public.tenant_auth_sessions enable row level security;
alter table public.mobile_sync_jobs enable row level security;
alter table public.mobile_sync_conflicts enable row level security;

do $$
declare
  tbl text;
  tables text[] := array[
    'viabilidade_estudos',
    'projetos_documentos',
    'projetos_conflitos',
    'cronograma_replanejamentos',
    'cotacoes_compra',
    'cotacoes_fornecedores',
    'change_requests',
    'comissionamento_itens',
    'entregas_obra',
    'garantia_chamados',
    'garantia_interacoes',
    'tenant_security_policies',
    'tenant_auth_sessions',
    'mobile_sync_jobs',
    'mobile_sync_conflicts'
  ];
begin
  foreach tbl in array tables loop
    execute format('drop policy if exists %I_tenant_select on public.%I', tbl, tbl);
    execute format('drop policy if exists %I_tenant_insert on public.%I', tbl, tbl);
    execute format('drop policy if exists %I_tenant_update on public.%I', tbl, tbl);
    execute format('drop policy if exists %I_tenant_delete on public.%I', tbl, tbl);

    execute format(
      'create policy %I_tenant_select on public.%I for select using (empresa_id = public.current_empresa_id())',
      tbl, tbl
    );
    execute format(
      'create policy %I_tenant_insert on public.%I for insert with check (empresa_id = public.current_empresa_id())',
      tbl, tbl
    );
    execute format(
      'create policy %I_tenant_update on public.%I for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id())',
      tbl, tbl
    );
    execute format(
      'create policy %I_tenant_delete on public.%I for delete using (empresa_id = public.current_empresa_id())',
      tbl, tbl
    );
  end loop;
end $$;
