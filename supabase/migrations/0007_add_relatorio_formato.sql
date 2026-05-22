alter table public.relatorios
  add column if not exists formato text not null default 'pdf';
