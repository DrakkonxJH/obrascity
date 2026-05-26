import type { ReactNode } from "react";

type LegalPageShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function LegalPageShell({ title, subtitle, children }: LegalPageShellProps) {
  return (
    <section style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px 64px" }}>
      <article className="of-login-v2-card" style={{ width: "100%", padding: "40px 48px" }}>
        <div style={{ marginBottom: 32, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 24 }}>
          <h1 className="of-page-title" style={{ marginBottom: 8, fontSize: "1.7rem" }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ color: "var(--of-text-2)", fontSize: "0.85rem", margin: 0 }}>{subtitle}</p>
          )}
        </div>
        <div className="legal-content">{children}</div>
      </article>
      <style>{`
        .legal-content { color: var(--of-text-2); font-size: 0.9rem; line-height: 1.8; }
        .legal-content h2 {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--of-text);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin: 36px 0 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255,107,26,0.25);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .legal-content h2 span.num {
          color: #ff6b1a;
          font-size: 0.85rem;
          font-weight: 700;
          background: rgba(255,107,26,0.1);
          border-radius: 4px;
          padding: 2px 7px;
        }
        .legal-content h3 {
          font-size: 0.92rem;
          font-weight: 600;
          color: var(--of-text);
          margin: 20px 0 8px;
        }
        .legal-content p { margin: 0 0 12px; }
        .legal-content ul, .legal-content ol {
          margin: 8px 0 14px 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .legal-content li { padding-left: 4px; }
        .legal-content strong { color: var(--of-text); font-weight: 600; }
        .legal-content .highlight-box {
          background: rgba(255,107,26,0.07);
          border-left: 3px solid #ff6b1a;
          border-radius: 0 6px 6px 0;
          padding: 12px 16px;
          margin: 14px 0;
          font-size: 0.87rem;
        }
        .legal-content .info-box {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          padding: 12px 16px;
          margin: 14px 0;
          font-size: 0.87rem;
        }
        .legal-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 14px 0;
          font-size: 0.85rem;
        }
        .legal-content th {
          background: rgba(255,107,26,0.1);
          color: var(--of-text);
          font-weight: 600;
          text-align: left;
          padding: 10px 12px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .legal-content td {
          padding: 9px 12px;
          border: 1px solid rgba(255,255,255,0.06);
          vertical-align: top;
        }
        .legal-content tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
        @media (max-width: 640px) {
          article.of-login-v2-card { padding: 24px 20px !important; }
        }
      `}</style>
    </section>
  );
}
