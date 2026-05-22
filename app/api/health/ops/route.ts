import { NextResponse } from "next/server";
import { getManagedQueues } from "@/lib/queue/connection";

const startedAt = Date.now();

export async function GET() {
  const queues = getManagedQueues();
  const counts = await Promise.all(
    queues.map(async (queue) => {
      const metrics = await queue.getJobCounts(
        "active",
        "completed",
        "delayed",
        "failed",
        "waiting",
      );
      return {
        queue: queue.name,
        ...metrics,
      };
    }),
  );

  return NextResponse.json({
    status: "ok",
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    queues: counts,
    sloTargets: {
      apiAvailability: "99.9%",
      p95LatencyMs: 800,
      failedJobRatePercent: 1,
    },
  });
}
