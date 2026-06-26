# 📋 Guia de Configuração do Stripe - PlanObras

## Status Atual
✅ **Infraestrutura pronta:** O projeto já tem integração com Stripe  
❌ **Chaves não configuradas:** Precisa adicionar variáveis de ambiente  
❌ **Produtos não criados:** Precisa criar produtos no Stripe

---

## 🚀 Passo 1: Criar Conta Stripe

Se não tiver:
1. Acesse [stripe.com](https://stripe.com)
2. Clique em "Sign up"
3. Preencha dados básicos daqua empresa
4. Ative o Stripe no Brasil (com CPF/CNPJ)

---

## 🔑 Passo 2: Obter Chaves Stripe

1. Acesse [Dashboard do Stripe](https://dashboard.stripe.com)
2. Menu → **Developers** → **API keys**
3. Copie:
   - **Secret Key**: Começa com `sk_live_` ou `sk_test_`
   - Nota: Use `sk_test_` para testes, `sk_live_` para produção

4. Menu → **Developers** → **Webhooks**
5. Crie um novo webhook:
   - **URL**: `https://seu-dominio.com/api/webhooks/stripe`
   - **Eventos**: `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`
   - Copie o **Signing Secret** (começa com `whsec_`)

---

## 💰 Passo 3: Criar Produtos e Preços no Stripe

### Starter Plan
**Mensal:**
1. Stripe Dashboard → Products → Create
2. Nome: `Starter - Mensal`
3. Preço: R$ 86.00
4. Billings: Monthly
5. Copie o **Price ID** (ex: `price_1234abc`)

**Anual:**
1. Mesmo produto, adicione outro preço
2. Preço: R$ 69.00
3. Billings: Yearly
4. Copie o **Price ID** anual

### Pro Plan
**Mensal:**
- Nome: `Pro - Mensal`
- Preço: R$ 199.00
- Price ID: `price_xxx`

**Anual:**
- Mesmo produto, novo preço
- Preço: R$ 159.00
- Price ID: `price_yyy`

### Enterprise Plan
**Mensal:**
- Nome: `Enterprise - Mensal`
- Preço: R$ 687.00
- Price ID: `price_aaa`

**Anual:**
- Mesmo produto, novo preço
- Preço: R$ 549.00
- Price ID: `price_bbb`

---

## 🔧 Passo 4: Configurar Variáveis de Ambiente

Edite `/home/julio-sousa/Documentos/planobras/obras-saas/.env.local` e adicione:

```env
# Stripe (obtenha em https://dashboard.stripe.com/developers/api)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE (ou sk_live_ para produção)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Price IDs (formato: mensal,anual)
STRIPE_PRICE_STARTER_IDS=price_starter_monthly,price_starter_annual
STRIPE_PRICE_PRO_IDS=price_pro_monthly,price_pro_annual
STRIPE_PRICE_ENTERPRISE_IDS=price_enterprise_monthly,price_enterprise_annual
```

---

## ✅ Passo 5: Testar

1. Reinicie o servidor: `npm run dev`
2. Acesse `/planos`
3. Clique em "Assinar Starter", "Assinar Pro" ou "Assinar Enterprise"
4. Se tudo funcionar, você será redirecionado para o checkout do Stripe
5. No modo teste, use cartão: `4242 4242 4242 4242` com data futura

---

## 🎯 Próximos Passos

- [ ] Criar conta Stripe
- [ ] Obter Secret Key e Webhook Secret
- [ ] Criar 6 produtos (3 planos × 2 ciclos)
- [ ] Copiar todos os Price IDs
- [ ] Adicionar variáveis ao `.env.local`
- [ ] Testar fluxo de pagamento
- [ ] Migrar para `sk_live_` quando pronto para produção

---

## 📞 Suporte

- [Documentação Stripe](https://stripe.com/docs)
- [Suporte ao Cliente Stripe](https://support.stripe.com)
- API já está integrada em: `/home/julio-sousa/Documentos/planobras/obras-saas/lib/billing/`
