"use client";

import { useEffect, useRef } from "react";

type TurnstileFieldProps = {
  siteKey: string;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset?: (widgetId?: string) => void;
      remove?: (widgetId?: string) => void;
    };
  }
}

export function TurnstileField({ siteKey }: TurnstileFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<HTMLInputElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const tokenInput = tokenRef.current;
    if (!container || !tokenInput) return;

    const renderTurnstile = () => {
      if (!window.turnstile) return;

      try {
        const widgetId = window.turnstile.render(container, {
          sitekey: siteKey,
          theme: "dark",
          callback: (token) => {
            tokenInput.value = token;
          },
          "expired-callback": () => {
            tokenInput.value = "";
          },
          "error-callback": () => {
            console.warn("Turnstile error - form can still be submitted");
          },
        });
        widgetIdRef.current = widgetId;
      } catch (error) {
        console.error("Failed to render Turnstile:", error);
      }
    };

    if (window.turnstile) {
      renderTurnstile();
    } else {
      const checkTurnstile = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkTurnstile);
          renderTurnstile();
        }
      }, 100);

      return () => clearInterval(checkTurnstile);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [siteKey]);

  return (
    <div style={{ marginBottom: 18 }}>
      <div ref={containerRef} />
      <input ref={tokenRef} type="hidden" name="captchaToken" />
    </div>
  );
}
