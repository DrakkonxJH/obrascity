update public.empresas
set is_master = true
where lower(nome) like '%master%'
  and is_master = false;

update public.empresas
set is_master = true
where id = (
  select id
  from public.empresas
  where is_master = false
  order by created_at asc nulls last
  limit 1
)
and not exists (
  select 1 from public.empresas where is_master = true
);

update public.empresas
set is_master = false
where is_master = true
  and id != (
    select id
    from public.empresas
    where is_master = true
    order by created_at asc nulls last
    limit 1
  );
