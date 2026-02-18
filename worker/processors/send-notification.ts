import { Job } from "bullmq";

export async function processSendNotification(job: Job) {
  console.log(`Processing notification job ${job.id}`, job.data);
  // Implementation in Phase 6
}
