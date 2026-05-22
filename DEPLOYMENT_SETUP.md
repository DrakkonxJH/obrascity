# Setup de Deployment no Vercel

## Configuração de Secrets no GitHub

Para que o workflow de deployment automático funcione, você precisa adicionar alguns secrets no repositório GitHub.

### Passo 1: Acessar Secrets do Repositório

1. Acesse o repositório: https://github.com/DrakkonxJH/obrasflow
2. Clique na aba **Settings** (engrenagem no topo)
3. No menu esquerdo, procure por **Secrets and variables**
4. Clique em **Actions**

**Link direto:** https://github.com/DrakkonxJH/obrasflow/settings/secrets/actions

### Passo 2: Adicionar os Secrets do Vercel

Clique em **New repository secret** e adicione estes 3 secrets:

#### 1. VERCEL_TOKEN
- **Como obter:** 
  - Acesse https://vercel.com/account/tokens
  - Clique em "Create Token"
  - Copie o token gerado
- **Colar em:** Name: `VERCEL_TOKEN`, Secret: `cole-o-token-aqui`

#### 2. VERCEL_ORG_ID
- **Como obter:**
  - Acesse https://vercel.com/account/settings
  - Procure por "Team ID" ou "Org ID"
  - Copie o valor
- **Colar em:** Name: `VERCEL_ORG_ID`, Secret: `cole-o-id-aqui`

#### 3. VERCEL_PROJECT_ID
- **Como obter:**
  - Acesse seu projeto no Vercel
  - Vá em Settings → General
  - Procure por "Project ID"
  - Copie o valor
- **Colar em:** Name: `VERCEL_PROJECT_ID`, Secret: `cole-o-id-aqui`

### Passo 3: Adicionar Secrets do Ambiente

Adicione também todos os secrets do seu `.env`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `REDIS_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `TURNSTILE_SECRET_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_ALLOWED_HOSTNAMES`
- `SIGNUP_EDGE_SHARED_SECRET`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL`
- `DATA_ENCRYPTION_KEY`
- `CONTROLE_TOTAL_OWNER_EMAIL`
- `CONTROLE_TOTAL_OWNER_PROFILE_ID`

### Passo 4: Pronto!

Assim que todos os secrets forem adicionados, o workflow automático estará ativo.

**Próximos pushes no `main` vão disparar deploy automático para Vercel automaticamente.**

## Verificar Deploy

Para verificar se o deploy foi acionado:
1. Acesse https://github.com/DrakkonxJH/obrasflow/actions
2. Procure pelo workflow "Deploy to Vercel"
3. Clique para ver os logs em tempo real

---

**Workflow:** `.github/workflows/deploy-vercel.yml`
