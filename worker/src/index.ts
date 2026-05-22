import { loadEnvConfig } from "@next/env";
import { Job, Worker } from "bullmq";
import { QueueNames } from "@/lib/queue/connection";
import { getRedisClient } from "@/lib/cache/redis";
import { processReportJob } from "./processors/reports";
import { processNotificationJob } from "./processors/notifications";
import { processBillingJob } from "./processors/billing";
import { processMediaJob } from "./processors/media";
import { processMaintenanceJob } from "./processors/maintenance";
import { moveToDeadLetter } from "./processors/common";
import { logger } from "@/lib/observability/logger";

loadEnvConfig(process.cwd());

const connection = getRedisClient();

function createManagedWorker(
  queueName: string,
  processor: (job: Job) => Promise<unknown>,
  concurrency = 5,
) {
  const worker = new Worker(queueName, processor, {
    connection,
    concurrency,
  });

  worker.on("completed", (job) => {
    logger.info({ queue: queueName, jobId: job.id }, "Job concluido");
  });

  worker.on("failed", async (job, error) => {
    if (!job) return;
    const reason = error?.message ?? "Falha desconhecida";
    logger.error({ queue: queueName, jobId: job.id, reason }, "Job falhou");

    const attemptsMade = job.attemptsMade ?? 0;
    const maxAttempts = job.opts.attempts ?? 1;
    if (attemptsMade >= maxAttempts) {
      await moveToDeadLetter(job, reason);
    }
  });

  return worker;
}

async function main() {
  if (connection.status === "wait" || connection.status === "end") {
    await connection.connect();
  }

  const workers = [
    createManagedWorker(QueueNames.REPORTS_GENERATE, processReportJob, 3),
    createManagedWorker(QueueNames.NOTIFICATIONS_DISPATCH, processNotificationJob, 10),
    createManagedWorker(QueueNames.BILLING_RECONCILE, processBillingJob, 5),
    createManagedWorker(QueueNames.MEDIA_PROCESS, processMediaJob, 3),
    createManagedWorker(QueueNames.MAINTENANCE_RETENTION, processMaintenanceJob, 2),
  ];

  await Promise.all(workers.map((worker) => worker.waitUntilReady()));
  logger.info("Workers inicializados");

  const keepAlive = setInterval(() => undefined, 60_000);
  await new Promise<void>((resolve) => {
    const shutdown = async () => {
      clearInterval(keepAlive);
      await Promise.all(workers.map((worker) => worker.close()));
      if (connection.status !== "end") {
        await connection.quit();
      }
      resolve();
    };

    process.once("SIGINT", () => {
      void shutdown();
    });
    process.once("SIGTERM", () => {
      void shutdown();
    });
  });
}

main().catch((error) => {
  logger.error({ error }, "Falha ao iniciar workers");
  process.exit(1);
});
