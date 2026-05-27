#!/usr/bin/env node
/**
 * ObrasCitY — Stripe Setup Script
 *
 * Cria automaticamente no Stripe:
 *  - Produtos: Starter, Pro, Enterprise
 *  - Preços mensais e anuais para cada produto (em BRL)
 *  - Webhook endpoint apontando para https://obrascity.com.br
 *
 * Uso:
 *   node scripts/setup-stripe.mjs <STRIPE_SECRET_KEY>
 *
 * Após rodar, copie os IDs gerados e configure com:
 *   vercel env add STRIPE_SECRET_KEY production
 *   vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
 *   vercel env add STRIPE_PRICE_STARTER_IDS production   # ex: price_xxx,price_yyy
 *   vercel env add STRIPE_PRICE_PRO_IDS production
 *   vercel env add STRIPE_PRICE_ENTERPRISE_IDS production
 *   vercel env add STRIPE_WEBHOOK_SECRET production
 */

const STRIPE_SECRET_KEY = process.argv[2];
if (!STRIPE_SECRET_KEY) {
  console.error("❌ Passe a chave secreta do Stripe como argumento:");
  console.error("   node scripts/setup-stripe.mjs sk_live_...");
  process.exit(1);
}

const APP_URL = "https://obrascity.com.br";

// Planos e preços (em centavos BRL)
const PLANS = [
  {
    id: "starter",
    name: "ObrasCitY Starter",
    description: "Base essencial para controlar obras com rapidez. Ideal para equipes iniciando digitalização.",
    monthly: 9900,   // R$ 99/mês
    annual: 82800,   // R$ 69/mês × 12 = R$ 828/ano
  },
  {
    id: "pro",
    name: "ObrasCitY Pro",
    description: "Mais controle financeiro e produtividade de gestão. Ideal para operação em crescimento.",
    monthly: 22900,  // R$ 229/mês
    annual: 190800,  // R$ 159/mês × 12 = R$ 1.908/ano
  },
  {
    id: "enterprise",
    name: "ObrasCitY Enterprise",
    description: "Escalabilidade e integração para operações complexas. Ideal para múltiplas obras e integrações.",
    monthly: 79900,  // R$ 799/mês
    annual: 658800,  // R$ 549/mês × 12 = R$ 6.588/ano
  },
];

const WEBHOOK_EVENTS = [
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "checkout.session.completed",
];

async function stripeRequest(path, method = "GET", body = null) {
  const url = `https://api.stripe.com/v1${path}`;
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
  if (body) {
    opts.body = new URLSearchParams(body).toString();
  }
  const res = await fetch(url, opts);
  const data = await res.json();
  if (data.error) {
    throw new Error(`Stripe API error (${path}): ${data.error.message}`);
  }
  return data;
}

function encodeFormData(obj, prefix = "") {
  const pairs = [];
  for (const [key, value] of Object.entries(obj)) {
    const k = prefix ? `${prefix}[${key}]` : key;
    if (typeof value === "object" && value !== null) {
      pairs.push(...encodeFormData(value, k).split("&").filter(Boolean));
    } else {
      pairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(value)}`);
    }
  }
  return pairs.join("&");
}

async function stripeFormRequest(path, method, body) {
  const url = `https://api.stripe.com/v1${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: encodeFormData(body),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(`Stripe API error (${path}): ${data.error.message}`);
  }
  return data;
}

async function getOrCreateProduct(plan) {
  // Check existing products with metadata
  const existing = await stripeRequest(`/products/search?query=metadata["obrascity_plan"]:"${plan.id}"&limit=1`);
  if (existing.data?.length > 0) {
    console.log(`  ♻️  Produto já existe: ${existing.data[0].id} (${existing.data[0].name})`);
    return existing.data[0];
  }

  const product = await stripeFormRequest("/products", "POST", {
    name: plan.name,
    description: plan.description,
    "metadata[obrascity_plan]": plan.id,
    "metadata[app]": "obrascity",
  });
  console.log(`  ✅ Produto criado: ${product.id}`);
  return product;
}

async function getOrCreatePrice(productId, amount, interval, intervalCount, planId) {
  const nickname = `ObrasCitY ${planId.charAt(0).toUpperCase() + planId.slice(1)} - ${interval === "month" ? "Mensal" : "Anual"}`;

  const existing = await stripeRequest(
    `/prices/search?query=product:"${productId}" active:"true" metadata["billing"]:"${interval}" metadata["obrascity_plan"]:"${planId}"&limit=1`
  );
  if (existing.data?.length > 0) {
    console.log(`    ♻️  Preço já existe: ${existing.data[0].id} (${nickname})`);
    return existing.data[0];
  }

  const price = await stripeFormRequest("/prices", "POST", {
    product: productId,
    unit_amount: amount,
    currency: "brl",
    nickname,
    "recurring[interval]": interval,
    "recurring[interval_count]": intervalCount,
    "metadata[obrascity_plan]": planId,
    "metadata[billing]": interval,
  });
  console.log(`    ✅ Preço criado: ${price.id} (R$ ${(amount / 100).toFixed(2)}/${interval === "month" ? "mês" : "ano"})`);
  return price;
}

