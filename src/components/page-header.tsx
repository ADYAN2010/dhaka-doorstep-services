import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, className = "" }: Props) {
  return (
    <section className={`relative overflow-hidden border-b border-border bg-gradient-subtle ${className}`}>
      <div className="container-page py-14 md:py-20">
        {eyebrow && (
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {eyebrow}
          </span>
        )}
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-foreground md:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">{description}</p>
        )}
      </div>
    </section>
  );
}
