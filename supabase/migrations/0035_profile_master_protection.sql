alter table public.profiles enable row level security;

drop policy if exists profiles_select_tenant on public.profiles;
drop policy if exists profiles_update_self on public.profiles;
drop policy if exists profiles_admin_update_role on public.profiles;
drop policy if exists profiles_admin_delete on public.profiles;

create policy profiles_select_tenant
on public.profiles for select
using (
  empresa_id = public.current_empresa_id()
  and (
    not exists (
      select 1
      from public.empresas e
      where e.id = public.profiles.empresa_id
        and e.is_master = true
    )
    or public.profiles.empresa_id = public.current_empresa_id()
  )
);

create policy profiles_update_self
on public.profiles for update
using (id = auth.uid() and empresa_id = public.current_empresa_id())
with check (id = auth.uid() and empresa_id = public.current_empresa_id());

create policy profiles_admin_update_role
on public.profiles for update
using (
  empresa_id = public.current_empresa_id()
  and public.is_empresa_admin()
)
with check (empresa_id = public.current_empresa_id());

create policy profiles_admin_delete
on public.profiles for delete
using (
  empresa_id = public.current_empresa_id()
  and public.is_empresa_admin()
);
