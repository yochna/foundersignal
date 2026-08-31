import { cn } from '@/lib/utils';

/**
 * Consistent page masthead. Every route uses this so headings, descriptions and
 * action placement stay identical across the app.
 */
export function PageHeader({ eyebrow, title, description, icon: Icon, actions, className, children }) {
  return (
    <div className={cn('mb-7', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="flex items-center gap-2.5 text-2xl font-black leading-tight tracking-tight text-on-surface sm:text-[28px]">
            {Icon ? <Icon className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" /> : null}
            <span className="min-w-0">{title}</span>
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export default PageHeader;
