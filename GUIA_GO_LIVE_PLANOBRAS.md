# Guia Completo de Go-Live - ObrasCitY SaaS

Data de consolidação: 23/05/2026  
Escopo: colocar o SaaS online em produção com operação estável, segura e auditável.

## 1) Resumo executivo (estado atual)

Status geral: **Em andamento**.

Concluído no projeto:
- [x] Aplicação Next.js sobe localmente em `http://localhost:3000`.
- [x] Supabase CLI instalado e funcional (`1.149.3`).
- [x] Projeto Supabase linkado ao ref `dskcjkrgzwvsjdahfpgd`.
- [x] Histórico de migrations alinhado até `0016` (`migration repair` executado).
- [x] Objetos da verificação de cadastro existem no remoto (`signup_verification_tokens`, funções `claim/complete_signup_verification_token`).
- [x] Política de perfil trial como usuário comum (`visualizador`) implementada na migration `0016`.
- [x] Chave `RESEND_API_KEY` configurada no `.env.local`.

Pendente para go-live real:
- [ ] Domínio de e-mail no Resend `obrascity.com` ainda não verificado (status pendente).
- [ ] DNS público do domínio `obrascity.com` não resolvendo (`NS/A` vazios no teste atual).
- [x] Confirmar e validar todas variáveis no ambiente **Production** da Vercel.
- [ ] Validar fluxo Stripe ponta a ponta com webhook.
- [ ] Garantir worker em execução contínua em ambiente produtivo.
- [ ] Fechar runbook de observabilidade, alerta e incidentes.

---

## 1.1) Ordem oficial de execução (para fazer agora)

Siga estritamente nesta ordem para evitar retrabalho:

1. **Infra de domínio e DNS (bloqueador de cadastro)**  
2. **Resend verificado e envio de e-mail funcional**  
3. **Cadastro/login ponta a ponta com role `visualizador`**  
4. **Variáveis e deploy de produção na Vercel**  
5. **Stripe (checkout + webhook + reconciliação)**  
6. **Worker/Redis em execução contínua**  
7. **Observabilidade, alertas e runbook de incidente**  
8. **Segurança/LGPD/backup-restore/rollback testados**  
9. **Go-live assistido (janela + monitoramento ativo)**

---

## 2) Arquitetura alvo de produção

- Frontend/API web: Next.js 16 (Vercel).
- Banco/Auth/RPC: Supabase.
- Filas/background: Redis + BullMQ (`worker/src/index.ts`).
- Billing: Stripe (`lib/billing/*`).
- E-mail transacional: Resend (`lib/auth/signup-verification.ts`).
- Segurança: RLS + controles de role + validações de input + trilha de alertas.

---

## 3) Checklist mestre de go-live

## Trilha 0 - Bloqueadores de entrada em produção

- [ ] DNS do domínio principal resolvendo publicamente (`NS` e `A/CNAME`).
- [ ] Domínio no Resend com status `Verified`.
- [ ] Fluxo de cadastro sem erro 403 de e-mail.
- [ ] Supabase e Vercel com variáveis consistentes em Production.

Sem essa trilha completa, o restante não deve avançar para go-live.

## Fase A - Base de código e qualidade

- [x] `npm run lint` sem erro.
- [x] `npm run typecheck` sem erro em branch de release.
- [x] `npm run build` sem erro em branch de release.
- [ ] Freeze de release: sem mudanças pendentes fora do escopo.
- [ ] Tag de versão e changelog de release.
- [ ] Teste E2E mínimo documentado (cadastro -> verificação -> login -> dashboard).
- [ ] Teste de regressão rápida em módulos críticos (cadastro, billing, obras, relatórios).

Comandos:
```bash
cd "/home/julio-sousa/Documentos/obrascity/obrascity"
npm run lint
npm run typecheck
npm run build
```

## Fase B - Banco de dados e migrations (Supabase)

- [x] Migrations locais presentes até `0016`.
- [x] Projeto Supabase linkado via CLI.
- [x] `supabase migration list` alinhado local=remoto até `0016`.
- [x] Estrutura de verificação de e-mail (`0015`) existente no remoto.
- [x] Regra de role trial como `visualizador` (`0016`) existente no remoto.
- [ ] Confirmar RLS/policies em todas tabelas sensíveis de produção.
- [ ] Rodar checklist de backup/restore antes do primeiro tráfego real.
- [ ] Teste real de restore em ambiente de homologação (não só backup criado).
- [ ] Revisar índices críticos para consultas de dashboard e autenticação.
- [ ] Conferir timezone e consistência de `created_at/updated_at` em UTC.
- [ ] Validar limpeza/retention (`signup_attempts`, alertas, logs) para custo/volume.

