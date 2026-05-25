import test from "node:test";
import assert from "node:assert/strict";
import { subscriptionAllows, type SubscriptionSnapshot } from "@/lib/billing/plans";

test("permite recurso quando assinatura ativa e no período", () => {
  const subscription: SubscriptionSnapshot = {
    plano: "pro",
    status: "active",
    periodo_fim: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  assert.equal(subscriptionAllows(subscription, "relatórios_basic"), true);
});

test("bloqueia recurso quando assinatura ativa já expirada", () => {
  const subscription: SubscriptionSnapshot = {
    plano: "pro",
    status: "active",
    periodo_fim: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  };
  assert.equal(subscriptionAllows(subscription, "relatórios_basic"), false);
});

test("permite graça para cancelada dentro do período", () => {
  const subscription: SubscriptionSnapshot = {
    plano: "starter",
    status: "canceled",
    periodo_fim: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  };
  assert.equal(subscriptionAllows(subscription, "obras_basic"), true);
});
