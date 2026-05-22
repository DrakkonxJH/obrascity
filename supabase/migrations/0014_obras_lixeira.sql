alter table public.obras
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null;

create index if not exists obras_empresa_deleted_at_idx
  on public.obras (empresa_id, deleted_at desc);

create or replace function public.purge_deleted_obras(
  p_retention_days integer default 15
)
returns table(deleted_obras bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted bigint := 0;
begin
  with expired as (
    select id
    from public.obras
    where deleted_at is not null
      and deleted_at < now() - make_interval(days => greatest(p_retention_days, 1))
  )
  delete from public.qualidade_checklists q
  using expired e
  where q.obra_id = e.id;

  with expired as (
    select id
    from public.obras
    where deleted_at is not null
      and deleted_at < now() - make_interval(days => greatest(p_retention_days, 1))
  )
  delete from public.nao_conformidades n
  using expired e
  where n.obra_id = e.id;

  with expired as (
    select id
    from public.obras
    where deleted_at is not null
      and deleted_at < now() - make_interval(days => greatest(p_retention_days, 1))
  )
  delete from public.medicoes m
  using expired e
  where m.obra_id = e.id;

  with expired as (
    select id
    from public.obras
    where deleted_at is not null
      and deleted_at < now() - make_interval(days => greatest(p_retention_days, 1))
  )
  delete from public.diario_obra d
  using expired e
  where d.obra_id = e.id;

  with expired as (
    select id
    from public.obras
    where deleted_at is not null
      and deleted_at < now() - make_interval(days => greatest(p_retention_days, 1))
  )
  delete from public.fotos_obra f
  using expired e
  where f.obra_id = e.id;

  with expired as (
    select id
    from public.obras
    where deleted_at is not null
      and deleted_at < now() - make_interval(days => greatest(p_retention_days, 1))
  )
  delete from public.relatorios r
  using expired e
  where r.obra_id = e.id;

  with expired as (
    select id
    from public.obras
    where deleted_at is not null
      and deleted_at < now() - make_interval(days => greatest(p_retention_days, 1))
  )
  delete from public.obras_financeiro o
  using expired e
  where o.obra_id = e.id;

  with expired as (
    select id
    from public.obras
    where deleted_at is not null
      and deleted_at < now() - make_interval(days => greatest(p_retention_days, 1))
  )
  delete from public.pedidos_compra p
  using expired e
  where p.obra_id = e.id;

  with expired as (
    select id
    from public.obras
    where deleted_at is not null
      and deleted_at < now() - make_interval(days => greatest(p_retention_days, 1))
  )
  delete from public.atividades a
  using expired e
  where a.obra_id = e.id;

  with expired as (
    select id
    from public.obras
    where deleted_at is not null
      and deleted_at < now() - make_interval(days => greatest(p_retention_days, 1))
  )
  delete from public.cronograma_baselines c
  using expired e
  where c.obra_id = e.id;

  with expired as (
    select id
    from public.obras
    where deleted_at is not null
      and deleted_at < now() - make_interval(days => greatest(p_retention_days, 1))
  )
  delete from public.obras_tarefas t
  using expired e
  where t.obra_id = e.id;

  with expired as (
    select id
    from public.obras
    where deleted_at is not null
      and deleted_at < now() - make_interval(days => greatest(p_retention_days, 1))
  )
  delete from public.obras o
  using expired e
  where o.id = e.id;

  get diagnostics v_deleted = row_count;
  return query select v_deleted;
end;
$$;

grant execute on function public.purge_deleted_obras(integer) to service_role;

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema extensions;

    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'obra-trash-daily';

    perform cron.schedule(
      'obra-trash-daily',
      '25 3 * * *',
      $cron$select public.purge_deleted_obras(15);$cron$
    );
  end if;
exception
  when others then
    raise notice 'Nao foi possivel configurar agendamento de lixeira automaticamente: %', sqlerrm;
end
$$;
