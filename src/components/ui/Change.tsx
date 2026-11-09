import { cn, pct, signedMoney, tone } from '@/lib/format';

/** A gain/loss figure, coloured teal (up) or pink (down). */
export function Change({ value, percent, className }: { value?: number; percent?: number; className?: string }) {
  const sign = value ?? percent ?? 0;
  return (
    <span className={cn('num', tone(sign), className)}>
      {value !== undefined && signedMoney(value)}
      {value !== undefined && percent !== undefined && ' '}
      {percent !== undefined && (value !== undefined ? `(${pct(percent)})` : pct(percent))}
    </span>
  );
}
