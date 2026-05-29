alter table public.crm_deals
  add column if not exists loss_reason text not null default '',
  add column if not exists custom_fields jsonb not null default '{}'::jsonb,
  add column if not exists playbook_items jsonb not null default '[]'::jsonb,
  add column if not exists probability integer not null default 10;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'crm_deals_probability_bounds_check'
  ) then
    alter table public.crm_deals
      add constraint crm_deals_probability_bounds_check check (probability >= 0 and probability <= 100);
  end if;
end $$;

create index if not exists idx_crm_deals_empresa_owner_updated
  on public.crm_deals (empresa_id, owner_profile_id, updated_at desc);
