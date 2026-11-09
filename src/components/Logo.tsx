// VistaTrade logo: a striped Miami sunset over a teal horizon, with a wide
// 80s wordmark and a neon script "trade".
import { cn } from '@/lib/format';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn('h-8 w-8', className)} aria-hidden="true">
      <defs>
        <linearGradient id="vt-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7A072" />
          <stop offset="0.55" stopColor="#F0609E" />
          <stop offset="1" stopColor="#9B6BFF" />
        </linearGradient>
        <clipPath id="vt-cut">
          {/* Classic retro sunset: solid top, thinning stripes toward the horizon. */}
          <rect x="0" y="0" width="40" height="19" />
          <rect x="0" y="20.5" width="40" height="3" />
          <rect x="0" y="25" width="40" height="2.2" />
          <rect x="0" y="28.6" width="40" height="1.4" />
        </clipPath>
      </defs>
      <circle cx="20" cy="20" r="13" fill="url(#vt-sun)" clipPath="url(#vt-cut)" />
      <path d="M4 31.5h32" stroke="#3CCFC6" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 35h22" stroke="#3CCFC6" strokeOpacity="0.45" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="flex items-baseline leading-none">
        <span className="font-display text-[15px] tracking-[0.22em] text-text">VISTA</span>
        <span
          className="-ml-0.5 font-script text-[26px] text-vice-pink"
          style={{ textShadow: '0 0 12px rgb(240 96 158 / 0.45)' }}
        >
          trade
        </span>
      </span>
    </span>
  );
}
