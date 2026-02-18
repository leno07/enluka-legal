import { Job } from "bullmq";

export async function processParseOrder(job: Job) {
  console.log(`Processing parse-order job ${job.id}`, job.data);
  // Implementation in Phase 4
}
