import { Queue } from "bullmq";

function getConnectionConfig() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
    maxRetriesPerRequest: null as null,
    ...(url.protocol === "rediss:" ? { tls: {} } : {}),
  };
}

function createQueue(name: string) {
  const connection = getConnectionConfig();
  if (!connection) return null;
  return new Queue(name, { connection });
}

export function getParseOrderQueue() {
  return createQueue("parse-order");
}

export function getNotificationQueue() {
  return createQueue("notifications");
}

export function getBundleQueue() {
  return createQueue("bundle-generation");
}

export function getDeadlineCheckQueue() {
  return createQueue("deadline-check");
}
