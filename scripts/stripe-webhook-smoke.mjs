import crypto from "node:crypto";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://obrascity.vercel.app").replace(/\/+$/, "");
const endpoint = `${appUrl}/api/webhooks/stripe`;

if (!webhookSecret) {
  console.error("STRIPE_WEBHOOK_SECRET ausente.");
  process.exit(1);
}

function buildSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

async function postSignedEvent(event) {
  const payload = JSON.stringify(event);
  const signature = buildSignature(payload, webhookSecret);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": signature,
    },
    body: payload,
  });

  const text = await response.text();
  return { status: response.status, body: text };
}

const event = {
  id: `evt_smoke_${Date.now()}`,
  object: "event",
  api_version: "2024-06-20",
  created: Math.floor(Date.now() / 1000),
  livemode: false,
  pending_webhooks: 1,
  request: { id: null, idempotency_key: null },
  type: "customer.subscription.updated",
  data: {
    object: {
      id: "sub_smoke_test",
      object: "subscription",
      metadata: {},
      items: { data: [] },
      status: "active",
      customer: "cus_smoke_test",
    },
  },
};

const first = await postSignedEvent(event);
const second = await postSignedEvent(event);

if (first.status >= 400 || second.status >= 400) {
  console.error("Falha no smoke do webhook Stripe.");
  console.error("primeira:", first.status, first.body);
  console.error("segunda:", second.status, second.body);
  process.exit(1);
}

console.log("Stripe webhook smoke: OK");
console.log("primeira:", first.status, first.body);
console.log("segunda:", second.status, second.body);
