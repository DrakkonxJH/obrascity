# Pendências de Auditoria — ObrasCitY

Data da consolidação: 27/05/2026  
Escopo: site público, páginas legais e consistência comercial/compliance.  
Base: auditoria recebida + validação no código local do repositório `DrakkonxJH/obrascity`.

## 1) Resumo executivo

- Críticos já corrigidos no código local: typo no hero, WhatsApp fake, selo ISO no rodapé da landing, meta title de login/cadastro, CTA "Agendar demonstração", menção de CRM em Termos.
- Pendências críticas ainda abertas: identificação legal completa (razão social/CNPJ/endereço), canal DPO real e verificável, revisão jurídica final de Termos e Privacidade.
- Pendências importantes: robustez comercial da landing (provas reais, demo real), qualidade de UX em `/como-funciona`, `/sobre`, cadastro e login.
- Pendências de certificação: ainda não há trilha formal documentada de certificações (status, escopo, cronograma, responsável).

## 2) Pendências em aberto (priorizadas)

## 2.1 Críticas / urgentes

- [ ] Publicar identificação legal completa do controlador nos documentos legais.
  - Ação: incluir razão social, CNPJ, endereço jurídico e canal oficial de contato.
  - Arquivos: `app/(auth)/termos/page.tsx`, `app/(auth)/privacidade/page.tsx`.
  - Dono sugerido: Jurídico + Produto.

- [ ] Confirmar e ativar canal DPO com atendimento externo (não-cliente).
  - Ação: manter e-mail público funcional (ex.: `dpo@...`) com SLA e fluxo de resposta.
  - Arquivo: `app/(auth)/privacidade/page.tsx`.
  - Dono sugerido: Jurídico + Suporte.

- [ ] Revisão jurídica final de Termos/Privacidade (LGPD e oferta comercial).
  - Ação: validar versão final com assessor jurídico; remover ambiguidades de papel Controlador/Operador.
  - Arquivos: `app/(auth)/termos/page.tsx`, `app/(auth)/privacidade/page.tsx`.
  - Dono sugerido: Jurídico.

## 2.2 Importantes

- [ ] Substituir depoimentos genéricos por prova social real.
  - Ação: usar cases verificáveis (cliente, cargo, autorização de uso).
  - Arquivo: `public/landing.html`.
  - Dono sugerido: Marketing.

- [ ] Adicionar demo real do produto (vídeo curto 2-3 min).
  - Ação: integrar seção com vídeo real e CTA rastreável.
  - Arquivo: `public/landing.html`.
  - Dono sugerido: Marketing + Produto.

- [ ] Evoluir `/como-funciona` com material visual forte.
  - Ação: incluir prints reais, fluxo por etapa e evidências de resultado.
  - Arquivo: `app/como-funciona/page.tsx`.
  - Dono sugerido: Produto + Design.

- [ ] Enriquecer `/sobre` com identidade real do time.
  - Ação: adicionar fundadores, fotos, histórico e marcos verificáveis.
  - Arquivo: `app/sobre/page.tsx`.
  - Dono sugerido: Marca + Marketing.

- [ ] Melhorar UX de cadastro (feedback de senha e critérios visíveis).
  - Ação: exibir política de senha, força e validação em tempo real.
  - Arquivo: `app/(auth)/cadastro/signup-form.tsx`.
  - Dono sugerido: Produto + Frontend.

- [ ] Avaliar login social (Google OAuth) para reduzir fricção.
  - Ação: decidir estratégia de autenticação e habilitar fluxo.
  - Arquivos: `app/(auth)/login/*`, configuração Supabase Auth.
  - Dono sugerido: Produto + Backend.

- [ ] Revisar timeline de versões legais (v1/v2/v3 no mesmo dia).
  - Ação: manter histórico jurídico auditável com motivo de cada revisão.
  - Arquivos: `app/(auth)/termos/page.tsx`, `app/(auth)/privacidade/page.tsx`.
  - Dono sugerido: Jurídico.

