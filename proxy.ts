import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const maintenanceMode = process.env.MAINTENANCE_MODE === "true";
  if (maintenanceMode) {
    return new NextResponse("Servico temporariamente indisponivel.", {
      status: 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
