import type { ReactNode } from "react";

type AuthShellProps = {
  badge: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({
  badge,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="flex min-h-[560px] items-center justify-center bg-gradient-to-b from-background to-muted/40 p-4 text-foreground">
      <div className="w-full max-w-sm rounded-3xl border border-border/70 bg-background/95 p-5 shadow-sm backdrop-blur">
        <div className="mb-6">
          <div className="mb-3 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {badge}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div>{children}</div>

        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  );
}