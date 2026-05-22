import { Job } from "bullmq";

export async function processNotificationJob(job: Job) {
  return {
    status: "processed",
    type: "notification",
    payload: job.data,
  };
}
