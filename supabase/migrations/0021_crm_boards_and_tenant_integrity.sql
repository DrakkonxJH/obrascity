create table if not exists public.crm_boards (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  slug text not null,
  label text not null,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, slug)
);

create index if not exists crm_boards_empresa_created_idx
  on public.crm_boards (empresa_id, created_at asc);

alter table public.crm_boards enable row level security;

drop policy if exists crm_boards_tenant_select on public.crm_boards;
drop policy if exists crm_boards_tenant_insert on public.crm_boards;
drop policy if exists crm_boards_tenant_update on public.crm_boards;
drop policy if exists crm_boards_tenant_delete on public.crm_boards;

create policy crm_boards_tenant_select on public.crm_boards
for select to authenticated
using (empresa_id = public.current_empresa_id());

create policy crm_boards_tenant_insert on public.crm_boards
for insert to authenticated
with check (empresa_id = public.current_empresa_id() and public.is_empresa_admin());

create policy crm_boards_tenant_update on public.crm_boards
for update to authenticated
using (empresa_id = public.current_empresa_id() and public.is_empresa_admin())
with check (empresa_id = public.current_empresa_id() and public.is_empresa_admin());

create policy crm_boards_tenant_delete on public.crm_boards
for delete to authenticated
using (empresa_id = public.current_empresa_id() and public.is_empresa_admin());

drop trigger if exists crm_boards_touch_updated_at on public.crm_boards;
create trigger crm_boards_touch_updated_at
before update on public.crm_boards
for each row execute function public.crm_touch_updated_at();

create or replace function public.crm_enforce_tenant_integrity()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'crm_deals' then
    if new.company_id is not null and not exists (
      select 1 from public.crm_companies c
      where c.id = new.company_id
        and c.empresa_id = new.empresa_id
    ) then
      raise exception 'crm_deals.company_id fora do tenant';
    end if;

    if new.contact_id is not null and not exists (
      select 1 from public.crm_contacts c
      where c.id = new.contact_id
        and c.empresa_id = new.empresa_id
    ) then
      raise exception 'crm_deals.contact_id fora do tenant';
    end if;

    if new.obra_id is not null and not exists (
      select 1 from public.obras o
      where o.id = new.obra_id
        and o.empresa_id = new.empresa_id
    ) then
      raise exception 'crm_deals.obra_id fora do tenant';
    end if;

    if new.owner_profile_id is not null and not exists (
      select 1 from public.profiles p
      where p.id = new.owner_profile_id
        and p.empresa_id = new.empresa_id
    ) then
      raise exception 'crm_deals.owner_profile_id fora do tenant';
    end if;

  elsif tg_table_name = 'crm_activities' then
    if not exists (
      select 1 from public.crm_deals d
      where d.id = new.deal_id
        and d.empresa_id = new.empresa_id
    ) then
      raise exception 'crm_activities.deal_id fora do tenant';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists crm_deals_tenant_integrity on public.crm_deals;
create trigger crm_deals_tenant_integrity
before insert or update on public.crm_deals
for each row execute function public.crm_enforce_tenant_integrity();

drop trigger if exists crm_activities_tenant_integrity on public.crm_activities;
create trigger crm_activities_tenant_integrity
before insert or update on public.crm_activities
for each row execute function public.crm_enforce_tenant_integrity();

drop trigger if exists crm_boards_audit_trigger on public.crm_boards;
create trigger crm_boards_audit_trigger
after insert or update or delete on public.crm_boards
for each row execute function public.audit_changes();
