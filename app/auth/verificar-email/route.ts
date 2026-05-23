import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { provisionTrialTenant } from "@/lib/auth/provision-tenant";
import {
  claimSignupVerificationToken,
  completeSignupVerificationToken,
} from "@/lib/auth/signup-verification";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=verification_missing", requestUrl.origin));
  }

  const headerIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const limit = await checkRateLimit({
    key: `signup-verify:${headerIp}`,
    limit: 20,
    windowSeconds: 15 * 60,
  });

  if (!limit.allowed) {
    return NextResponse.redirect(
      new URL("/login?error=verification_rate_limited", requestUrl.origin),
    );
  }

  const claimed = await claimSignupVerificationToken(token);
  if (!claimed) {
    return NextResponse.redirect(
      new URL("/login?error=verification_invalid_or_expired", requestUrl.origin),
    );
  }

  const admin = createAdminClient();
  try {
    await provisionTrialTenant({
      userId: claimed.user_id,
      email: claimed.email,
      nome: claimed.nome,
      empresaNome: claimed.empresa_nome,
    });
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=verification_provision_failed", requestUrl.origin),
    );
  }

  const { error: confirmError } = await admin.auth.admin.updateUserById(claimed.user_id, {
    email_confirm: true,
  });

  if (confirmError) {
    return NextResponse.redirect(
      new URL("/login?error=verification_confirm_failed", requestUrl.origin),
    );
  }

  await completeSignupVerificationToken(token);

  return NextResponse.redirect(new URL("/login?verified=1", requestUrl.origin));
}
