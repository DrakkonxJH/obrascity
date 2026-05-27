import { headers as getHeaders } from "next/headers";
import { getEnv } from "@/lib/validations/env";

function parseList(value: string | undefined) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getControlTotalAllowedIps() {
  const env = getEnv();
  return parseList(env.CONTROLE_TOTAL_ALLOWED_IPS);
}

export function getRequestIpFromHeaders(headerStore: Headers | HeadersList | null | undefined) {
  if (!headerStore) return "unknown";

  const forwarded = headerStore.get("x-forwarded-for") ?? "";
  const forwardedFirst = forwarded.split(",")[0]?.trim();
  if (forwardedFirst) return forwardedFirst;

  const realIp = headerStore.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const cfConnectingIp = headerStore.get("cf-connecting-ip")?.trim();
  if (cfConnectingIp) return cfConnectingIp;

  return "unknown";
}

type HeadersList = {
  get(name: string): string | null;
};

export function isMasterIpAllowed(ip: string | null | undefined) {
  const allowedIps = getControlTotalAllowedIps();
  if (allowedIps.length === 0) return true;
  const normalized = String(ip ?? "").trim();
  return allowedIps.includes(normalized);
}

export async function getCurrentRequestIp() {
  const headerStore = await getHeaders();
  return getRequestIpFromHeaders(headerStore);
}
