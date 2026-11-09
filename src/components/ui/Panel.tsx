import { cn } from '@/lib/format';

/** The glass card everything sits on. */
export function Panel({
  title,
  action,
  className,
  children,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('glass p-4 md:p-5', className)}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="label">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
