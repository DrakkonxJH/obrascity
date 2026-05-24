# Plano Mestre - CRM ObrasFlow com Base WeKan

Data: 24/05/2026  
Objetivo: substituir o CRM atual por uma experiência CRM robusta, com engine WeKan, acesso único via login ObrasFlow e identidade visual 100% ObrasFlow.

## 1) Princípios inegociáveis

1. Usuário final **nunca** acessa login do WeKan.
2. Entrada oficial única: `https://obrasflow.com/crm`.
3. Sem sessão no ObrasFlow: redireciona para `/login?next=/crm`.
4. Com sessão no ObrasFlow: acesso automático ao CRM.
5. **Isolamento de dados por empresa obrigatório:** usuários da mesma empresa compartilham os mesmos cards/dados do CRM; usuários de empresas diferentes **nunca** veem dados entre si.
6. As regras de isolamento e segurança valem para **todos os tipos de conta de cliente** (Starter, Pro, Enterprise e equivalentes).
7. **Conta Master é exceção operacional:** não é conta de cliente; é conta administrativa exclusiva do proprietário para manutenção, acompanhamento, reparos e suporte.

## 2) Premissas e fora de escopo

### Premissas
- `obras-saas` (Next.js) permanece como gateway de autenticação/autorização.
- Supabase permanece como origem de identidade da sessão principal.
- WeKan roda internamente, sem exposição pública direta.

### Fora de escopo (nesta entrega)
- Reescrever a engine do WeKan.
- Novo módulo de billing dentro do CRM.
- Permissões ultra-granulares por card (fase futura, se necessário).

## 3) Decisão de arquitetura (recomendada)

Arquitetura alvo:
1. `obras-saas` (Next.js) como gateway de autenticação.
2. WeKan como serviço interno (não público).
3. Proxy seguro de `/crm` no Next.js para o serviço interno.
4. Provisionamento automático de usuário CRM no primeiro acesso.
5. Mapeamento obrigatório de `company_id` para todo usuário/sessão/consulta.

Decisões técnicas obrigatórias antes da implementação:
1. **Ponte de identidade (SSO):**
   - token interno assinado no backend (curta duração, ex.: 60-120s).
   - validação server-to-server entre gateway e serviço CRM.
   - rotação de segredo/chave e revogação em incidente.
2. **Autorização e isolamento de tenant:**
   - toda consulta/escrita no CRM deve carregar `company_id`.
   - bloqueio hard-fail se `company_id` ausente/divergente.
   - política de visibilidade padrão: usuários da mesma empresa compartilham boards/cards da empresa.
3. **Sessão e segurança web:**
   - cookies `HttpOnly`, `Secure`, `SameSite`.
   - headers de segurança e CSP no gateway.
   - proteção CSRF/replay para endpoints de ponte.

## 3.1) Modelo de contas e exceções de acesso

### Contas de cliente
- Aplicar isolamento por `company_id` em 100% das operações.
- Compartilhamento permitido somente entre usuários da mesma empresa.
- Nenhuma exceção por plano comercial.

### Conta Master (operacional)
- Conta exclusiva do proprietário para manutenção/suporte.
- Não participa de fluxo comercial do cliente e não substitui contas de cliente.
- Acesso privilegiado com:
  - MFA obrigatória.
  - sessão curta e rastreada.
  - trilha de auditoria com motivo de intervenção.
  - permissão de emergência com revisão posterior (break-glass controlado).

## 4) Escopo funcional fechado

### Obrigatório
- [ ] `/crm` protegido por sessão ObrasFlow.
- [ ] acesso direto ao host interno do WeKan bloqueado.
- [ ] sem tela de login WeKan para usuários finais.
- [ ] header padrão ObrasFlow no CRM.
- [ ] nome e identidade: `ObrasFlow CRM`.
- [ ] criação automática de usuário CRM no primeiro acesso.
- [ ] mapeamento `obrasflow_user_id <-> crm_user_id <-> company_id`.
- [ ] isolamento rígido por empresa validado em teste (sem vazamento entre empresas).
- [ ] regras aplicadas a todos os planos de cliente (sem exceções por tipo de conta comercial).
- [ ] conta Master com controle de acesso privilegiado e auditoria ativa.

### Desejável (ideal)
- [ ] mapeamento de perfil ObrasFlow -> permissões CRM.
- [ ] logs de auditoria de ações CRM.
- [ ] monitoramento e alertas de disponibilidade do CRM.
- [ ] backup/restore do banco CRM testado.
- [ ] trilha de alterações administrativas sensíveis.

## 5) Plano de implementação (12 dias úteis)

