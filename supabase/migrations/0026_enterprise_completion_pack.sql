create table if not exists public.cotacoes_rodadas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  cotacao_id uuid not null references public.cotacoes_compra(id) on delete cascade,
  numero integer not null,
  objetivo text not null,
  observacoes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (empresa_id, cotacao_id, numero)
);

create table if not exists public.contratos_fornecedores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  cotacao_id uuid not null references public.cotacoes_compra(id) on delete cascade,
  fornecedor_id uuid references public.cotacoes_fornecedores(id) on delete set null,
  status text not null default 'rascunho',
  valor_total numeric(14,2) not null default 0,
  prazo_dias integer not null default 0,
  condicoes text,
  assinado_em timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.equipe_alocacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  equipe_id uuid not null references public.equipes(id) on delete cascade,
  frente text not null,
  turno text not null default 'diurno',
  data_inicio date not null,
  data_fim date not null,
  capacidade_planejada integer not null default 0,
  alocados integer not null default 0,
  status text not null default 'planejada',
  observacoes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.financeiro_titulos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  tipo text not null,
  centro_custo text not null,
  descricao text not null,
  valor numeric(14,2) not null default 0,
  valor_liquidado numeric(14,2) not null default 0,
  status text not null default 'previsto',
  vencimento date not null,
  liquidado_em timestamptz,
  conciliado boolean not null default false,
  solicitado_por uuid references public.profiles(id) on delete set null,
  aprovado_por uuid references public.profiles(id) on delete set null,
  aprovado_em timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists cotacoes_rodadas_empresa_cotacao_idx on public.cotacoes_rodadas (empresa_id, cotacao_id, numero);
create index if not exists contratos_fornecedores_empresa_obra_idx on public.contratos_fornecedores (empresa_id, obra_id, created_at desc);
create index if not exists equipe_alocacoes_empresa_obra_idx on public.equipe_alocacoes (empresa_id, obra_id, data_inicio);
create index if not exists equipe_alocacoes_empresa_equipe_idx on public.equipe_alocacoes (empresa_id, equipe_id, data_inicio);
create index if not exists financeiro_titulos_empresa_tipo_vencimento_idx on public.financeiro_titulos (empresa_id, tipo, vencimento);
create index if not exists financeiro_titulos_empresa_status_idx on public.financeiro_titulos (empresa_id, status, created_at desc);

alter table public.cotacoes_rodadas enable row level security;
alter table public.contratos_fornecedores enable row level security;
alter table public.equipe_alocacoes enable row level security;
alter table public.financeiro_titulos enable row level security;

do $$
declare
  tbl text;
  tables text[] := array[
    'cotacoes_rodadas',
    'contratos_fornecedores',
    'equipe_alocacoes',
    'financeiro_titulos'
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
