# ObrasFlow (obras-saas)

Plataforma SaaS para gestão de obras com operação multiempresa (tenant), focada em controle operacional, financeiro e governança.

## O que este projeto entrega hoje

- **Módulos principais:** Dashboard, Obras, Cronograma, Financeiro, Equipes, Materiais, Diário, Qualidade, Relatórios, Portal do Cliente, Governança e Planos.
- **Governança enterprise:** aprovação por alçada, trilha de auditoria, política de retenção por tenant e eventos de observabilidade por tenant.
- **Relatórios reais:** geração assíncrona via worker, artefato em storage e acesso por URL assinada.
- **Portal externo:** acesso separado por token, somente leitura, com escopo por obra.
- **CRM:** desativado no momento (rota `/crm` vazia por decisão de produto atual).

## Arquitetura (resumo)

- **Frontend + API web:** Next.js (App Router), publicado na Vercel.
- **Banco/Auth/Storage:** Supabase (Postgres + Auth + Storage + RLS por tenant).
- **Jobs assíncronos:** BullMQ + Redis com worker dedicado (`worker/src/index.ts`).
- **Pagamentos:** Stripe (checkout, portal de cobrança, webhook).

## Endereçamento atual

- **URL pública ativa:** `https://obrasflow.vercel.app`
- **Domínio próprio:** ainda em regularização/configuração de DNS.

## Stack

- Next.js 16
- React 19
- TypeScript
- Supabase JS + SSR
- BullMQ + ioredis
- Stripe

## Setup local

1. Instale dependências:

```bash
npm install
```

2. Configure `.env.local` com pelo menos:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `REDIS_URL`
- `DATA_ENCRYPTION_KEY`
- `NEXT_PUBLIC_APP_URL` (ex.: `http://localhost:3000`)

3. Rode migrations do Supabase (incluindo as mais recentes da pasta `supabase/migrations`).

4. Suba app web:

```bash
npm run dev
```

5. Em outro terminal, suba worker:

```bash
npm run worker:dev
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run worker:dev
npm run worker:start
npm run worker:health
npm run stripe:webhook-smoke
npm run ops:slo-check
```

## Estrutura de pastas

```text
app/                    # rotas web e APIs
  (app)/                # áreas autenticadas
  (auth)/               # login/cadastro/recuperação
  api/                  # webhooks, health, jobs
components/             # UI
lib/                    # domínio (auth, billing, db, queue, observability)
supabase/migrations/    # evolução de schema
worker/                 # processamento assíncrono
tests/                  # testes automatizados críticos
```

## Operação em produção (essencial)

- A aplicação web **não substitui** o worker; ambos precisam estar ativos.
- Se houver erro em relatórios/filas/webhook, consultar:
  - `/api/health`
  - `/api/health/ops`
  - `/api/queue/metrics`
  - módulo **Governança** (auditoria + observabilidade tenant)
- Runbook operacional: `DEPLOYMENT_SETUP.md` e `GUIA_GO_LIVE_OBRASFLOW.md`.
- Roteiro completo de processo de obra (15 andares): `GUIA_ROTEIRO_OBRA_COMPLETA_15_ANDARES.md`.
- Relatório de execução do roteiro no produto: `RELATORIO_EXECUCAO_ROTEIRO_OBRA_ROTEIRO.md`.

## Segurança e isolamento

- RLS por empresa (tenant) nas tabelas operacionais.
- Criptografia de campos sensíveis aplicáveis.
- Auditoria de mudanças nas entidades críticas.
- Controle de acesso por perfil e por plano.

## Nota de compatibilidade

Se uma migration nova ainda não foi aplicada, algumas seções podem aparecer com aviso parcial; as telas principais devem continuar abrindo.
