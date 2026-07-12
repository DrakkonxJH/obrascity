import Redis from "ioredis";
import { getEnv } from "@/lib/validations/env";
import { logger } from "@/lib/observability/logger";

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

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error: any) {
    logger.error({ error, key }, "Redis GET failure");
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttl = 3600): Promise<void> {
  try {
    const client = getRedisClient();
    await client.set(key, JSON.stringify(value), "EX", ttl);
  } catch (error: any) {
    logger.error({ error, key }, "Redis SET failure");
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error: any) {
    logger.error({ error, key }, "Redis DEL failure");
  }
}

export function generateCacheKey(domain: string, id: string, params: any = {}): string {
  const paramStr = JSON.stringify(params);
  return `cache:${domain}:${id}:${paramStr}`;
}
