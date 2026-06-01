import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="of-page-head">
      <div className="of-page-head-main">
        {typeof eyebrow === "string" && eyebrow.trim().length > 0 ? (
          <p className="of-page-eyebrow">{eyebrow}</p>
        ) : null}
        <h1 className="of-page-title">{title}</h1>
        {typeof subtitle === "string" && subtitle.trim().length > 0 ? (
          <p className="of-page-subtitle">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="of-page-head-actions">{actions}</div> : null}
    </div>
  );
}