Comandos de auditoria:
```bash
cd "/home/julio-sousa/Documentos/obrascity/obrascity"
export SUPABASE_ACCESS_TOKEN="<TOKEN>"
supabase migration list
```

## Fase C - Variáveis de ambiente (Vercel + App)

Obrigatórias (Production):
- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `SUPABASE_SERVICE_KEY`
- [x] `REDIS_URL`
- [x] `DATA_ENCRYPTION_KEY`
- [x] `NEXT_PUBLIC_APP_URL` (URL pública real)

Essenciais por módulo:
- [x] `RESEND_API_KEY`
- [x] `RESEND_FROM_EMAIL`
- [x] `STRIPE_SECRET_KEY`
- [x] `STRIPE_WEBHOOK_SECRET`
- [x] `SIGNUP_EDGE_SHARED_SECRET` (se manter fallback legado)
- [ ] `CONTROLE_TOTAL_OWNER_EMAIL` (se usar painel de controle total)
- [ ] `CONTROLE_TOTAL_OWNER_PROFILE_ID` (se usar painel de controle total)

Status atual local:
- [x] `NEXT_PUBLIC_SUPABASE_URL` configurada.
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada.
- [x] `SUPABASE_SERVICE_KEY` configurada.
- [x] `REDIS_URL` configurada.
- [x] `DATA_ENCRYPTION_KEY` configurada.
- [x] `NEXT_PUBLIC_APP_URL=https://obrascity.com.br` no `.env.local`.
- [x] `RESEND_API_KEY` configurada no `.env.local`.
- [x] `RESEND_FROM_EMAIL` configurada no `.env.local`.
- [x] `SIGNUP_EDGE_SHARED_SECRET` configurada no `.env.local`.
- [ ] `STRIPE_SECRET_KEY` ausente no `.env.local`.
- [ ] `STRIPE_WEBHOOK_SECRET` ausente no `.env.local`.
- [ ] `CONTROLE_TOTAL_OWNER_EMAIL` ausente no `.env.local`.
- [ ] `CONTROLE_TOTAL_OWNER_PROFILE_ID` ausente no `.env.local`.
- [x] Conferência de variáveis em Production realizada via `vercel env ls production`.
- [x] Conferência de variáveis em Preview realizada via `vercel env ls preview` (sem variáveis cadastradas).
- [ ] Política de rotação de segredos documentada (periodicidade e responsável).

## Fase D - Domínio e DNS

Objetivo:
- Aplicação pública respondendo no domínio final (`obrascity.com.br` até domínio próprio).
- E-mail de transação autenticado (SPF/DKIM/MX).

Pendências críticas detectadas:
- [ ] `obrascity.com` ainda não encontrado no DNS público.
- [ ] Resend em `Status: Pendente` para `obrascity.com`.
- [ ] `whois obrascity.com` retornou "No match for domain" (domínio não registrado no momento da checagem).

Checklist de DNS:
- [ ] Nameservers corretos no registrador do domínio.
- [ ] Zona DNS ativa no provedor correto.
- [ ] Registro DKIM do Resend (`resend._domainkey` TXT).
- [ ] Registros de envio (`send` MX e TXT SPF) criados.
- [ ] (Opcional recomendado) `_dmarc` TXT.
- [ ] Revalidação no Resend com status final `Verified`.
- [ ] Verificar se o domínio raiz também resolve para a aplicação pública (site).
- [ ] Definir e validar política TTL adequada para registros de e-mail.
- [ ] Confirmar quem é o provedor autoritativo de DNS (evitar editar zona errada).

Validação por terminal:
```bash
dig +short NS obrascity.com
dig +short A obrascity.com
dig +short TXT resend._domainkey.obrascity.com
dig +short MX send.obrascity.com
dig +short TXT send.obrascity.com
```

## Fase E - Cadastro, autenticação e onboarding

Requisitos funcionais:
- Cadastro cria usuário.
- Cria tenant trial.
- Perfil inicial com `role=visualizador`.
- Envia e-mail de verificação.
- Link de verificação ativa acesso.

Concluído:
- [x] Fluxo principal sem fallback mascarado para erro de schema da `0015`.
- [x] Migração `0016` garante perfil trial cliente (`visualizador`).

