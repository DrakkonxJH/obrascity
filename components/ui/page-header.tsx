import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="of-page-head">
      <div className="of-page-head-main">
        <h1 className="of-page-title">{title}</h1>
      </div>
      {actions ? <div className="of-page-head-actions">{actions}</div> : null}
    </div>
  );
}
