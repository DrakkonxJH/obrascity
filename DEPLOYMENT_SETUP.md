# Setup de Deployment no Vercel

## Fluxos possíveis (importante)

Existem dois fluxos diferentes e independentes:

1. **Vercel Git Integration (Preview/Production automático no painel da Vercel)**
2. **GitHub Actions com Vercel CLI** (`.github/workflows/deploy-vercel.yml`)

Se o erro aparece em **Deployments > Environment: Preview** no painel da Vercel, o build está vindo do fluxo **Vercel Git Integration**.
Nesse caso, **GitHub Secrets não bastam**: as variáveis precisam existir no **Projeto da Vercel**.

## Configuração obrigatória para Vercel Git Integration

No projeto da Vercel:
1. Acesse **Settings > Environment Variables**
2. Cadastre as variáveis abaixo em **Preview** e **Production** (e Development se quiser)
3. Salve e faça um novo deploy

### Variáveis obrigatórias

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `DATA_ENCRYPTION_KEY`

### Variáveis opcionais (dependem dos módulos habilitados)

- `SUPABASE_SERVICE_KEY`
- `REDIS_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SIGNUP_EDGE_SHARED_SECRET`
- `RESEND_API_KEY`
- `CONTROLE_TOTAL_OWNER_EMAIL`
- `CONTROLE_TOTAL_OWNER_PROFILE_ID`
- `CONTROLE_TOTAL_ALLOWED_IPS`

## Configuração de GitHub Actions (opcional)

Se quiser usar também o workflow do GitHub Actions:
1. Acesse https://github.com/DrakkonxJH/obrascity/settings/secrets/actions
2. Cadastre `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
3. Cadastre as variáveis de ambiente necessárias para o workflow

> Esse fluxo é separado do Git Integration da Vercel.

## Verificação correta de causa

No painel da Vercel, em cada deployment, confira:
- **Source (commit SHA)**: confirma qual commit está sendo deployado
- **Environment**: Preview ou Production
- Se estiver redeployando um commit antigo, o erro antigo se repete mesmo com correções novas no `main`

---

**Workflow opcional:** `.github/workflows/deploy-vercel.yml`

## Worker em execução contínua (produção)

Como o worker não deve rodar junto da instância web, mantenha um processo dedicado.

### Scripts já prontos

- `npm run worker:start` -> inicia worker em modo produção
- `npm run worker:health` -> valida Redis + `/api/health/ops`

### Operação recomendada com PM2

1. Instalar PM2 no host do worker: `npm i -g pm2`
2. Iniciar: `pm2 start ecosystem.config.cjs`
3. Persistir boot: `pm2 save && pm2 startup`
4. Verificar saúde: `npm run worker:health`

Arquivos de processo:
- `ecosystem.config.cjs` (processo `obrascity-worker`)
- logs em `/tmp/obrascity-worker.out.log` e `/tmp/obrascity-worker.err.log`

## Runbook operacional (incidente rápido)

### Sintoma: jobs acumulando / falhando

1. Verificar API operacional: `GET /api/health/ops`
2. Verificar worker: `pm2 status obrascity-worker`
3. Reiniciar worker: `pm2 restart obrascity-worker`
4. Rodar healthcheck: `npm run worker:health`
5. Se Redis estiver com política diferente de `noeviction`, ajustar no provedor gerenciado.

### Sintoma: webhook Stripe falhando

1. Confirmar `STRIPE_WEBHOOK_SECRET` no ambiente
2. Confirmar endpoint ativo: `https://obrascity.com.br/api/webhooks/stripe`
3. Revisar eventos e tentativas no dashboard Stripe
4. Reprocessar eventos pendentes após correção

## Rollback (web + banco) — procedimento operacional

### Rollback da aplicação web (Vercel)

1. Listar deploys recentes no painel da Vercel (projeto `obrascity`).
2. Selecionar último deployment estável.
3. Promover deployment estável para Production (alias `obrascity.com.br`).
4. Rodar smoke imediato:
   - `/api/health`
   - `/api/health/ops`
   - `/login`
   - `/planos`

### Rollback de variáveis críticas

1. Reverter `STRIPE_WEBHOOK_SECRET` e `STRIPE_PRICE_*_IDS` para o conjunto anterior se o erro for de billing.
2. Reverter `RESEND_API_KEY`/`RESEND_FROM_EMAIL` se falha for de envio.
3. Fazer novo deploy após ajuste de variável.

### Rollback de banco (Supabase)

1. Confirmar backup disponível antes de restore.
2. Restaurar backup em homologação primeiro e validar:
   - login
   - leitura/escrita em módulos críticos
   - assinatura/plano da empresa
3. Aplicar restore em produção somente após validação.
4. Reconciliar eventos Stripe pendentes após restore para evitar divergência.
