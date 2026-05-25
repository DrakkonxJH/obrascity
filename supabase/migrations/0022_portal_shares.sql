create table if not exists public.portal_shares (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  descricao text,
  expires_at timestamptz,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.portal_shares enable row level security;

create policy portal_shares_tenant_select on public.portal_shares
for select using (empresa_id = public.current_empresa_id());

create policy portal_shares_tenant_insert on public.portal_shares
for insert with check (empresa_id = public.current_empresa_id());

create policy portal_shares_tenant_update on public.portal_shares
for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id());

create policy portal_shares_tenant_delete on public.portal_shares
for delete using (empresa_id = public.current_empresa_id());

create index if not exists portal_shares_empresa_active_idx
  on public.portal_shares (empresa_id, active, created_at desc);
