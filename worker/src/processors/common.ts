import { Job } from "bullmq";
import { QueueNames, getQueue } from "@/lib/queue/connection";
import { logger } from "@/lib/observability/logger";

export async function moveToDeadLetter(job: Job, reason: string) {
  const dlq = getQueue(QueueNames.DEAD_LETTER);
  await dlq.add(
    `dlq:${job.queueName}:${job.id}`,
    {
      sourceQueue: job.queueName,
      sourceJobId: job.id,
      name: job.name,
      data: job.data,
      reason,
      failedAt: new Date().toISOString(),
    },
    {
      attempts: 1,
    },
  );

  logger.error(
    {
      queue: job.queueName,
      jobId: job.id,
      reason,
    },
    "Job enviado para DLQ",
  );
}
