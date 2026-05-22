create or replace function public.current_empresa_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  jwt_empresa_id uuid;
  profile_empresa_id uuid;
begin
  jwt_empresa_id := nullif(auth.jwt() ->> 'empresa_id', '')::uuid;
  if jwt_empresa_id is not null then
    return jwt_empresa_id;
  end if;

  select p.empresa_id
    into profile_empresa_id
  from public.profiles p
  where p.id = auth.uid();

  return profile_empresa_id;
end;
$$;