## Fase A - Fundamentos e segurança de borda (D1-D2)
1. Criar fork operacional do WeKan:
   - repo: `obrasflow-crm` (privado).
2. Definir infraestrutura:
   - WeKan + Mongo em compose/k8s.
3. Isolar rede:
   - WeKan sem exposição pública.
   - acesso somente via proxy do Next.js.
4. Configurar health checks internos.

Entregável:
- stack CRM rodando internamente e invisível para internet.

## Fase B - Gate de autenticação ObrasFlow (D3-D4)
1. Implementar rota protegida `/crm` no app principal.
2. Reusar middleware de sessão Supabase.
3. Sem sessão:
   - `302` para `/login?next=/crm`.
4. Com sessão:
   - liberar proxy para CRM.

Entregável:
- navegação segura para CRM com controle de sessão unificado.

## Fase C - SSO sem login próprio + isolamento por empresa (D5-D6)
1. Implementar ponte de identidade:
   - valida usuário autenticado no ObrasFlow.
   - cria/atualiza conta no CRM no primeiro acesso.
2. Persistir mapeamento:
   - `obrasflow_user_id <-> crm_user_id <-> company_id`.
3. Injetar sessão no contexto do CRM via backend/proxy.
4. Desativar UX de login do WeKan para usuários finais.
5. Aplicar filtro obrigatório por `company_id` em leitura/escrita/listagem.

Entregável:
- fluxo “login único” funcional, com segregação de dados entre empresas.

## Fase D - Branding completo ObrasFlow (D7-D8)
1. Trocar branding visual:
   - logo, favicon, título, textos, rodapé.
2. Aplicar paleta ObrasFlow:
   - botões, links, topo, estados visuais.
3. Incluir header ObrasFlow no CRM:
   - marca, atalho “voltar ao app”, logout.
4. Revisar contraste/acessibilidade.

Entregável:
- CRM visualmente consistente com todo o produto.

## Fase E - Qualidade, observabilidade e hardening (D9-D10)
1. Logs:
   - acesso, erro de sessão, falha de provisionamento, tentativas cross-tenant.
2. Alertas:
   - indisponibilidade `/crm`, erro 5xx no proxy, anomalia de autorização.
3. Rate limit:
   - proteção de endpoints CRM gateway.
4. Segurança:
   - headers, CSP, cookies seguros.
5. Auditoria:
   - trilha de ações críticas no CRM.

Entregável:
- operação estável, segura e auditável.

## Fase F - Go-live controlado (D11-D12)
1. UAT interno com contas reais de empresas diferentes.
2. Checklist de aceite.
3. Janela de publicação.
4. Monitoramento assistido pós-go-live (2h).
5. Plano de rollback pronto.

Entregável:
- CRM em produção com risco controlado.

## 6) Plano de migração de dados (do CRM atual)

1. Inventário de entidades:
   - leads, empresas, contatos, boards, cards, anexos, comentários.
2. Mapeamento de campos:
   - origem -> destino WeKan/ObrasFlow CRM.
3. Regra de tenant:
   - cada registro deve carregar `company_id` válido antes de importar.
4. Dry-run:
   - migração de amostra + validação funcional.
5. Cutover:
   - janela de congelamento curta + validação + reabertura.
6. Contingência:
   - rollback dos dados para snapshot anterior.

## 7) SLO, backup e continuidade

### SLO/SLI mínimos
- Disponibilidade `/crm`: >= 99,5% mensal.
- Latência p95 no gateway `/crm`: <= 700ms (navegação autenticada).
- Taxa de erro 5xx no proxy: <= 1% diário.

### Backup e recuperação
- Backup diário do Mongo.
- Retenção mínima: 30 dias.
- Restore drill mensal obrigatório.
- RPO alvo: 24h.
- RTO alvo: 2h.

## 8) Critérios de aceite (Definition of Done)

### Critérios obrigatórios
1. `/crm` sem login do WeKan.
2. Usuário não autenticado vai para login ObrasFlow.
3. Usuário autenticado entra no CRM em 1 passo.
4. Identidade visual ObrasFlow aplicada no CRM.
5. Logs e alertas ativos.
6. Rollback testado.
7. **Teste cross-tenant aprovado:** usuário Empresa A não vê nenhum card/board/dado da Empresa B.
8. **Teste same-tenant aprovado:** usuários da mesma empresa compartilham dados/cards da empresa.
9. **Teste multi-plano aprovado:** regras idênticas para contas de cliente em todos os planos.
10. **Teste Master aprovado:** acesso administrativo auditado, com registro de motivo e sem quebrar segregação entre empresas.

