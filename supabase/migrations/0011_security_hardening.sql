-- Security hardening: trial signup, plan immutability, feature gates, Stripe sync

-- ---------------------------------------------------------------------------
-- Plan catalog (read-only for clients; features enforced in RLS + app)
-- ---------------------------------------------------------------------------
create table if not exists public.plan_features (
  plano text not null,
  feature text not null,
  primary key (plano, feature)
);

insert into public.plan_features (plano, feature) values
  ('trial', 'dashboard'),
  ('trial', 'obras_basic'),
  ('trial', 'equipes_basic'),
  ('trial', 'materiais_basic'),
  ('trial', 'relatorios_basic'),
  ('starter', 'dashboard'),
  ('starter', 'obras_basic'),
  ('starter', 'equipes_basic'),
  ('starter', 'materiais_basic'),
  ('starter', 'cronograma'),
  ('starter', 'relatorios_basic'),
  ('pro', 'dashboard'),
  ('pro', 'obras_basic'),
  ('pro', 'equipes_basic'),
  ('pro', 'materiais_basic'),
  ('pro', 'cronograma'),
  ('pro', 'relatorios_export'),
  ('pro', 'financeiro_avancado'),
  ('enterprise', 'dashboard'),
  ('enterprise', 'obras_basic'),
  ('enterprise', 'equipes_basic'),
  ('enterprise', 'materiais_basic'),
  ('enterprise', 'cronograma'),
  ('enterprise', 'relatorios_export'),
  ('enterprise', 'financeiro_avancado'),
  ('enterprise', 'api_access')
on conflict do nothing;

alter table public.plan_features enable row level security;

create policy plan_features_read on public.plan_features
for select to authenticated
using (true);

-- ---------------------------------------------------------------------------
-- Tenant resolution: profile only (never trust JWT empresa_id)
-- ---------------------------------------------------------------------------
create or replace function public.current_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.empresa_id
  from public.profiles p
  where p.id = auth.uid()
$$;

create or replace function public.current_user_role()
returns public.role_type
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
$$;

create or replace function public.is_empresa_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'administrador'::public.role_type
$$;

-- Active subscription for current tenant
create or replace function public.current_subscription()
returns table (
  plano text,
  status text,
  periodo_fim timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select a.plano, a.status, a.periodo_fim
  from public.assinaturas a
  where a.empresa_id = public.current_empresa_id()
  order by a.created_at desc
  limit 1
$$;

create or replace function public.plan_allows(p_feature text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.current_subscription() cs
    join public.plan_features pf on pf.plano = cs.plano and pf.feature = p_feature
    where cs.status in ('trialing', 'active')
      and (cs.periodo_fim is null or cs.periodo_fim > now())
  )
$$;

-- ---------------------------------------------------------------------------
-- Signup audit (anti-abuse: rate limits enforced in app layer too)
-- ---------------------------------------------------------------------------
create table if not exists public.signup_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip_hash text,
  success boolean not null default false,
  failure_reason text,
  created_at timestamptz not null default now()
);

create index if not exists signup_attempts_email_created_idx
  on public.signup_attempts (email, created_at desc);

alter table public.signup_attempts enable row level security;

-- No policies: only service role can read/write

