import { Queue } from "bullmq";
import { getRedisClient } from "@/lib/cache/redis";

export const QueueNames = {
  REPORTS_GENERATE: "reports-generate",
  NOTIFICATIONS_DISPATCH: "notifications-dispatch",
  BILLING_RECONCILE: "billing-reconcile",
  MEDIA_PROCESS: "media-process",
  MAINTENANCE_RETENTION: "maintenance-retention",
  DEAD_LETTER: "jobs-dead-letter",
} as const;

type QueueName = (typeof QueueNames)[keyof typeof QueueNames];

const queueMap = new Map<QueueName, Queue>();

export function getQueue(name: QueueName) {
  const existing = queueMap.get(name);
  if (existing) {
    return existing;
  }

  const queue = new Queue(name, {
    connection: getRedisClient(),
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: {
        age: 60 * 60 * 24,
        count: 1000,
      },
      removeOnFail: {
        age: 60 * 60 * 24 * 7,
        count: 2000,
      },
    },
  });
  queueMap.set(name, queue);
  return queue;
}

export function getManagedQueues() {
  return [
    getQueue(QueueNames.REPORTS_GENERATE),
    getQueue(QueueNames.NOTIFICATIONS_DISPATCH),
    getQueue(QueueNames.BILLING_RECONCILE),
    getQueue(QueueNames.MEDIA_PROCESS),
    getQueue(QueueNames.MAINTENANCE_RETENTION),
    getQueue(QueueNames.DEAD_LETTER),
  ];
}
