import type { ReactNode } from "react";

export function PageHeader({
  icon,
  title,
  subtitle,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        {icon}
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
      </div>
      {subtitle && (
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
