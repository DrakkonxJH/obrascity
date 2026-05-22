alter table public.pedidos_compra
  add column if not exists quantidade numeric(14,2) not null default 0;
