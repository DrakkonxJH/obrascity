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
- `TURNSTILE_SECRET_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_ALLOWED_HOSTNAMES`
- `SIGNUP_EDGE_SHARED_SECRET`
- `RESEND_API_KEY`
- `CONTROLE_TOTAL_OWNER_EMAIL`
- `CONTROLE_TOTAL_OWNER_PROFILE_ID`

## Configuração de GitHub Actions (opcional)

Se quiser usar também o workflow do GitHub Actions:
1. Acesse https://github.com/DrakkonxJH/obrasflow/settings/secrets/actions
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
