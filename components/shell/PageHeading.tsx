import { cn } from "@/lib/utils";

export function PageHeading({
  eyebrow,
  title,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex items-end justify-between gap-4", className)}>
      <div>
        {eyebrow && (
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-fg-3">
            {eyebrow}
          </div>
        )}
        <h1 className="m-0 font-display text-3xl font-semibold tracking-[-0.018em] text-fg-1">
          {title}
        </h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  icon,
  action,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-[460px] flex-col items-center gap-3 py-16 text-center">
      {icon && <div className="text-fg-4">{icon}</div>}
      <div className="text-base font-medium text-fg-1">{title}</div>
      {hint && <div className="text-sm text-fg-3">{hint}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
