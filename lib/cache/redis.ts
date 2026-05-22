import Redis from "ioredis";
import { getEnv } from "@/lib/validations/env";

let redis: Redis | null = null;

export function getRedisClient() {
  if (redis) {
    return redis;
  }

  const env = getEnv();
  if (!env.REDIS_URL) {
    throw new Error("REDIS_URL não configurado");
  }

  redis = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
  });

  return redis;
}
