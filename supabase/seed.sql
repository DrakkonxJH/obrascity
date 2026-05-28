-- ============================================================
-- Seed: CRM leads para empresa usuario01 (ObrasCitY demo)
-- empresa_id: 4ad2dbe4-2f9f-4741-83de-d5e0e4f99592
-- ============================================================

insert into public.crm_leads
  (empresa_id, nome, contato, cargo, email, telefone, valor, etapa, origem, obra, prioridade, ultima_atividade, notas)
values
  (
    '4ad2dbe4-2f9f-4741-83de-d5e0e4f99592',
    'Obra Residencial - João',
    'João', 'Proprietário', 'joao@email.com', '(11) 99000-0001',
    45000.00, 'Contato', 'Indicação', 'obra test', 'Baixa', '2025-06-01',
    'Primeiro contato realizado. Cliente interessado em reforma residencial. Aguardando retorno para marcar visita técnica.'
  ),
  (
    '4ad2dbe4-2f9f-4741-83de-d5e0e4f99592',
    'Obra Jardim - Pedro',
    'Pedro', 'Proprietário', 'pedro@email.com', '(11) 99000-0002',
    180000.00, 'Proposta', 'Prospecção', 'nova obra jardim', 'Média', '2025-06-10',
    'Proposta técnica enviada em 10/06. Cliente solicitou ajuste no cronograma para início em agosto. Revisão orçamentária pendente.'
  ),
  (
    '4ad2dbe4-2f9f-4741-83de-d5e0e4f99592',
    'Edifício Aurora Residence',
    'Diretor Aurora Incorporadora', 'Diretor de Projetos', 'diretoria@aurora.com.br', '(11) 3000-1001',
    2800000.00, 'Proposta', 'Licitação', 'REF - Edifício Aurora Residence', 'Média', '2025-06-05',
    'Proposta apresentada em reunião com a diretoria em 05/06. Incorporadora avaliando duas outras propostas concorrentes. Aguardar retorno até 30/06.'
  ),
  (
    '4ad2dbe4-2f9f-4741-83de-d5e0e4f99592',
    'Centro Empresarial Atlas',
    'Gerente Atlas Participações', 'Gerente de Obras', 'obras@atlas.com.br', '(11) 3000-2002',
    4200000.00, 'Negociação', 'Indicação', 'REF - Centro Empresarial Atlas', 'Alta', '2025-06-12',
    'Em negociação ativa. Cliente solicitou desconto de 8% e extensão de prazo. Contraproposta enviada com 5% de desconto e 3 meses adicionais. Reunião marcada para 20/06.'
  ),
  (
    '4ad2dbe4-2f9f-4741-83de-d5e0e4f99592',
    'Hospital São Lucas',
    'Coordenador Fundação Saúde Viva', 'Coordenador de Obras', 'obras@fsv.org.br', '(62) 3000-3003',
    6500000.00, 'Qualificação', 'Licitação', 'REF - Hospital São Lucas', 'Média', '2025-06-08',
    'Obra de grande porte — hospital de 120 leitos. Documentação técnica em análise. Visita ao terreno agendada para 25/06. Exige certificação sanitária da equipe.'
  ),
  (
    '4ad2dbe4-2f9f-4741-83de-d5e0e4f99592',
    'Ponte Rio Verde',
    'Fiscal DER', 'Fiscal de Obras DER', 'fiscalizacao@der.go.gov.br', '(62) 3000-4004',
    1900000.00, 'Fechado', 'Licitação', 'REF - Ponte Rio Verde', 'Baixa', '2025-05-22',
    'Contrato assinado em 22/05/2025. Obra concluída com sucesso. Termo de recebimento definitivo emitido. Potencial para novas licitações no estado.'
  ),
  (
    '4ad2dbe4-2f9f-4741-83de-d5e0e4f99592',
    'Projeto CAI CAI - Neymar',
    'Neymar Junior', 'Proprietário', 'contato@njsports.com', '(11) 99999-9999',
    320000.00, 'Contato', 'Indicação', 'Arrumando o CAI CAI', 'Alta', '2025-06-15',
    'Cliente VIP indicado por parceiro estratégico. Reforma de espaço esportivo privado. Reunião inicial marcada para 20/06. Alta prioridade — potencial de mídia e visibilidade.'
  )
on conflict do nothing;
