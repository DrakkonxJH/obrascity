-- Trial signup should create a client-only profile, not an administrator.
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
    'visualizador'::public.role_type
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