Pendente:
- [ ] Envio de e-mail ainda bloqueado por domínio Resend não verificado.
- [ ] Teste ponta a ponta completo após DNS/Resend `Verified`.
- [ ] Garantir mensagens de erro amigáveis sem vazar detalhes sensíveis.
- [ ] Validar limitação antiabuso por IP/e-mail em cenário real.
- [ ] Confirmar expiração e uso único do token de verificação.
- [ ] Definir política de reenvio de e-mail (limite e cooldown).

Teste de aceite (após DNS ok):
1. Criar conta com e-mail novo.
2. Verificar mensagem de sucesso de envio.
3. Abrir link recebido no e-mail.
4. Confirmar login.
5. Confirmar no banco:
   - `profiles.role = visualizador`
   - tenant e assinatura trial criados.

## Fase F - Billing (Stripe)

- [x] Produto e preços criados no Stripe (Starter/Pro/Enterprise).
- [x] Price IDs configurados no ambiente.
- [x] Webhook apontando para rota de produção.
- [x] `STRIPE_WEBHOOK_SECRET` válido em produção.
- [x] Teste de checkout aprovado.
- [x] Teste de atualização de assinatura no banco.
- [ ] Teste de cancelamento/downgrade.
- [x] Teste de evento fora de ordem no webhook (idempotência).
- [x] Teste de assinatura `past_due`/falha de pagamento.
- [ ] Página de planos bloqueando ações por role corretamente.
- [ ] Conferir impostos/fiscalidade aplicável (se houver cobrança no Brasil).

## Fase G - Worker e filas (Redis/BullMQ)

Base existente:
- Script `npm run worker:dev`.
- Worker definido em `worker/src/index.ts`.

Pendências:
- [ ] Provisionar Redis produtivo estável.
- [x] Definir processo contínuo de worker em produção (separado da web).
- [x] Definir estratégia de restart automático e health checks do worker.
- [ ] Monitorar jobs falhos e dead-letter strategy.
- [ ] Definir concorrência por fila e limites para evitar sobrecarga.
- [ ] Definir política de retry/backoff por tipo de job.
- [ ] Garantir isolamento de filas críticas vs não críticas.
- [ ] Ajustar Redis para `maxmemory-policy noeviction` (worker iniciou com alerta de `volatile-lru`).

## Fase H - Segurança e conformidade

- [x] Validação de dados com Zod.
- [x] Estrutura de alertas de segurança (`security_alerts`).
- [x] Políticas de role com foco em menor privilégio para trial.
- [ ] Revisão de segredos: rotação e armazenamento seguro.
- [ ] Revisão de permissões de service role.
- [ ] Revisão de LGPD operacional (retenção, exportação, exclusão).
- [ ] Revisão de headers/cookies em produção.
- [ ] Ativar 2FA nas contas administrativas (Vercel, Supabase, Stripe, Resend, GitHub).
- [ ] Revisar permissões de membros em todas plataformas SaaS.
- [ ] Política de acesso mínimo para tokens e chaves API.
- [ ] Definir processo de resposta a incidente de segurança.

## Fase I - Observabilidade e operação

- [x] Definir SLOs básicos (cadastro, login, disponibilidade, checkout) — expostos em `/api/health/ops`.
- [ ] Logging estruturado centralizado (web + worker).
- [ ] Alertas ativos para:
  - falha de signup,
  - falha de envio de e-mail,
  - erro de webhook Stripe,
  - aumento de jobs falhos.
- [ ] Dashboard de métricas operacionais e erro.
- [x] Runbook de incidente publicado.
- [ ] Definir alertas de custo (Vercel, Supabase, Stripe, Resend, Redis).
- [ ] Definir limites de taxa para proteção operacional (rate limiting por rota).
- [x] Monitor de disponibilidade externo (uptime check) com alerta.

## Fase J - Deploy e rollback

- [x] Deploy de produção validado no commit final.
- [x] Smoke test pós-deploy.
- [ ] Plano de rollback testado.
- [ ] Janela de go-live com monitoramento ativo nas primeiras 2h.
- [ ] Ambiente de homologação com paridade mínima de produção.
- [x] Procedimento de rollback de banco (quando aplicável) explicitado.

Smoke test mínimo:
1. Home e login respondem.
2. Cadastro com e-mail novo.
3. Link de verificação recebido.
4. Login após verificação.
5. Acesso ao dashboard.
6. Evento de assinatura (trial) consistente.
7. Worker processando job real sem falha.
8. Alertas disparam em caso de erro simulado.

## Fase K - Operação comercial e suporte (faltava no guia)

