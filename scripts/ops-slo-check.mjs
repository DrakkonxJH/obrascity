const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://obrascity.vercel.app").replace(/\/+$/, "");

async function getJson(path) {
  const response = await fetch(`${appUrl}${path}`, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`${path} retornou HTTP ${response.status}`);
  }
  return response.json();
}

function validateQueueThresholds(queues) {
  const failedThreshold = 10;
  const waitingThreshold = 500;

  for (const queue of queues) {
    const failed = Number(queue.failed ?? 0);
    const waiting = Number(queue.waiting ?? 0);
    if (failed > failedThreshold) {
      throw new Error(`Fila ${queue.queue} com ${failed} falhas (limite ${failedThreshold}).`);
    }
    if (waiting > waitingThreshold) {
      throw new Error(`Fila ${queue.queue} com ${waiting} aguardando (limite ${waitingThreshold}).`);
    }
  }
}

async function main() {
  const health = await getJson("/api/health");
  if (health.status !== "ok") {
    throw new Error(`Health inválido: ${JSON.stringify(health)}`);
  }

  const ops = await getJson("/api/health/ops");
  if (ops.status !== "ok") {
    throw new Error(`Ops health inválido: ${JSON.stringify(ops)}`);
  }
  validateQueueThresholds(ops.queues ?? []);

  const queueMetrics = await getJson("/api/queue/metrics");
  validateQueueThresholds(queueMetrics.stats ?? []);

  console.log("Ops SLO check: OK");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