-- ---------------------------------------------------------------------------
-- Provision trial tenant (service role / security definer only)
-- ---------------------------------------------------------------------------
create or replace function public.provision_trial_tenant(
  p_user_id uuid,
  p_email text,
  p_nome text,
  p_empresa_nome text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_existing uuid;
  v_trial_days integer := 14;
begin
  if p_user_id is null then
    raise exception 'user_id obrigatorio';
  end if;

  select p.empresa_id into v_existing
  from public.profiles p
  where p.id = p_user_id;

  if v_existing is not null then
    return v_existing;
  end if;

  insert into public.empresas (nome, plano)
  values (coalesce(nullif(trim(p_empresa_nome), ''), 'Nova empresa'), 'trial')
  returning id into v_empresa_id;

  insert into public.profiles (id, empresa_id, nome, email, role)
  values (
    p_user_id,
    v_empresa_id,
    coalesce(nullif(trim(p_nome), ''), split_part(p_email, '@', 1)),
    lower(trim(p_email)),
    'administrador'::public.role_type
  );

  insert into public.assinaturas (
    empresa_id,
    plano,
    status,
    periodo_inicio,
    periodo_fim
  )
  values (
    v_empresa_id,
    'trial',
    'trialing',
    now(),
    now() + make_interval(days => v_trial_days)
  );

  return v_empresa_id;
end;
$$;

revoke all on function public.provision_trial_tenant(uuid, text, text, text) from public;
grant execute on function public.provision_trial_tenant(uuid, text, text, text) to service_role;

-- Stripe webhook: only service role may change paid plans
create or replace function public.sync_subscription_from_stripe(
  p_empresa_id uuid,
  p_plano text,
  p_status text,
  p_external_customer_id text,
  p_external_subscription_id text,
  p_periodo_fim timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_empresa_id is null then
    raise exception 'empresa_id obrigatorio';
  end if;

  if p_plano not in ('trial', 'starter', 'pro', 'enterprise') then
    raise exception 'plano invalido: %', p_plano;
  end if;

  if p_status not in ('trialing', 'active', 'past_due', 'canceled', 'inativa') then
    raise exception 'status invalido: %', p_status;
  end if;

  update public.empresas
  set plano = p_plano
  where id = p_empresa_id;

  insert into public.assinaturas (
    empresa_id,
    provider,
    external_customer_id,
    external_subscription_id,
    plano,
    status,
    periodo_inicio,
    periodo_fim,
    updated_at
  )
  values (
    p_empresa_id,
    'stripe',
    p_external_customer_id,
    p_external_subscription_id,
    p_plano,
    p_status,
    now(),
    p_periodo_fim,
    now()
  );

  -- Keep latest row authoritative; optional: upsert by external_subscription_id later
end;
$$;

revoke all on function public.sync_subscription_from_stripe(uuid, text, text, text, text, timestamptz) from public;
grant execute on function public.sync_subscription_from_stripe(uuid, text, text, text, text, timestamptz) to service_role;

-- Log Stripe events (service role only)
create or replace function public.log_stripe_event(
  p_empresa_id uuid,
  p_event_type text,
  p_external_event_id text,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.assinatura_eventos (
    empresa_id,
    provider,
    event_type,
    external_event_id,
    payload
  )
  values (
    p_empresa_id,
    'stripe',
    p_event_type,
    p_external_event_id,
    coalesce(p_payload, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.log_stripe_event(uuid, text, text, jsonb) from public;
grant execute on function public.log_stripe_event(uuid, text, text, jsonb) to service_role;

-- Fallback trigger: only provision when signup came from ObrasCitY web
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source text;
  v_nome text;
  v_empresa text;
begin
  v_source := coalesce(new.raw_user_meta_data ->> 'signup_source', '');
  if v_source <> 'obrascity_web' then
    return new;
  end if;

  v_nome := coalesce(new.raw_user_meta_data ->> 'nome', '');
  v_empresa := coalesce(new.raw_user_meta_data ->> 'empresa_nome', '');

  perform public.provision_trial_tenant(
    new.id,
    new.email,
    v_nome,
    v_empresa
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Assinaturas: read-only for tenants
-- ---------------------------------------------------------------------------
drop policy if exists assinaturas_tenant_insert on public.assinaturas;
drop policy if exists assinaturas_tenant_update on public.assinaturas;
drop policy if exists assinaturas_tenant_delete on public.assinaturas;

drop policy if exists assinatura_eventos_tenant_select on public.assinatura_eventos;
drop policy if exists assinatura_eventos_tenant_insert on public.assinatura_eventos;
drop policy if exists assinatura_eventos_tenant_update on public.assinatura_eventos;
drop policy if exists assinatura_eventos_tenant_delete on public.assinatura_eventos;

-- ---------------------------------------------------------------------------
-- Empresas: tenants may update metadata, never plano
-- ---------------------------------------------------------------------------
drop policy if exists empresas_tenant_update on public.empresas;

create policy empresas_tenant_update_metadata on public.empresas
for update
to authenticated
using (id = public.current_empresa_id())
with check (
  id = public.current_empresa_id()
  and plano = (select e.plano from public.empresas e where e.id = public.current_empresa_id())
);

-- ---------------------------------------------------------------------------
-- Profiles: no self-service insert; role immutable except by admin
-- ---------------------------------------------------------------------------
drop policy if exists profiles_tenant_select on public.profiles;
drop policy if exists profiles_tenant_insert on public.profiles;
drop policy if exists profiles_tenant_update on public.profiles;
drop policy if exists profiles_tenant_delete on public.profiles;

create policy profiles_select_tenant on public.profiles
for select
to authenticated
using (empresa_id = public.current_empresa_id());

create policy profiles_update_self on public.profiles
for update
to authenticated
using (id = auth.uid() and empresa_id = public.current_empresa_id())
with check (
  id = auth.uid()
  and empresa_id = public.current_empresa_id()
  and role = (select p.role from public.profiles p where p.id = auth.uid())
);

create policy profiles_admin_update_role on public.profiles
for update
to authenticated
using (
  empresa_id = public.current_empresa_id()
  and public.is_empresa_admin()
)
with check (empresa_id = public.current_empresa_id());

create policy profiles_admin_delete on public.profiles
for delete
to authenticated
using (
  empresa_id = public.current_empresa_id()
  and public.is_empresa_admin()
  and id <> auth.uid()
);

-- ---------------------------------------------------------------------------
-- Paid features: example gate on relatorios insert
-- ---------------------------------------------------------------------------
drop policy if exists relatorios_tenant_insert on public.relatorios;

create policy relatorios_tenant_insert on public.relatorios
for insert
to authenticated
with check (
  empresa_id = public.current_empresa_id()
  and (
    public.plan_allows('relatorios_basic')
    or public.plan_allows('relatorios_export')
  )
);
