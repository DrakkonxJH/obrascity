grant execute on function public.purge_lgpd_retention(integer, integer) to service_role;

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema extensions;

    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'lgpd-retention-daily';

    perform cron.schedule(
      'lgpd-retention-daily',
      '15 3 * * *',
      $cron$select public.purge_lgpd_retention(180, 730);$cron$
    );
  end if;
exception
  when others then
    raise notice 'Nao foi possivel configurar agendamento pg_cron automaticamente: %', sqlerrm;
end
$$;
