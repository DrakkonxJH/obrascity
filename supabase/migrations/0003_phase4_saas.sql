create table if not exists public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  provider text not null default 'stripe',
  external_customer_id text,
  external_subscription_id text,
  plano text not null default 'starter',
  status text not null default 'inativa',
  periodo_inicio timestamptz,
  periodo_fim timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assinatura_eventos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas(id) on delete set null,
  provider text not null default 'stripe',
  event_type text not null,
  external_event_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.relatorios
  add column if not exists status text not null default 'pendente',
  add column if not exists solicitado_por uuid references public.profiles(id);

alter table public.assinaturas enable row level security;
alter table public.assinatura_eventos enable row level security;

create policy assinaturas_tenant_select on public.assinaturas
for select using (empresa_id = public.current_empresa_id());
create policy assinaturas_tenant_insert on public.assinaturas
for insert with check (empresa_id = public.current_empresa_id());
create policy assinaturas_tenant_update on public.assinaturas
for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id());
create policy assinaturas_tenant_delete on public.assinaturas
for delete using (empresa_id = public.current_empresa_id());

create policy assinatura_eventos_tenant_select on public.assinatura_eventos
for select using (empresa_id = public.current_empresa_id());
create policy assinatura_eventos_tenant_insert on public.assinatura_eventos
for insert with check (empresa_id = public.current_empresa_id() or empresa_id is null);
create policy assinatura_eventos_tenant_update on public.assinatura_eventos
for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id());
create policy assinatura_eventos_tenant_delete on public.assinatura_eventos
for delete using (empresa_id = public.current_empresa_id());

create trigger assinaturas_audit_trigger
after insert or update or delete on public.assinaturas
for each row execute function public.audit_changes();
