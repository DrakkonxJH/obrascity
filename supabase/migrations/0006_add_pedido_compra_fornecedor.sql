alter table public.pedidos_compra
  add column if not exists fornecedor text not null default '';
