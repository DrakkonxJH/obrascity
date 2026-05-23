do $$
begin
  alter type public.role_type add value if not exists 'master';
exception
  when duplicate_object then null;
end $$;
