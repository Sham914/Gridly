import type { ReactNode } from "react";

export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h2 className="text-base font-semibold text-ink-primary">{title}</h2>
        {description && (
          <p className="text-sm text-ink-muted mt-0.5 max-w-xl">{description}</p>
        )}
      </div>
      {actions}
    </div>
  );
}