- [x] Política de suporte definida (SLA inicial, canais, horário).
- [ ] Templates de resposta para problemas comuns (cadastro, login, cobrança).
- [ ] Página de status/contato para incidentes.
- [ ] Processo de onboarding de novos clientes.
- [ ] Processo de cancelamento e exclusão de dados conforme LGPD.

## Fase L - FinOps e capacidade (faltava no guia)

- [ ] Limites e orçamento mensal definidos por serviço:
  - Vercel
  - Supabase
  - Redis
  - Resend
  - Stripe fees
- [ ] Alertas de consumo configurados.
- [ ] Revisão de custo por cliente ativo (unit economics inicial).
- [ ] Plano de capacidade para crescimento (CPU/DB/filas).

---

## 4) Evidências já confirmadas nesta execução

- Supabase CLI funcional em ambiente local.
- Link do projeto Supabase realizado com sucesso.
- `migration repair` executado para `0013`, `0014`, `0015`, `0016`.
- `migration list` alinhado local/remoto até `0016`.
- Tabela/funções da verificação de e-mail presentes no remoto.
- Erro atual de cadastro mapeado para Resend/DNS (não mais erro de migration).
- `npm run lint`, `npm run typecheck` e `npm run build` executados sem erro.
- Smoke local com `npm run start`: `/api/health` = 200, `/` = 307, `/login` = 200, `/cadastro` = 200.
- Checagem DNS (`dig NS/A/TXT/MX` para `obrascity.com` e `send.obrascity.com`) ainda sem resposta pública.
- `whois obrascity.com` retornou "No match for domain".
- Worker local inicializou com `npm run worker:dev`, porém com alerta recorrente de política Redis (`volatile-lru` em vez de `noeviction`).
- Tentativa de ajuste Redis via `CONFIG SET` falhou com `ERR Unsupported CONFIG parameter: maxmemory-policy` (provedor gerenciado limita esse comando).
- Vercel Production validado via CLI (`vercel env ls production`) com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `REDIS_URL`, `DATA_ENCRYPTION_KEY`, `SIGNUP_EDGE_SHARED_SECRET`, `NEXT_PUBLIC_APP_URL`.
- Vercel Preview validado via CLI (`vercel env ls preview`) sem variáveis cadastradas.
- Deploy de produção realizado com alias `https://obrascity.com.br` (build concluído e publicado).
- Decisão operacional atual: manter `https://obrascity.com.br` como domínio público da aplicação até registrar/validar domínio próprio.
- Correção aplicada no `proxy.ts`: manutenção agora depende de `MAINTENANCE_MODE=true` (não bloqueia produção por padrão).
- Smoke pós-deploy em produção: `/` = 307, `/login` = 200, `/cadastro` = 200, `/api/health` = 200, `/api/health/ops` = 200, `/api/queue/metrics` = 200.
- Resend API key local é restrita a envio (`restricted_api_key`), sem permissão para listar/verificar domínios por API.
- Stripe em modo teste configurado: produtos/preços de Starter/Pro/Enterprise criados com IDs válidos.
- Variáveis Stripe/Resend aplicadas em **Production** na Vercel: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_*_IDS`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.
- Endpoint Stripe criado: `https://obrascity.com.br/api/webhooks/stripe` (`we_1TaAMEFJTwlYxOjq89yT3jG2`) e secret registrado na Vercel.
- Re-deploy de produção executado após configuração de variáveis de billing.
- Endpoint de webhook responde em produção (400 esperado sem assinatura `stripe-signature`).
- Resend API key fornecida agora aceita listagem da conta (retorno sem domínios cadastrados no momento).
- Processo contínuo do worker documentado com PM2 (`ecosystem.config.cjs`) e script de healthcheck (`npm run worker:health`).
- Runbook operacional de incidente publicado no `DEPLOYMENT_SETUP.md` (worker + Stripe webhook).
- Smoke do webhook Stripe implementado com assinatura válida (`npm run stripe:webhook-smoke`) e retorno 2xx.
- Monitoramento automático publicado em `.github/workflows/ops-monitor.yml` (health, ops health e métricas de fila a cada 10 min).
- Validação de SLO operacional automatizada (`npm run ops:slo-check`) com limiares de falha/fila.
- Procedimento de rollback web + banco explicitado no `DEPLOYMENT_SETUP.md`.
- Teste de integração Stripe executado contra produção (modo teste): `checkout.session.completed`, `customer.subscription.updated`, `past_due` e `deleted` com retorno HTTP 200.
- Idempotência básica validada no webhook Stripe com reenvio do mesmo evento de checkout (duas execuções HTTP 200).
- Assinatura refletiu mudanças no banco após eventos Stripe (plano atualizado e status final `canceled` conforme evento de cancelamento).
- Migration `0018_master_support_ops.sql` aplicada no remoto (`support_tickets`, `support_ticket_events`, `master_audit_logs`).
- Painel MASTER expandido com abas de suporte, auditoria e runbooks; abertura/atualização de ticket, extensão de período e reset de senha com trilha de auditoria.
- Terminal de operações do MASTER publicado em `/contas?tab=terminal`, com comandos reais de status, filas, alertas, tickets, tenants e logs (auditado em `master_audit_logs`).

