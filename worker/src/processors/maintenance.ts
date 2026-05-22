import { Job } from "bullmq";

export async function processMaintenanceJob(job: Job) {
  return {
    status: "processed",
    type: "maintenance",
    payload: job.data,
  };
}
