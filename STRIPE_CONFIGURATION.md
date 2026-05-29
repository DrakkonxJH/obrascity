# Configuração Stripe - ObrasFlow

## ✅ Completado

### Produtos Criados
Os 3 produtos foram criados com sucesso no Stripe:

| Plano | Product ID | Perfis | Preços |
|-------|-----------|--------|---------|
| **Starter** | `prod_UbTihbmEJMzeKq` | 10 | R$ 129/mês |
| **Pro** | `prod_UbTiS9hiINFE9I` | 30 | R$ 229/mês<br/>R$ 1.908/ano |
| **Enterprise** | `prod_UbTiZFjjD2tAgk` | 80+ | R$ 799/mês<br/>R$ 6.588/ano |

### Preços Criados
Todos os preços foram configurados em BRL com ciclo de recorrência:

#### Starter
- **Mensal**: `price_1TcGkiFCNodce7jVWZgtHRSm` (R$ 129/mês)

#### Pro
- **Mensal**: `price_1TcGkiFCNodce7jV6dSmEKP4` (R$ 229/mês)
- **Anual**: `price_1TcGkjFCNodce7jVOmSjoXTB` (R$ 1.908/ano)

#### Enterprise
- **Mensal**: `price_1TcGkkFCNodce7jVvOX7ohSW` (R$ 799/mês)
- **Anual**: `price_1TcGklFCNodce7jVxkH0blZp` (R$ 6.588/ano)

### Configuração Local
As chaves e IDs foram salvos em `.env.local`:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

NEXT_PUBLIC_STRIPE_STARTER_PRODUCT=prod_UbTihbmEJMzeKq
NEXT_PUBLIC_STRIPE_PRO_PRODUCT=prod_UbTiS9hiINFE9I
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRODUCT=prod_UbTiZFjjD2tAgk

STRIPE_PRICE_STARTER_IDS=price_1TcGkiFCNodce7jVWZgtHRSm
STRIPE_PRICE_PRO_IDS=price_1TcGkiFCNodce7jV6dSmEKP4,price_1TcGkjFCNodce7jVOmSjoXTB
STRIPE_PRICE_ENTERPRISE_IDS=price_1TcGkkFCNodce7jVvOX7ohSW,price_1TcGklFCNodce7jVxkH0blZp
```

---

## 🔜 Próximos Passos

### 1. Criar Webhook
Quando tiver a URL de produção pronta, execute:

```bash
export STRIPE_SECRET_KEY='sk_live_...'
./scripts/setup-stripe-webhook.sh https://seu-dominio.com/api/webhooks/stripe
```

O script criará automaticamente o webhook e retornará o `STRIPE_WEBHOOK_SECRET`.

### 2. Adicionar Webhook Secret ao .env.local
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Testar Webhook Localmente
Para testes locais, use Stripe CLI:

```bash
# Instalar Stripe CLI (uma vez)
curl https://files.stripe.com/stripe-cli/install.sh | sh

# Fazer forward dos eventos para localhost
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Em outro terminal, simular um evento de subscription criada
stripe trigger customer.subscription.created
```

---

## 📋 Eventos Webhook Configurados

O webhook está configurado para monitorar:

- ✅ `customer.subscription.created` - Assinatura criada
- ✅ `customer.subscription.updated` - Assinatura atualizada
- ✅ `customer.subscription.deleted` - Assinatura cancelada
- ✅ `invoice.paid` - Pagamento recebido
- ✅ `invoice.payment_failed` - Falha no pagamento
- ✅ `checkout.session.completed` - Checkout completado

---

## 🔐 Segurança

### ⚠️ IMPORTANTE - .env.local
O arquivo `.env.local` contém chaves secretas. **NUNCA** faça commit deste arquivo:

```bash
# Verificar .gitignore
cat .gitignore | grep env

# Deve incluir:
# .env.local
# .env.local.backup
```

### Política de Chaves
- **Publishable Key** (pk_live_...): Segura para expor em JavaScript
- **Secret Key** (sk_live_...): **Nunca** expor ao cliente
- **Webhook Secret** (whsec_...): Usar apenas no backend

---

## 🧪 Teste de Integração

### Verificar Mapeamento de Preços
O sistema automaticamente mapeia Price IDs para planos internos via `lib/billing/stripe-price-map.ts`.

Se receber um webhook com um price_id desconhecido, verifique:
1. O Price ID está correto no `.env.local`?
2. O evento foi processado corretamente?
3. Verifique logs em `Supabase > Functions > Logs`

### Simular Pagamento PIX no Stripe Dashboard
1. Acesse: https://dashboard.stripe.com/test/invoices
2. Crie uma fatura de teste com PIX
3. Pague usando o QR code de teste
4. Verifique se o webhook `invoice.paid` foi recebido

---

## 📞 Referências

- Documentação Stripe: https://stripe.com/docs
- Webhooks: https://stripe.com/docs/webhooks
- Testing: https://stripe.com/docs/testing
- Stripe CLI: https://stripe.com/docs/stripe-cli

---

## Histórico

- **2026-05-28**: Produtos, preços e configuração inicial criados
