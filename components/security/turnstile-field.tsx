"use client";

type TurnstileFieldProps = {
  siteKey: string;
};

export function TurnstileField({ siteKey }: TurnstileFieldProps) {
  return (
    <div style={{ marginBottom: 18, minHeight: 70 }}>
      <div
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-theme="dark"
        data-response-field-name="captchaToken"
      />
    </div>
  );
}
