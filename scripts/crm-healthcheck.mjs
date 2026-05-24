#!/usr/bin/env node

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const endpoint = `${appUrl.replace(/\/$/, "")}/api/crm/proxy`;

async function main() {
  try {
    const response = await fetch(endpoint, { method: "GET", redirect: "manual" });
    if (response.status >= 200 && response.status < 500) {
      console.log(`[crm:health] ok endpoint=${endpoint} status=${response.status}`);
      return;
    }
    console.error(`[crm:health] fail endpoint=${endpoint} status=${response.status}`);
    process.exitCode = 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[crm:health] fail endpoint=${endpoint} error=${message}`);
    process.exitCode = 1;
  }
}

void main();
