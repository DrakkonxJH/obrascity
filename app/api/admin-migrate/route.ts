import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

// ⚠️  ONE-TIME MIGRATION RUNNER — DELETE THIS FILE after use.
//
// OPTION A — Senha do banco PostgreSQL (recomendado):
//   curl -X POST https://planobras.vercel.app/api/admin-migrate \
//        -H "Content-Type: application/json" \
//        -d '{"dbPassword":"SUA_SENHA_DB","secret":"migrate-obras-2025"}'
//   Senha em: https://supabase.com/dashboard/project/dskcjkrgzwvsjdahfpgd/settings/database
//
// OPTION B — Supabase Personal Access Token:
//   curl -X POST https://planobras.vercel.app/api/admin-migrate \
//        -H "Content-Type: application/json" \
//        -d '{"pat":"sbp_TOKEN","secret":"migrate-obras-2025"}'
//   Gerar PAT em: https://supabase.com/dashboard/account/tokens

// Each statement runs individually so failures are reported per-statement.
const STATEMENTS = [
  // 0007 — add formato to relatorios
  `alter table public.relatorios add column if not exists formato text not null default 'pdf'`,

  // 0022 — create portal_shares table
  `create table if not exists public.portal_shares (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    token uuid not null default gen_random_uuid() unique,
    descricao text,
    expires_at timestamptz,
    active boolean not null default true,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
  )`,

  `alter table public.portal_shares enable row level security`,
  `drop policy if exists portal_shares_tenant_select on public.portal_shares`,
  `drop policy if exists portal_shares_tenant_insert on public.portal_shares`,
  `drop policy if exists portal_shares_tenant_update on public.portal_shares`,
  `drop policy if exists portal_shares_tenant_delete on public.portal_shares`,
  `create policy portal_shares_tenant_select on public.portal_shares for select using (empresa_id = public.current_empresa_id())`,
  `create policy portal_shares_tenant_insert on public.portal_shares for insert with check (empresa_id = public.current_empresa_id())`,
  `create policy portal_shares_tenant_update on public.portal_shares for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id())`,
  `create policy portal_shares_tenant_delete on public.portal_shares for delete using (empresa_id = public.current_empresa_id())`,
  `create index if not exists portal_shares_empresa_active_idx on public.portal_shares (empresa_id, active, created_at desc)`,

  // 0023 — jsonb_diff, audit_changes, tenant_retention_policies, approval_requests
  `create or replace function public.jsonb_diff(old_data jsonb, new_data jsonb)
  returns jsonb language sql immutable as $$
    select coalesce(
      jsonb_object_agg(key, jsonb_build_object('old', old_data -> key, 'new', new_data -> key)), '{}'::jsonb
    ) from (
      select key from jsonb_object_keys(coalesce(old_data,'{}')) union
      select key from jsonb_object_keys(coalesce(new_data,'{}'))
    ) k where (old_data->key) is distinct from (new_data->key)
  $$`,

  `create or replace function public.audit_changes()
  returns trigger language plpgsql security definer as $$
  declare
    target_empresa_id uuid; old_payload jsonb; new_payload jsonb;
  begin
    target_empresa_id := coalesce(new.empresa_id, old.empresa_id);
    old_payload := to_jsonb(old); new_payload := to_jsonb(new);
    insert into public.audit_logs (empresa_id,actor_id,acao,entidade,entidade_id,metadata)
    values (target_empresa_id, auth.uid(), tg_op, tg_table_name, coalesce(new.id,old.id),
      jsonb_build_object('old',old_payload,'new',new_payload,'diff',public.jsonb_diff(old_payload,new_payload),'at',now()));
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end $$`,

  `drop policy if exists audit_logs_tenant_update on public.audit_logs`,
  `drop policy if exists audit_logs_tenant_delete on public.audit_logs`,

  `create table if not exists public.tenant_retention_policies (
    empresa_id uuid primary key references public.empresas(id) on delete cascade,
    audit_retention_days integer not null default 365,
    report_retention_days integer not null default 365,
    log_retention_days integer not null default 180,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,

  `alter table public.tenant_retention_policies enable row level security`,
  `drop policy if exists tenant_retention_policies_tenant_select on public.tenant_retention_policies`,
  `drop policy if exists tenant_retention_policies_tenant_insert on public.tenant_retention_policies`,
  `drop policy if exists tenant_retention_policies_tenant_update on public.tenant_retention_policies`,
  `create policy tenant_retention_policies_tenant_select on public.tenant_retention_policies for select using (empresa_id = public.current_empresa_id())`,
  `create policy tenant_retention_policies_tenant_insert on public.tenant_retention_policies for insert with check (empresa_id = public.current_empresa_id())`,
  `create policy tenant_retention_policies_tenant_update on public.tenant_retention_policies for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id())`,

  `create table if not exists public.approval_requests (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    entity_type text not null, entity_id uuid not null, entity_ref text,
    amount numeric(14,2) not null default 0,
    requester_id uuid references public.profiles(id) on delete set null,
    requester_role text not null, required_role text not null,
    status text not null default 'pending',
    approved_by uuid references public.profiles(id) on delete set null,
    approved_at timestamptz, notes text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  )`,

  `create index if not exists approval_requests_empresa_status_idx on public.approval_requests (empresa_id, status, created_at desc)`,
  `create index if not exists approval_requests_entity_idx on public.approval_requests (empresa_id, entity_type, entity_id)`,
  `alter table public.approval_requests enable row level security`,
  `drop policy if exists approval_requests_tenant_select on public.approval_requests`,
  `drop policy if exists approval_requests_tenant_insert on public.approval_requests`,
  `drop policy if exists approval_requests_tenant_update on public.approval_requests`,
  `create policy approval_requests_tenant_select on public.approval_requests for select using (empresa_id = public.current_empresa_id())`,
  `create policy approval_requests_tenant_insert on public.approval_requests for insert with check (empresa_id = public.current_empresa_id())`,
  `create policy approval_requests_tenant_update on public.approval_requests for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id())`,

  // 0024 — relatorios additional columns, portal_shares.obra_ids, new tables, buckets
  `alter table public.relatorios add column if not exists status text not null default 'pendente'`,
  `alter table public.relatorios add column if not exists solicitado_por uuid references public.profiles(id)`,
  `alter table public.relatorios add column if not exists storage_bucket text`,
  `alter table public.relatorios add column if not exists storage_path text`,
  `alter table public.relatorios add column if not exists error_message text`,
  `alter table public.portal_shares add column if not exists obra_ids uuid[] not null default '{}'`,

  `create table if not exists public.relatorio_execucoes (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    relatorio_id uuid not null references public.relatorios(id) on delete cascade,
    status text not null, erro text,
    metadata jsonb not null default '{}'::jsonb,
    started_at timestamptz not null default now(),
    finished_at timestamptz
  )`,

  `create index if not exists relatorio_execucoes_relatorio_idx on public.relatorio_execucoes (empresa_id, relatorio_id, started_at desc)`,
  `alter table public.relatorio_execucoes enable row level security`,
  `drop policy if exists relatorio_execucoes_tenant_select on public.relatorio_execucoes`,
  `drop policy if exists relatorio_execucoes_tenant_insert on public.relatorio_execucoes`,
  `drop policy if exists relatorio_execucoes_tenant_update on public.relatorio_execucoes`,
  `create policy relatorio_execucoes_tenant_select on public.relatorio_execucoes for select using (empresa_id = public.current_empresa_id())`,
  `create policy relatorio_execucoes_tenant_insert on public.relatorio_execucoes for insert with check (empresa_id = public.current_empresa_id())`,
  `create policy relatorio_execucoes_tenant_update on public.relatorio_execucoes for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id())`,

  `create table if not exists public.diario_evidencias (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    diario_id uuid not null references public.diario_obra(id) on delete cascade,
    obra_id uuid not null references public.obras(id) on delete cascade,
    arquivo_url text not null, arquivo_path text, mime_type text, size_bytes bigint, descricao text,
    created_by uuid references public.profiles(id),
    created_at timestamptz not null default now()
  )`,

  `create index if not exists diario_evidencias_diario_idx on public.diario_evidencias (empresa_id, diario_id, created_at desc)`,
  `alter table public.diario_evidencias enable row level security`,
  `drop policy if exists diario_evidencias_tenant_select on public.diario_evidencias`,
  `drop policy if exists diario_evidencias_tenant_insert on public.diario_evidencias`,
  `drop policy if exists diario_evidencias_tenant_update on public.diario_evidencias`,
  `create policy diario_evidencias_tenant_select on public.diario_evidencias for select using (empresa_id = public.current_empresa_id())`,
  `create policy diario_evidencias_tenant_insert on public.diario_evidencias for insert with check (empresa_id = public.current_empresa_id())`,
  `create policy diario_evidencias_tenant_update on public.diario_evidencias for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id())`,

  `create table if not exists public.tenant_observability_events (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid references public.empresas(id) on delete cascade,
    source text not null, event_type text not null,
    severity text not null default 'info', message text not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  )`,

  `create index if not exists tenant_observability_events_idx on public.tenant_observability_events (empresa_id, created_at desc)`,
  `alter table public.tenant_observability_events enable row level security`,
  `drop policy if exists tenant_observability_events_tenant_select on public.tenant_observability_events`,
  `drop policy if exists tenant_observability_events_tenant_insert on public.tenant_observability_events`,
  `create policy tenant_observability_events_tenant_select on public.tenant_observability_events for select using (empresa_id = public.current_empresa_id() or empresa_id is null)`,
  `create policy tenant_observability_events_tenant_insert on public.tenant_observability_events for insert with check (empresa_id = public.current_empresa_id() or empresa_id is null)`,

  `insert into storage.buckets (id, name, public) values ('reports-artifacts','reports-artifacts',false) on conflict (id) do nothing`,
  `insert into storage.buckets (id, name, public) values ('diario-evidencias','diario-evidencias',false) on conflict (id) do nothing`,

  // 0025 — full execution workflows
  `create table if not exists public.viabilidade_estudos (
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
  )`,

  `create table if not exists public.projetos_documentos (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    obra_id uuid not null references public.obras(id) on delete cascade,
    disciplina text not null, revisao text not null,
    status text not null default 'em_revisao',
    arquivo_url text, observacoes text,
    aprovado_por uuid references public.profiles(id) on delete set null,
    aprovado_em timestamptz,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,

  `create table if not exists public.projetos_conflitos (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    obra_id uuid not null references public.obras(id) on delete cascade,
    projeto_id uuid references public.projetos_documentos(id) on delete set null,
    titulo text not null, descricao text not null,
    severidade text not null default 'media',
    status text not null default 'aberto',
    responsavel_id uuid references public.profiles(id) on delete set null,
    prazo date, resolvido_em timestamptz,
    created_at timestamptz not null default now()
  )`,

  `create table if not exists public.cronograma_replanejamentos (
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
  )`,

  `create table if not exists public.cotacoes_compra (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    obra_id uuid not null references public.obras(id) on delete cascade,
    material_id uuid references public.materiais(id) on delete set null,
    titulo text not null, status text not null default 'aberta',
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
  )`,

  `create table if not exists public.cotacoes_fornecedores (
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
  )`,

  `create table if not exists public.change_requests (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    obra_id uuid not null references public.obras(id) on delete cascade,
    tipo text not null, titulo text not null, descricao text not null,
    impacto_prazo_dias integer not null default 0,
    impacto_custo numeric(14,2) not null default 0,
    status text not null default 'pendente',
    solicitado_por uuid references public.profiles(id) on delete set null,
    aprovado_por uuid references public.profiles(id) on delete set null,
    aprovado_em timestamptz,
    created_at timestamptz not null default now()
  )`,

  `create table if not exists public.comissionamento_itens (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    obra_id uuid not null references public.obras(id) on delete cascade,
    sistema text not null, ambiente text not null, item text not null,
    status text not null default 'pendente',
    responsavel_id uuid references public.profiles(id) on delete set null,
    evidencia_url text, observacao text, testado_em timestamptz,
    created_at timestamptz not null default now()
  )`,

  `create table if not exists public.entregas_obra (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    obra_id uuid not null references public.obras(id) on delete cascade,
    status text not null default 'preparacao',
    termo_url text,
    chaves_entregues boolean not null default false,
    data_entrega timestamptz,
    aceite_cliente_nome text, aceite_cliente_doc text, observacoes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (empresa_id, obra_id)
  )`,

  `create table if not exists public.garantia_chamados (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    obra_id uuid not null references public.obras(id) on delete cascade,
    unidade text, sistema text not null, titulo text not null, descricao text not null,
    criticidade text not null default 'media',
    status text not null default 'aberto',
    sla_horas integer not null default 24,
    aberto_por uuid references public.profiles(id) on delete set null,
    responsavel_id uuid references public.profiles(id) on delete set null,
    prazo_resposta_em timestamptz, prazo_solucao_em timestamptz, resolvido_em timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,

  `create table if not exists public.garantia_interacoes (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    chamado_id uuid not null references public.garantia_chamados(id) on delete cascade,
    autor_id uuid references public.profiles(id) on delete set null,
    tipo text not null default 'comentario', mensagem text not null, anexo_url text,
    created_at timestamptz not null default now()
  )`,

  `create table if not exists public.tenant_security_policies (
    empresa_id uuid primary key references public.empresas(id) on delete cascade,
    mfa_required_roles text[] not null default '{}'::text[],
    sso_enabled boolean not null default false,
    sso_provider text, sso_entrypoint text, sso_certificate text,
    session_timeout_minutes integer not null default 43200,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,

  `create table if not exists public.tenant_auth_sessions (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    profile_id uuid references public.profiles(id) on delete set null,
    device_label text, ip_hash text, user_agent text,
    last_seen_at timestamptz not null default now(),
    revoked_at timestamptz, created_at timestamptz not null default now()
  )`,

  `create table if not exists public.mobile_sync_jobs (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    obra_id uuid not null references public.obras(id) on delete cascade,
    profile_id uuid references public.profiles(id) on delete set null,
    status text not null default 'pendente', direction text not null default 'upload',
    pendentes_criar integer not null default 0,
    pendentes_atualizar integer not null default 0,
    pendentes_deletar integer not null default 0,
    conflitos integer not null default 0,
    last_sync_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,

  `create table if not exists public.mobile_sync_conflicts (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    sync_job_id uuid not null references public.mobile_sync_jobs(id) on delete cascade,
    entidade text not null, entidade_id uuid, campo text not null,
    valor_local text, valor_remoto text, resolucao text,
    status text not null default 'aberto',
    resolvido_por uuid references public.profiles(id) on delete set null,
    resolvido_em timestamptz, created_at timestamptz not null default now()
  )`,

  // indexes and RLS for 0025 tables
  `create index if not exists viabilidade_estudos_empresa_obra_idx on public.viabilidade_estudos (empresa_id, obra_id)`,
  `create index if not exists projetos_documentos_empresa_obra_idx on public.projetos_documentos (empresa_id, obra_id, created_at desc)`,
  `create index if not exists projetos_conflitos_empresa_status_idx on public.projetos_conflitos (empresa_id, status, created_at desc)`,
  `create index if not exists cronograma_replanejamentos_empresa_obra_idx on public.cronograma_replanejamentos (empresa_id, obra_id, created_at desc)`,
  `create index if not exists cotacoes_compra_empresa_obra_idx on public.cotacoes_compra (empresa_id, obra_id, created_at desc)`,
  `create index if not exists cotacoes_fornecedores_cotacao_idx on public.cotacoes_fornecedores (empresa_id, cotacao_id, created_at desc)`,
  `create index if not exists change_requests_empresa_status_idx on public.change_requests (empresa_id, status, created_at desc)`,
  `create index if not exists comissionamento_itens_empresa_obra_idx on public.comissionamento_itens (empresa_id, obra_id, sistema, created_at desc)`,
  `create index if not exists garantia_chamados_empresa_status_idx on public.garantia_chamados (empresa_id, status, created_at desc)`,
  `create index if not exists garantia_interacoes_chamado_idx on public.garantia_interacoes (empresa_id, chamado_id, created_at desc)`,
  `create index if not exists tenant_auth_sessions_empresa_profile_idx on public.tenant_auth_sessions (empresa_id, profile_id, last_seen_at desc)`,
  `create index if not exists mobile_sync_jobs_empresa_obra_idx on public.mobile_sync_jobs (empresa_id, obra_id, created_at desc)`,
  `create index if not exists mobile_sync_conflicts_empresa_status_idx on public.mobile_sync_conflicts (empresa_id, status, created_at desc)`,

  `alter table public.viabilidade_estudos enable row level security`,
  `alter table public.projetos_documentos enable row level security`,
  `alter table public.projetos_conflitos enable row level security`,
  `alter table public.cronograma_replanejamentos enable row level security`,
  `alter table public.cotacoes_compra enable row level security`,
  `alter table public.cotacoes_fornecedores enable row level security`,
  `alter table public.change_requests enable row level security`,
  `alter table public.comissionamento_itens enable row level security`,
  `alter table public.entregas_obra enable row level security`,
  `alter table public.garantia_chamados enable row level security`,
  `alter table public.garantia_interacoes enable row level security`,
  `alter table public.tenant_security_policies enable row level security`,
  `alter table public.tenant_auth_sessions enable row level security`,
  `alter table public.mobile_sync_jobs enable row level security`,
  `alter table public.mobile_sync_conflicts enable row level security`,

  `do $$
  declare tbl text;
    tables text[] := array['viabilidade_estudos','projetos_documentos','projetos_conflitos',
      'cronograma_replanejamentos','cotacoes_compra','cotacoes_fornecedores',
      'change_requests','comissionamento_itens','entregas_obra',
      'garantia_chamados','garantia_interacoes','tenant_security_policies',
      'tenant_auth_sessions','mobile_sync_jobs','mobile_sync_conflicts'];
  begin foreach tbl in array tables loop
    execute format('drop policy if exists %I_tenant_select on public.%I', tbl, tbl);
    execute format('drop policy if exists %I_tenant_insert on public.%I', tbl, tbl);
    execute format('drop policy if exists %I_tenant_update on public.%I', tbl, tbl);
    execute format('drop policy if exists %I_tenant_delete on public.%I', tbl, tbl);
    execute format('create policy %I_tenant_select on public.%I for select using (empresa_id = public.current_empresa_id())', tbl, tbl);
    execute format('create policy %I_tenant_insert on public.%I for insert with check (empresa_id = public.current_empresa_id())', tbl, tbl);
    execute format('create policy %I_tenant_update on public.%I for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id())', tbl, tbl);
    execute format('create policy %I_tenant_delete on public.%I for delete using (empresa_id = public.current_empresa_id())', tbl, tbl);
  end loop; end $$`,

  // 0026 — enterprise completion pack
  `create table if not exists public.cotacoes_rodadas (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    cotacao_id uuid not null references public.cotacoes_compra(id) on delete cascade,
    numero integer not null, objetivo text not null, observacoes text,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    unique (empresa_id, cotacao_id, numero)
  )`,

  `create table if not exists public.contratos_fornecedores (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    obra_id uuid not null references public.obras(id) on delete cascade,
    cotacao_id uuid not null references public.cotacoes_compra(id) on delete cascade,
    fornecedor_id uuid references public.cotacoes_fornecedores(id) on delete set null,
    status text not null default 'rascunho',
    valor_total numeric(14,2) not null default 0,
    prazo_dias integer not null default 0,
    condicoes text, assinado_em timestamptz,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
  )`,

  `create table if not exists public.equipe_alocacoes (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    obra_id uuid not null references public.obras(id) on delete cascade,
    equipe_id uuid not null references public.equipes(id) on delete cascade,
    frente text not null, turno text not null default 'diurno',
    data_inicio date not null, data_fim date not null,
    capacidade_planejada integer not null default 0,
    alocados integer not null default 0,
    status text not null default 'planejada',
    observacoes text,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
  )`,

  `create table if not exists public.financeiro_titulos (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    obra_id uuid not null references public.obras(id) on delete cascade,
    tipo text not null, centro_custo text not null, descricao text not null,
    valor numeric(14,2) not null default 0,
    valor_liquidado numeric(14,2) not null default 0,
    status text not null default 'previsto',
    vencimento date not null, liquidado_em timestamptz,
    conciliado boolean not null default false,
    solicitado_por uuid references public.profiles(id) on delete set null,
    aprovado_por uuid references public.profiles(id) on delete set null,
    aprovado_em timestamptz, created_at timestamptz not null default now()
  )`,

  `create index if not exists cotacoes_rodadas_empresa_cotacao_idx on public.cotacoes_rodadas (empresa_id, cotacao_id, numero)`,
  `create index if not exists contratos_fornecedores_empresa_obra_idx on public.contratos_fornecedores (empresa_id, obra_id, created_at desc)`,
  `create index if not exists equipe_alocacoes_empresa_obra_idx on public.equipe_alocacoes (empresa_id, obra_id, data_inicio)`,
  `create index if not exists financeiro_titulos_empresa_status_idx on public.financeiro_titulos (empresa_id, status, created_at desc)`,

  `alter table public.cotacoes_rodadas enable row level security`,
  `alter table public.contratos_fornecedores enable row level security`,
  `alter table public.equipe_alocacoes enable row level security`,
  `alter table public.financeiro_titulos enable row level security`,

  `do $$
  declare tbl text;
    tables text[] := array['cotacoes_rodadas','contratos_fornecedores','equipe_alocacoes','financeiro_titulos'];
  begin foreach tbl in array tables loop
    execute format('drop policy if exists %I_tenant_select on public.%I', tbl, tbl);
    execute format('drop policy if exists %I_tenant_insert on public.%I', tbl, tbl);
    execute format('drop policy if exists %I_tenant_update on public.%I', tbl, tbl);
    execute format('drop policy if exists %I_tenant_delete on public.%I', tbl, tbl);
    execute format('create policy %I_tenant_select on public.%I for select using (empresa_id = public.current_empresa_id())', tbl, tbl);
    execute format('create policy %I_tenant_insert on public.%I for insert with check (empresa_id = public.current_empresa_id())', tbl, tbl);
    execute format('create policy %I_tenant_update on public.%I for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id())', tbl, tbl);
    execute format('create policy %I_tenant_delete on public.%I for delete using (empresa_id = public.current_empresa_id())', tbl, tbl);
  end loop; end $$`,
];

const SUPABASE_PROJECT_REF = "dskcjkrgzwvsjdahfpgd";
const ADMIN_SECRET = "migrate-obras-2025";

export async function POST(req: NextRequest) {
  let body: { pat?: string; dbPassword?: string; secret?: string } = {};
  try { body = await req.json(); } catch { /* empty body */ }

  const pat = body.pat ?? process.env.SUPABASE_ACCESS_TOKEN;
  const dbPassword = body.dbPassword;
  const secret = body.secret ?? req.headers.get("x-admin-secret");

  if (!pat && !dbPassword) {
    return NextResponse.json(
      { error: "Forneça dbPassword (senha do banco) ou pat (Supabase PAT sbp_...). Veja comentários no topo do arquivo." },
      { status: 400 }
    );
  }

  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized — wrong secret" }, { status: 401 });
  }

  const errors: { stmt: string; error: string }[] = [];
  const skipped: string[] = [];
  let applied = 0;

  // ── OPTION A: direct PostgreSQL connection (dbPassword) ──────────────────
  if (dbPassword) {
    const client = new Client({
      host: `db.${SUPABASE_PROJECT_REF}.supabase.co`,
      port: 5432,
      database: "postgres",
      user: "postgres",
      password: dbPassword,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 20000,
    });

    try {
      await client.connect();
    } catch (connErr) {
      return NextResponse.json(
        { error: `Falha ao conectar ao banco: ${String(connErr)}. Verifique a senha em: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/settings/database` },
        { status: 500 }
      );
    }

    for (const stmt of STATEMENTS) {
      const label = stmt.replace(/\s+/g, " ").slice(0, 80);
      try {
        await client.query(stmt);
        applied++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/already exists|duplicate/i.test(msg)) {
          skipped.push(label);
        } else {
          errors.push({ stmt: label, error: msg });
        }
      }
    }

    await client.end().catch(() => {});

    return NextResponse.json({
      method: "direct-pg",
      total: STATEMENTS.length,
      applied,
      skipped: skipped.length,
      errors: errors.length,
      errorDetails: errors,
    });
  }

  // ── OPTION B: Supabase Management API (PAT) ───────────────────────────────
  const apiBase = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`;

  for (const stmt of STATEMENTS) {
    const label = stmt.replace(/\s+/g, " ").slice(0, 80);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${pat}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: stmt }),
      });

      if (!res.ok) {
        const body2 = await res.json().catch(() => ({ message: res.statusText }));
        const msg: string = (body2 as { message?: string }).message ?? JSON.stringify(body2);
        if (/already exists|duplicate/i.test(msg)) {
          skipped.push(label);
        } else {
          errors.push({ stmt: label, error: msg });
        }
      } else {
        applied++;
      }
    } catch (err) {
      errors.push({ stmt: label, error: String(err) });
    }
  }

  return NextResponse.json({
    method: "management-api",
    total: STATEMENTS.length,
    applied,
    skipped: skipped.length,
    errors: errors.length,
    errorDetails: errors,
  });
}
