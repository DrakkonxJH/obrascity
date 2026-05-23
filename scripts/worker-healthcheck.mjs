import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;
const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");

if (!redisUrl) {
  console.error("REDIS_URL ausente.");
  process.exit(1);
}

async function main() {
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1 });

  try {
    const pong = await redis.ping();
    if (pong !== "PONG") {
      throw new Error(`Ping Redis inválido: ${pong}`);
    }

    try {
      const policy = await redis.config("GET", "maxmemory-policy");
      const currentPolicy = String(policy?.[1] ?? "").toLowerCase();
      if (currentPolicy && currentPolicy !== "noeviction") {
        console.error(`Redis maxmemory-policy atual: ${currentPolicy} (esperado: noeviction).`);
        process.exit(2);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Aviso: não foi possível validar maxmemory-policy (${message}).`);
    }

    if (appUrl) {
      const response = await fetch(`${appUrl}/api/health/ops`);
      if (!response.ok) {
        throw new Error(`Ops health retornou HTTP ${response.status}`);
      }
      const payload = await response.json();
      if (payload?.status !== "ok") {
        throw new Error(`Ops health status inválido: ${JSON.stringify(payload)}`);
      }
    }

    console.log("Worker healthcheck: OK");
  } finally {
    redis.disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