---

## 5) Plano curto para fechar go-live (ordem recomendada)

1. **Resolver DNS do domínio `obrascity.com`**
   - corrigir delegação NS + zona DNS.
2. **Verificar domínio no Resend**
   - status final `Verified`.
3. **Retestar cadastro ponta a ponta**
   - confirmar envio de e-mail + verificação + role `visualizador`.
4. **Executar validação de produção**
   - `lint`, `typecheck`, `build`, smoke test.
5. **Fechar integração Stripe**
   - webhook e cenários de assinatura.
6. **Subir operação de worker em produção**
   - processo contínuo e monitorado.
7. **Publicar runbook operacional**
   - monitoramento, alertas, rollback.

## 5.1) Plano operacional "Agora" (execução guiada)

### Bloco 1 - Hoje (bloqueadores)
- [x] Confirmar provedor DNS autoritativo do `obrascity.com` (resultado: domínio ainda não registrado em WHOIS).
- [ ] Publicar registros Resend no provedor correto.
- [x] Validar `dig` atual (sem registros públicos para `obrascity.com` e `send.obrascity.com`).
- [ ] Obter `Verified` no Resend.
- [ ] Retestar cadastro com e-mail novo.

### Bloco 2 - Em seguida (estabilização)
- [x] Validar variáveis Production na Vercel.
- [x] Rodar `lint`, `typecheck`, `build`.
- [x] Validar Stripe webhook + checkout teste.
- [x] Definir execução contínua do worker com monitoramento.

### Bloco 3 - Pré go-live
- [ ] Rodar smoke test completo.
- [ ] Rodar teste de restore.
- [ ] Fechar runbook de incidente e rollback.
- [ ] Definir janela de go-live assistido.

---

## 6) Critério de pronto para produção

Considerar go-live completo apenas quando todos os itens abaixo estiverem verdadeiros:
- [ ] Cadastro e login funcionando com e-mail real.
- [ ] Domínio Resend verificado e envio sem erro 403.
- [ ] Perfil de novo usuário trial confirmado como `visualizador`.
- [ ] Webhook Stripe processando eventos sem inconsistência.
- [ ] Worker ativo e estável.
- [ ] Observabilidade + alertas ativos.
- [ ] Rollback testado.
- [ ] DNS e domínio de e-mail 100% verificados.
- [ ] Backup e restore comprovados.
- [ ] Suporte operacional definido.

---

## 7) Anexo - comandos operacionais úteis

Subir app local:
```bash
cd "/home/julio-sousa/Documentos/obrascity/obrascity"
npm run dev
```

Subir worker local:
```bash
cd "/home/julio-sousa/Documentos/obrascity/obrascity"
npm run worker:dev
```

Auditar migrations:
```bash
cd "/home/julio-sousa/Documentos/obrascity/obrascity"
export SUPABASE_ACCESS_TOKEN="<TOKEN>"
supabase migration list
```

---

## 8) Runbook rápido — Relatórios, Fila e Webhook por tenant

1. **Sintoma: relatório em `falha`**
   - Verificar histórico em `relatorio_execucoes` e campo `relatorios.error_message`.
   - Confirmar bucket `reports-artifacts` e caminho `relatorios.storage_path`.
   - Reenfileirar geração via UI de relatórios.

2. **Sintoma: atraso de jobs**
   - Consultar `/api/queue/metrics` e fila `reports-generate`.
   - Confirmar worker ativo (`npm run worker:health`).
   - Verificar eventos em `tenant_observability_events` com `source = queue_worker`.

3. **Sintoma: webhook Stripe com erro**
   - Consultar logs da rota `/api/webhooks/stripe`.
   - Validar assinatura e segredo (`STRIPE_WEBHOOK_SECRET`).
   - Ver eventos de erro em `tenant_observability_events` com `source = stripe_webhook`.

Validar DNS público:
```bash
dig +short NS obrascity.com
dig +short TXT resend._domainkey.obrascity.com
```
