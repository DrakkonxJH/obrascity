#!/bin/bash

# Script para criar webhook no Stripe
# Uso: ./scripts/setup-stripe-webhook.sh <webhook_url>
# Exemplo: ./scripts/setup-stripe-webhook.sh https://seu-dominio.com/api/webhooks/stripe

if [ -z "$1" ]; then
  echo "❌ URL do webhook não fornecida!"
  echo ""
  echo "Uso: ./scripts/setup-stripe-webhook.sh <webhook_url>"
  echo "Exemplo: ./scripts/setup-stripe-webhook.sh https://seu-dominio.com/api/webhooks/stripe"
  exit 1
fi

WEBHOOK_URL=$1
API_KEY="${STRIPE_SECRET_KEY:-}"

if [ -z "$API_KEY" ]; then
  echo "❌ STRIPE_SECRET_KEY não encontrada!"
  echo ""
  echo "Configure a variável de ambiente:"
  echo "export STRIPE_SECRET_KEY='sk_live_...'"
  exit 1
fi

echo "🔧 Criando webhook no Stripe..."
echo "URL: $WEBHOOK_URL"
echo ""

# Eventos para monitorar
EVENTS=(
  "customer.subscription.created"
  "customer.subscription.updated"
  "customer.subscription.deleted"
  "invoice.paid"
  "invoice.payment_failed"
  "checkout.session.completed"
)

# Construir string de eventos
EVENT_LIST=$(printf "%s," "${EVENTS[@]}")
EVENT_LIST="${EVENT_LIST%,}"

echo "📋 Eventos a monitorar:"
for event in "${EVENTS[@]}"; do
  echo "  ✓ $event"
done
echo ""

# Criar webhook
RESPONSE=$(curl -s https://api.stripe.com/v1/webhook_endpoints \
  -u $API_KEY: \
  -d url="$WEBHOOK_URL" \
  -d enabled_events="$(printf '%s&enabled_events=' "${EVENTS[@]}" | sed 's/&enabled_events=$//')")

WEBHOOK_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
WEBHOOK_SECRET=$(echo $RESPONSE | grep -o '"secret":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$WEBHOOK_ID" ]; then
  echo "❌ Erro ao criar webhook:"
  echo $RESPONSE | jq . 2>/dev/null || echo $RESPONSE
  exit 1
fi

echo "✅ Webhook criado com sucesso!"
echo ""
echo "📌 Salve essas informações no seu .env.local:"
echo ""
echo "STRIPE_WEBHOOK_ID=$WEBHOOK_ID"
echo "STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET"
echo ""
echo "Adicione a seguinte linha ao seu .env.local:"
echo "STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET"
