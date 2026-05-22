"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type TurnstileFieldProps = {
  siteKey: string;
};

type TurnstileRenderOptions = {
  sitekey: string;
  theme: "light" | "dark" | "auto";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  "timeout-callback"?: () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function TurnstileField({ siteKey }: TurnstileFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState("");
  const [scriptReady, setScriptReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.turnstile),
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!scriptReady || !container || !window.turnstile || widgetIdRef.current) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(container, {
      sitekey: siteKey,
      theme: "dark",
      callback: (nextToken) => setToken(nextToken),
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
      "timeout-callback": () => setToken(""),
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [scriptReady, siteKey]);

  return (
    <>
      <Script
        id="cf-turnstile-api"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div style={{ marginBottom: 18, minHeight: 70 }}>
        <div ref={containerRef} />
        <input type="hidden" name="captchaToken" value={token} readOnly />
      </div>
    </>
  );
}
