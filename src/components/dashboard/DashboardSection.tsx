import type { ReactNode } from 'react';

interface DashboardSectionProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function DashboardSection({ title, subtitle, children, actions, className = '' }: DashboardSectionProps) {
  return (
    <section className={`surface-panel surface-panel-strong p-5 md:p-6 ${className}`.trim()}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <span className="label-text text-muted-foreground">{title}</span>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}