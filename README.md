# ObrasFlow - Gestão de Obras SaaS

Plataforma completa de gestão de obras para construtoras brasileiras. Controle obras, equipes, materiais, cronogramas e financeiro em uma única solução na nuvem.

## 🎯 Visão Geral

ObrasFlow é um software SaaS (Software as a Service) desenvolvido em Next.js 16 que oferece:

- **Dashboard Operacional** - Visão real-time de todas as obras
- **Gestão de Obras** - Cronograma, progresso e documentos
- **Gestão de Equipes** - Alocação e performance de pessoal
- **Controle de Materiais** - Inventário e compras
- **Relatórios Avançados** - Exportação em PDF, Excel, DOCX
- **Controle Financeiro** - Orçamento, custos e previsões
- **Integrações** - WhatsApp, Google Sheets, Zapier
- **Segurança Enterprise** - SSO, SAML, conformidade LGPD

## 🚀 Stack Tecnológico

- **Framework:** Next.js 16
- **Runtime:** Node.js 18+
- **Banco de Dados:** Supabase (PostgreSQL)
- **Cache/Queue:** Redis
- **Autenticação:** Supabase Auth
- **Pagamentos:** Stripe
- **Email:** Resend
- **TypeScript:** Modo strict

## 📋 Requisitos

- Node.js 18+
- npm ou yarn
- Conta Supabase
- Conta Redis
- (Opcional) Chaves Stripe para pagamentos

## ⚙️ Setup Local

### 1. Clonar repositório

```bash
git clone <seu-repo>
cd obras-saas
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Preencha as variáveis obrigatórias no `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `REDIS_URL`
- `DATA_ENCRYPTION_KEY`

Variáveis opcionais (para depois):
- `STRIPE_*` (pagamentos)
- `RESEND_API_KEY` (email)

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## �� Scripts

```bash
npm run dev        # Desenvolvimento
npm run build      # Build produção
npm run start      # Produção
npm run lint       # ESLint
npm run typecheck  # TypeScript check
npm run worker:dev # Background worker
```

## 🏗️ Estrutura

```
app/                # Next.js App Router
├── (app)/         # Rotas autenticadas
├── (auth)/        # Login/Cadastro
└── api/           # API & Webhooks

lib/                # Lógica
├── auth/          # Autenticação
├── billing/       # Pagamentos
├── db/            # Database
├── integrações/   # Integrações
└── supabase/      # Supabase

components/         # Componentes
types/             # TypeScript types
```

## 🌐 Deploy em Vercel

1. Push para repositório Git
2. Conectar em [vercel.com](https://vercel.com)
3. Build: `npm run build`
4. Framework preset: **Next.js** (detectado automaticamente)
5. Adicionar variáveis de ambiente no painel da Vercel
6. Deploy automático em cada push

### Variáveis obrigatórias antes de publicar

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `REDIS_URL`
- `DATA_ENCRYPTION_KEY`
- `NEXT_PUBLIC_APP_URL` (use a URL pública da Vercel)

### Variáveis opcionais que liberam recursos depois

- `STRIPE_*` para billing
- `RESEND_API_KEY` para e-mails
- `RESEND_FROM_EMAIL` para o remetente das confirmações
- `SIGNUP_EDGE_SHARED_SECRET` para o fluxo antigo de cadastro

**Importante:** Use chaves de produção do Stripe (`sk_live_*`) para produção.

## 📚 Documentação

- [Guia Técnico Completo](../guia.md)
- [Setup Stripe](../STRIPE_SETUP_GUIDE.md)
- [Problemas Encontrados](../.copilot/session-state/SITE_REVIEW_COMPLETE.md)

## 🔐 Segurança

- ✅ TypeScript strict mode
- ✅ CSP headers
- ✅ HSTS
- ✅ Validação com Zod
- ✅ Criptografia de dados
- ✅ Conformidade LGPD

## 🐛 Troubleshooting

**Erro Redis:** Verifique `REDIS_URL` em `.env.local`  
**Erro Supabase:** Verifique credenciais e conexão  
**Erro Stripe:** Configure variáveis quando estiver pronto
**Erro no cadastro:** aplique a migration `supabase/migrations/0015_signup_email_verification.sql` antes de publicar; sem ela, a verificação usa fallback legado.
**Erro `Invalid JWT` no cadastro:** confirme `SUPABASE_SERVICE_KEY` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`; se houver falha no fluxo novo, o cadastro cai automaticamente para o fluxo legado enquanto a origem do JWT é corrigida.
**Conta criada como admin:** aplique também `supabase/migrations/0016_trial_signup_client_role.sql` para que novos cadastros trial sejam criados como `visualizador`, sem permissões de controle de outras contas.
**Limite de cadastro por e-mail:** só é aplicado quando o e-mail já possui cadastro; e-mails novos ficam sujeitos apenas ao limite por IP.

## 📞 Suporte

- Email: suporte@obrasflow.com
- Central de Ajuda: [Link]
- WhatsApp: [Link]

---

**Versão:** 1.0.0 | **Maio 2026**