async function setupWebhook() {
  // Check if webhook already exists
  const existing = await stripeRequest("/webhook_endpoints?limit=20");
  const found = existing.data?.find((wh) => wh.url === `${APP_URL}/api/webhooks/stripe`);
  if (found) {
    console.log(`  ♻️  Webhook já existe: ${found.id}`);
    console.log(`     URL: ${found.url}`);
    // Recreate to get secret (secret is only shown on creation)
    console.log(`  ⚠️  O segredo do webhook não pode ser recuperado. Se precisar, delete e rode novamente.`);
    return { id: found.id, secret: null };
  }

  const eventsBody = {};
  WEBHOOK_EVENTS.forEach((evt, i) => {
    eventsBody[`enabled_events[${i}]`] = evt;
  });

  const webhook = await stripeFormRequest("/webhook_endpoints", "POST", {
    url: `${APP_URL}/api/webhooks/stripe`,
    ...eventsBody,
    description: "ObrasCitY - Webhooks de assinatura e pagamento",
  });
  console.log(`  ✅ Webhook criado: ${webhook.id}`);
  console.log(`     URL: ${webhook.url}`);
  return { id: webhook.id, secret: webhook.secret };
}

async function main() {
  console.log("\n🚀 ObrasCitY — Configuração do Stripe\n");

  // Verify key
  const account = await stripeRequest("/account");
  const mode = STRIPE_SECRET_KEY.startsWith("sk_live") ? "🔴 PRODUÇÃO" : "🟡 TESTE";
  console.log(`✅ Conta Stripe: ${account.email} (${account.id})`);
  console.log(`   Modo: ${mode}\n`);

  const results = {};

  // Create products and prices
  for (const plan of PLANS) {
    console.log(`\n📦 Plano: ${plan.name}`);
    const product = await getOrCreateProduct(plan);

    console.log(`  Preços:`);
    const monthly = await getOrCreatePrice(product.id, plan.monthly, "month", 1, plan.id);
    const annual = await getOrCreatePrice(product.id, plan.annual, "year", 1, plan.id);

    results[plan.id] = {
      productId: product.id,
      monthlyPriceId: monthly.id,
      annualPriceId: annual.id,
    };
  }

  // Create webhook
  console.log("\n🔗 Webhook:");
  const { secret: webhookSecret } = await setupWebhook();

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("✅ CONFIGURAÇÃO CONCLUÍDA — Configure as variáveis abaixo no Vercel:");
  console.log("=".repeat(70) + "\n");

  console.log("# Chaves Stripe (busque no dashboard.stripe.com/apikeys):");
  console.log(`STRIPE_SECRET_KEY=sk_live_...`);
  console.log(`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`);
  console.log();
  console.log("# Price IDs gerados (formato: mensal,anual):");
  console.log(`STRIPE_PRICE_STARTER_IDS=${results.starter.monthlyPriceId},${results.starter.annualPriceId}`);
  console.log(`STRIPE_PRICE_PRO_IDS=${results.pro.monthlyPriceId},${results.pro.annualPriceId}`);
  console.log(`STRIPE_PRICE_ENTERPRISE_IDS=${results.enterprise.monthlyPriceId},${results.enterprise.annualPriceId}`);

  if (webhookSecret) {
    console.log();
    console.log("# Segredo do webhook (copie agora, não aparece novamente):");
    console.log(`STRIPE_WEBHOOK_SECRET=${webhookSecret}`);
  } else {
    console.log();
    console.log("# STRIPE_WEBHOOK_SECRET: recupere no Stripe Dashboard → Developers → Webhooks");
  }

  console.log("\n" + "=".repeat(70));
  console.log("📋 Comandos para aplicar no Vercel (rode um por um):");
  console.log("=".repeat(70));
  console.log(`\nvercel env rm STRIPE_SECRET_KEY production --yes 2>/dev/null`);
  console.log(`echo "sk_live_..." | vercel env add STRIPE_SECRET_KEY production`);
  console.log(`\nvercel env rm NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production --yes 2>/dev/null`);
  console.log(`echo "pk_live_..." | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production`);
  console.log(`\nvercel env rm STRIPE_PRICE_STARTER_IDS production --yes 2>/dev/null`);
  console.log(`echo "${results.starter.monthlyPriceId},${results.starter.annualPriceId}" | vercel env add STRIPE_PRICE_STARTER_IDS production`);
  console.log(`\nvercel env rm STRIPE_PRICE_PRO_IDS production --yes 2>/dev/null`);
  console.log(`echo "${results.pro.monthlyPriceId},${results.pro.annualPriceId}" | vercel env add STRIPE_PRICE_PRO_IDS production`);
  console.log(`\nvercel env rm STRIPE_PRICE_ENTERPRISE_IDS production --yes 2>/dev/null`);
  console.log(`echo "${results.enterprise.monthlyPriceId},${results.enterprise.annualPriceId}" | vercel env add STRIPE_PRICE_ENTERPRISE_IDS production`);
  if (webhookSecret) {
    console.log(`\nvercel env rm STRIPE_WEBHOOK_SECRET production --yes 2>/dev/null`);
    console.log(`echo "${webhookSecret}" | vercel env add STRIPE_WEBHOOK_SECRET production`);
  }

  console.log("\n⚠️  IMPORTANTE: Ative PIX no Stripe Dashboard:");
  console.log("   https://dashboard.stripe.com/settings/payment_methods");
  console.log("\n");
}

main().catch((err) => {
  console.error("\n❌ Erro:", err.message);
  process.exit(1);
});
