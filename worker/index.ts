import "dotenv/config";
import { Worker } from "bullmq";

const redisUrl = new URL(process.env.REDIS_URL || "redis://localhost:6379");
const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  password: redisUrl.password || undefined,
  maxRetriesPerRequest: null as null,
};

// Parse order worker
new Worker(
  "parse-order",
  async (job) => {
    const { processParseOrder } = await import("./processors/parse-order");
    return processParseOrder(job);
  },
  { connection, concurrency: 2 }
);

// Notification worker
new Worker(
  "notifications",
  async (job) => {
    const { processSendNotification } = await import(
      "./processors/send-notification"
    );
    return processSendNotification(job);
  },
  { connection, concurrency: 5 }
);

// Bundle generation worker
new Worker(
  "bundle-generation",
  async (job) => {
    const { processGenerateBundle } = await import(
      "./processors/generate-bundle"
    );
    return processGenerateBundle(job);
  },
  { connection, concurrency: 1 }
);

// Deadline checker worker
new Worker(
  "deadline-check",
  async (job) => {
    const { processCheckDeadlines } = await import(
      "./processors/check-deadlines"
    );
    return processCheckDeadlines(job);
  },
  { connection, concurrency: 1 }
);

console.log("LexSuite workers started successfully");
console.log("Listening on queues: parse-order, notifications, bundle-generation, deadline-check");
