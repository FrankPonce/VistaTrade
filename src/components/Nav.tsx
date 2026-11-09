'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, BrainCircuit, CandlestickChart, LayoutDashboard, Wallet } from 'lucide-react';
import { Logo } from './Logo';
import { DataSourcePill, MarketStatus, SimulatedBanner } from './StatusPills';
import { SymbolSearch } from './SymbolSearch';
import { cn } from '@/lib/format';

const LINKS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/markets', label: 'Markets', icon: CandlestickChart },
  { href: '/portfolio', label: 'Portfolio', icon: Wallet },
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/forecasts', label: 'Forecasts', icon: BrainCircuit },
];

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function Nav() {
  const pathname = usePathname() ?? '/';
  return (
    <>
      {/* Top bar (all sizes) */}
      <header className="sticky top-0 z-40 border-b border-edge/15 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
          <Link href="/" aria-label="VistaTrade home">
            <Logo />
          </Link>
          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm transition',
                  isActive(pathname, href) ? 'bg-white/[0.06] text-text' : 'text-muted hover:text-text'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden w-56 md:block">
              <SymbolSearch />
            </div>
            <div className="hidden items-center gap-2 xl:flex">
              <MarketStatus />
              <DataSourcePill />
            </div>
          </div>
        </div>
      </header>
      <SimulatedBanner />

      {/* Bottom tab bar (phones and tablets) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-edge/20 bg-black/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn('flex flex-col items-center gap-1 py-2.5 text-[11px]', active ? 'text-vice-pink' : 'text-muted')}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
