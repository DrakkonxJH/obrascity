import { Job } from "bullmq";

export async function processMediaJob(job: Job) {
  return {
    status: "processed",
    type: "media",
    payload: job.data,
  };
}