## 2.3 Melhorias

- [ ] Publicar página de status (uptime/incidentes).
  - Ação: integrar Instatus/BetterUptime e linkar no rodapé.
  - Dono sugerido: SRE/Operações.

- [ ] Consolidar `/contato` como hub de conversão.
  - Ação: incluir formulário, rota comercial, SLA e tracking.
  - Arquivo: `app/contato/page.tsx`.
  - Dono sugerido: Comercial + Frontend.

- [ ] Adicionar schema markup e melhorias SEO nas páginas legais.
  - Ação: incluir dados estruturados e navegação contextual.
  - Dono sugerido: SEO + Frontend.

- [ ] Validar claim "funciona offline" com checklist técnico.
  - Ação: evidenciar limites offline/sync e publicar critérios reais de suporte.
  - Arquivo: `public/landing.html` + módulo mobile.
  - Dono sugerido: Produto + Engenharia.

- [ ] Publicar changelog externo.
  - Ação: manter histórico de releases e mudanças relevantes para clientes.
  - Dono sugerido: Produto + Suporte.

## 3) Certificações — plano de ação ("solicitar"/"adquirir")

Objetivo: estruturar trilha formal para credibilidade enterprise e redução de risco comercial/jurídico.

## 3.1 Segurança e privacidade (prioridade alta)

- [ ] **Solicitar** diagnóstico de prontidão para ISO/IEC 27001.
  - Saída esperada: gap analysis, escopo, custo e cronograma.

- [ ] **Adquirir** consultoria de implementação SGSI (ISO 27001).
  - Saída esperada: políticas, controles, evidências e auditoria interna.

- [ ] **Solicitar** orçamento de auditoria externa ISO 27001 com organismo certificador.
  - Saída esperada: proposta formal com fase 1 e fase 2.

- [ ] **Adquirir** trilha SOC 2 (Type I -> Type II), se alvo incluir clientes internacionais.
  - Saída esperada: roadmap de controles e janela de observação.

- [ ] **Solicitar** avaliação de adequação LGPD contínua (jurídico + técnico).
  - Saída esperada: relatório de conformidade, ROPA e plano de remediação.

## 3.2 Disponibilidade e continuidade (prioridade média)

- [ ] **Solicitar** definição de metas SLO/SLA oficiais (uptime, suporte, incidente).
  - Saída esperada: compromisso comercial auditável por plano.

- [ ] **Adquirir** rotina formal de backup/restore com teste periódico documentado.
  - Saída esperada: evidência de restore testado e tempo de recuperação.

## 3.3 Governança e confiança comercial

- [ ] **Solicitar** política oficial de gestão de vulnerabilidades e resposta a incidentes.
  - Saída esperada: documento público resumido + procedimento interno detalhado.

- [ ] **Adquirir** processo de due diligence para fornecedores críticos (cloud, pagamentos, e-mail).
  - Saída esperada: inventário de risco de terceiros e plano de tratamento.

## 4) Checklist operacional imediato (próximos 7 dias)

- [ ] Definir dados legais oficiais para Termos/Privacidade (razão social, CNPJ, endereço).
- [ ] Confirmar canais públicos reais: `juridico@`, `privacidade@`, `dpo@`.
- [ ] Aprovar revisão jurídica final dos textos.
- [ ] Remover qualquer claim de certificação não adquirida de todas as páginas públicas.
- [ ] Decidir roadmap formal: ISO 27001 (obrigatório) + SOC 2 (opcional por mercado).
- [ ] Publicar plano de certificações com dono, orçamento e datas-alvo.

## 5) Critério de conclusão desta auditoria

Considerar a auditoria "fechada" somente quando:

- Itens críticos estiverem com evidência publicada no site e aprovados juridicamente.
- Pendências de certificação tiverem plano formal aprovado ("solicitar"/"adquirir" com datas).
- Claims públicos refletirem apenas capacidades e certificações comprovadas.
