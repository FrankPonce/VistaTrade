'use client';

import { X } from 'lucide-react';
import { useToasts } from '@/lib/toasts';
import { cn } from '@/lib/format';

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:pr-6" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'glass pointer-events-auto flex w-full max-w-sm items-start gap-3 border-l-2 px-4 py-3',
            t.tone === 'up' && 'border-l-vice-teal',
            t.tone === 'down' && 'border-l-vice-pink',
            (!t.tone || t.tone === 'brand') && 'border-l-vice-purple'
          )}
        >
          <div className="flex-1">
            <p className="text-sm font-medium">{t.title}</p>
            {t.body && <p className="mt-0.5 text-xs text-muted">{t.body}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="text-muted hover:text-text" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
