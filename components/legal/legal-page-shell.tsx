import type { ReactNode } from "react";

type LegalPageShellProps = {
  title: string;
  children: ReactNode;
};

export function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <section style={{ maxWidth: 980, margin: "0 auto", padding: "24px" }}>
      <article className="of-login-v2-card" style={{ width: "100%" }}>
        <h1 className="of-page-title" style={{ marginBottom: 16 }}>
          {title}
        </h1>
        <div style={{ display: "grid", gap: 14 }}>{children}</div>
      </article>
    </section>
  );
}
