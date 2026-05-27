#!/usr/bin/env node
/**
 * ObrasCitY — Aplica variáveis Stripe no Vercel
 *
 * Uso:
 *   node scripts/apply-stripe-vercel.mjs \
 *     --secret sk_live_... \
 *     --publishable pk_live_... \
 *     --webhook whsec_... \
 *     --starter price_xxx,price_yyy \
 *     --pro price_xxx,price_yyy \
 *     --enterprise price_xxx,price_yyy
 *
 * Ou rode setup-stripe.mjs primeiro e passe os IDs gerados.
 */

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};

const SECRET = get("--secret");
const PUBLISHABLE = get("--publishable");
const WEBHOOK = get("--webhook");
const STARTER = get("--starter");
const PRO = get("--pro");
const ENTERPRISE = get("--enterprise");

if (!SECRET || !PUBLISHABLE || !STARTER || !PRO || !ENTERPRISE) {
  console.error("Uso: node scripts/apply-stripe-vercel.mjs \\");
  console.error("  --secret sk_live_... \\");
  console.error("  --publishable pk_live_... \\");
  console.error("  --webhook whsec_... \\");
  console.error("  --starter price_monthly,price_annual \\");
  console.error("  --pro price_monthly,price_annual \\");
  console.error("  --enterprise price_monthly,price_annual");
  process.exit(1);
}

import { execSync } from "child_process";

function setVercelEnv(key, value) {
  try {
    execSync(`vercel env rm ${key} production --yes 2>/dev/null`, { stdio: "pipe" });
  } catch {}
  execSync(`echo "${value}" | vercel env add ${key} production`, { stdio: "inherit" });
  console.log(`  ✅ ${key} configurado`);
}

async function main() {
  console.log("\n🔧 Aplicando variáveis Stripe no Vercel...\n");

  setVercelEnv("STRIPE_SECRET_KEY", SECRET);
  setVercelEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", PUBLISHABLE);
  setVercelEnv("STRIPE_PRICE_STARTER_IDS", STARTER);
  setVercelEnv("STRIPE_PRICE_PRO_IDS", PRO);
  setVercelEnv("STRIPE_PRICE_ENTERPRISE_IDS", ENTERPRISE);
  if (WEBHOOK) {
    setVercelEnv("STRIPE_WEBHOOK_SECRET", WEBHOOK);
  } else {
    console.log("  ⚠️  STRIPE_WEBHOOK_SECRET não fornecido — configure manualmente");
  }

  console.log("\n✅ Variáveis aplicadas! Realizando redeploy...\n");
  execSync("vercel deploy --prod --yes", { stdio: "inherit" });
  console.log("\n🚀 Deploy concluído!\n");
}

main().catch((err) => {
  console.error("❌ Erro:", err.message);
  process.exit(1);
});