### Critérios de excelência
1. p95 dentro da meta definida.
2. Zero erro crítico em smoke test.
3. Onboarding de conta nova claro.
4. Documentação operacional pronta.
5. Migração executada sem perda de dados críticos.

## 9) Riscos e mitigação

Risco 1: acoplamento excessivo do fork com upstream WeKan  
Mitigação:
- manter mudanças concentradas em camada de tema/proxy/integração.
- sincronização periódica com upstream (`upstream-sync`) e testes de regressão.

Risco 2: quebra de sessão em integração SSO  
Mitigação:
- testes automatizados de login/callback/proxy.
- monitorar taxa de falha de autenticação por release.

Risco 3: dificuldade de manutenção do fork  
Mitigação:
- branch strategy clara:
  - `upstream-sync`
  - `obrasflow-main`
  - `obrasflow-theme`

Risco 4: exposição acidental do CRM interno  
Mitigação:
- WAF + rede privada + deny public ingress.
- validações automatizadas de deploy para bloquear exposição.

Risco 5: vazamento de dados entre empresas  
Mitigação:
- `company_id` obrigatório em todas as operações.
- testes E2E cross-tenant em pipeline.
- alerta de segurança para qualquer tentativa de acesso cruzado.

Risco 6: uso indevido de privilégios da conta Master  
Mitigação:
- MFA obrigatória + sessão curta.
- auditoria de todas as ações administrativas.
- processo de revisão periódica dos acessos privilegiados.

## 10) Plano de rollback

1. Feature flag de menu CRM no app principal.
2. Em incidente:
   - desativar acesso `/crm` no gateway.
   - manter app principal intacto.
3. Restaurar versão anterior do serviço CRM.
4. Restaurar snapshot de dados (se necessário).
5. Validar acesso interno e reabrir gradualmente.

## 11) Checklist operacional “fazer agora” (com donos)

| Item | Owner | Prazo | Status | Dependência |
|---|---|---|---|---|
| Criar repositório `obrasflow-crm` | Engenharia | D1 | Pendente | - |
| Provisionar ambiente interno WeKan+Mongo | Infra/SRE | D1-D2 | Pendente | Repo criado |
| Definir política de acesso `crm.obrasflow.com` | Segurança/Infra | D2 | Pendente | Ambiente interno |
| Implementar `/crm` protegido | Backend | D3-D4 | Pendente | Middleware de sessão |
| Provisionamento automático de usuário | Backend | D5 | Pendente | `/crm` protegido |
| Implementar mapeamento com `company_id` | Backend | D5 | Pendente | Provisionamento |
| Bloquear login nativo WeKan no fluxo final | Backend | D6 | Pendente | Ponte SSO |
| Validar teste cross-tenant e same-tenant | QA | D6-D7 | Pendente | Mapeamento tenant |
| Implementar trilha de auditoria da conta Master | Backend/SRE | D7 | Pendente | Controle de sessão |
| Implementar MFA obrigatória na conta Master | Segurança/Backend | D7 | Pendente | Identidade ativa |
| Aplicar header/paleta/textos ObrasFlow | Frontend | D7-D8 | Pendente | SSO funcional |
| Configurar logs, alertas e rate limit | SRE | D9-D10 | Pendente | Proxy ativo |
| Configurar backup + restore drill | SRE/DBA | D10 | Pendente | Banco operacional |
| UAT final + go-live assistido | Produto/QA/SRE | D11-D12 | Pendente | Todos anteriores |

## 12) Evidência esperada por etapa

- Captura do fluxo:
  - login ObrasFlow -> `/crm` -> board aberto sem novo login.
- Logs:
  - evento de auto-provisionamento de usuário CRM.
- Segurança:
  - tentativa de acesso direto ao CRM interno bloqueada.
  - tentativa cross-tenant bloqueada e auditada.
- Branding:
  - telas com header e identidade ObrasFlow.
- Operação:
  - resultado do restore drill com tempo de recuperação medido.

## 13) Runbooks mínimos

1. Incidente de autenticação (`/crm` redirecionando em loop).
2. CRM indisponível (5xx elevado).
3. Falha de provisionamento de usuário.
4. Alerta de tentativa cross-tenant.
5. Procedimento de rollback com feature flag e restauração de snapshot.
6. Procedimento de intervenção da conta Master (acesso emergencial e pós-revisão).

## 14) Conclusão

Este plano viabiliza substituição total do CRM atual por um CRM maduro, sem fricção de login, com experiência unificada do ObrasFlow e governança técnica adequada para escalar com segurança. O isolamento por empresa fica definido como requisito obrigatório e testável, prevenindo qualquer exposição de dados entre clientes.
