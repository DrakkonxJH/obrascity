import { createHash } from "node:crypto";
import { getRedisClient } from "@/lib/cache/redis";

type RateLimitInput = {
  key: string;
  windowSeconds: number;
  limit: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
};

const memoryBuckets = new Map<string, { count: number; expiresAt: number }>();

function checkMemoryRateLimit(input: RateLimitInput): RateLimitResult {
  const bucket = createHash("sha256").update(input.key).digest("hex");
  const now = Date.now();
  const existing = memoryBuckets.get(bucket);

  if (!existing || existing.expiresAt <= now) {
    memoryBuckets.set(bucket, {
      count: 1,
      expiresAt: now + input.windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: input.limit - 1,
      retryAfter: input.windowSeconds,
    };
  }

  existing.count += 1;
  const allowed = existing.count <= input.limit;
  return {
    allowed,
    remaining: Math.max(0, input.limit - existing.count),
    retryAfter: Math.max(1, Math.ceil((existing.expiresAt - now) / 1000)),
  };
}

export async function checkRateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  if (!process.env.REDIS_URL) {
    return checkMemoryRateLimit(input);
  }

  const redis = getRedisClient();
  const bucket = createHash("sha256").update(input.key).digest("hex");
  const redisKey = `ratelimit:${bucket}`;

  const tx = redis.multi();
  tx.incr(redisKey);
  tx.expire(redisKey, input.windowSeconds, "NX");
  const execResult = await tx.exec();
  if (!execResult) {
    throw new Error("Falha ao executar transacao de rate limit");
  }
  const [incrResult] = execResult;

  const current = Number(incrResult?.[1] ?? 0);
  const allowed = current <= input.limit;
  return {
    allowed,
    remaining: Math.max(0, input.limit - current),
    retryAfter: input.windowSeconds,
  };
}
