import { Job } from "bullmq";

export async function processBillingJob(job: Job) {
  return {
    status: "processed",
    type: "billing",
    payload: job.data,
  };
}
