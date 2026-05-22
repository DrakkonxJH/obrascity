import { NextResponse } from "next/server";
import { getManagedQueues } from "@/lib/queue/connection";

export async function GET() {
  const queues = getManagedQueues();
  const stats = await Promise.all(
    queues.map(async (queue) => {
      const counts = await queue.getJobCounts(
        "active",
        "completed",
        "delayed",
        "failed",
        "waiting",
      );

      return {
        queue: queue.name,
        ...counts,
      };
    }),
  );

  return NextResponse.json({ stats });
}
