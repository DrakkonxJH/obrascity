import { Job } from "bullmq";

export async function processReportJob(job: Job) {
  return {
    status: "processed",
    name: job.name,
    data: job.data,
  };
}
