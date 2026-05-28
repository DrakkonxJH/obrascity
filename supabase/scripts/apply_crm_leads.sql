-- ============================================================
-- ObrasCitY - Aplicar tabela crm_leads + dados demo
-- Cole este script no Supabase SQL Editor e execute
-- URL: https://supabase.com/dashboard/project/dskcjkrgzwvsjdahfpgd/sql/new
-- ============================================================

-- PASSO 1: Criar tabela crm_leads
create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  contato text not null default '',
  cargo text not null default '',
  email text not null default '',
  telefone text not null default '',
  valor numeric(14,2) not null default 0,
  etapa text not null default 'Contato',
  origem text not null default 'Manual',
  obra text not null default '',
  prioridade text not null default 'Média',
  ultima_atividade date not null default current_date,
  notas text not null default '',
  created_by uuid null references auth.users(id) on delete set null,
  updated_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_leads_etapa_check check (etapa in ('Contato', 'Qualificação', 'Proposta', 'Negociação', 'Fechado', 'Perdido')),
  constraint crm_leads_prioridade_check check (prioridade in ('Alta', 'Média', 'Baixa'))
);

create index if not exists idx_crm_leads_empresa_etapa on public.crm_leads(empresa_id, etapa);
create index if not exists idx_crm_leads_empresa_updated_at on public.crm_leads(empresa_id, updated_at desc);

alter table public.crm_leads enable row level security;

drop policy if exists crm_leads_tenant_select on public.crm_leads;
drop policy if exists crm_leads_tenant_insert on public.crm_leads;
drop policy if exists crm_leads_tenant_update on public.crm_leads;
drop policy if exists crm_leads_tenant_delete on public.crm_leads;

create policy crm_leads_tenant_select on public.crm_leads
  for select using (empresa_id = public.current_empresa_id());
create policy crm_leads_tenant_insert on public.crm_leads
  for insert with check (empresa_id = public.current_empresa_id());
create policy crm_leads_tenant_update on public.crm_leads
  for update using (empresa_id = public.current_empresa_id())
  with check (empresa_id = public.current_empresa_id());
create policy crm_leads_tenant_delete on public.crm_leads
  for delete using (empresa_id = public.current_empresa_id());

-- PASSO 2: Inserir 7 leads da conta usuario01@obrascity.com
insert into public.crm_leads
  (empresa_id, nome, contato, cargo, email, telefone, valor, etapa, origem, obra, prioridade, ultima_atividade, notas)
values
  ('4ad2dbe4-2f9f-4741-83de-d5e0e4f99592','Obra Residencial - João','João','Proprietário','joao@email.com','(11) 99000-0001',45000.00,'Contato','Indicação','obra test','Baixa','2025-06-01','Primeiro contato realizado. Cliente interessado em reforma residencial. Aguardando retorno para marcar visita técnica.'),
  ('4ad2dbe4-2f9f-4741-83de-d5e0e4f99592','Obra Jardim - Pedro','Pedro','Proprietário','pedro@email.com','(11) 99000-0002',180000.00,'Proposta','Prospecção','nova obra jardim','Média','2025-06-10','Proposta técnica enviada em 10/06. Cliente solicitou ajuste no cronograma para início em agosto. Revisão orçamentária pendente.'),
  ('4ad2dbe4-2f9f-4741-83de-d5e0e4f99592','Edifício Aurora Residence','Diretor Aurora Incorporadora','Diretor de Projetos','diretoria@aurora.com.br','(11) 3000-1001',2800000.00,'Proposta','Licitação','REF - Edifício Aurora Residence','Média','2025-06-05','Proposta apresentada em reunião com a diretoria em 05/06. Incorporadora avaliando duas outras propostas concorrentes. Aguardar retorno até 30/06.'),
  ('4ad2dbe4-2f9f-4741-83de-d5e0e4f99592','Centro Empresarial Atlas','Gerente Atlas Participações','Gerente de Obras','obras@atlas.com.br','(11) 3000-2002',4200000.00,'Negociação','Indicação','REF - Centro Empresarial Atlas','Alta','2025-06-12','Em negociação ativa. Cliente solicitou desconto de 8% e extensão de prazo. Contraproposta enviada com 5% de desconto e 3 meses adicionais. Reunião marcada para 20/06.'),
  ('4ad2dbe4-2f9f-4741-83de-d5e0e4f99592','Hospital São Lucas','Coordenador Fundação Saúde Viva','Coordenador de Obras','obras@fsv.org.br','(62) 3000-3003',6500000.00,'Qualificação','Licitação','REF - Hospital São Lucas','Média','2025-06-08','Obra de grande porte — hospital de 120 leitos. Documentação em análise. Visita ao terreno agendada para 25/06.'),
  ('4ad2dbe4-2f9f-4741-83de-d5e0e4f99592','Ponte Rio Verde','Fiscal DER','Fiscal de Obras DER','fiscalizacao@der.go.gov.br','(62) 3000-4004',1900000.00,'Fechado','Licitação','REF - Ponte Rio Verde','Baixa','2025-05-22','Contrato assinado em 22/05/2025. Obra concluída. Termo de recebimento definitivo emitido. Potencial para novas licitações no estado.'),
  ('4ad2dbe4-2f9f-4741-83de-d5e0e4f99592','Projeto CAI CAI - Neymar','Neymar Junior','Proprietário','contato@njsports.com','(11) 99999-9999',320000.00,'Contato','Indicação','Arrumando o CAI CAI','Alta','2025-06-15','Cliente VIP indicado por parceiro estratégico. Reforma de espaço esportivo privado. Reunião inicial marcada para 20/06. Alta prioridade.')
on conflict do nothing;

-- PASSO 3: Verificar resultado
select etapa, nome, valor, prioridade
from public.crm_leads
where empresa_id = '4ad2dbe4-2f9f-4741-83de-d5e0e4f99592'
order by created_at;
