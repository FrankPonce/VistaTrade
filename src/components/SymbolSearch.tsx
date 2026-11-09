// Search box for any stock. Results come from /api/search (all US stocks when
// real data is configured, the tracked list in simulated mode).
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import type { SymbolInfo } from '@/lib/market/types';
import { cn } from '@/lib/format';

export function SymbolSearch({ autoFocus, onPick }: { autoFocus?: boolean; onPick?: (symbol: string) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SymbolInfo[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced search: wait 200 ms after typing stops.
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await res.json();
        setResults(data.results ?? []);
        setActive(0);
      } catch {
        /* aborted or offline: keep previous results */
      }
    }, 200);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  // Close when clicking outside.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function pick(symbol: string) {
    setQuery('');
    setOpen(false);
    if (onPick) onPick(symbol);
    else router.push(`/stocks/${symbol}`);
  }

  return (
    <div ref={boxRef} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
      <input
        className="input pl-9"
        placeholder="Search stocks"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') setActive((i) => Math.min(i + 1, results.length - 1));
          if (e.key === 'ArrowUp') setActive((i) => Math.max(i - 1, 0));
          if (e.key === 'Enter' && results[active]) pick(results[active].symbol);
          if (e.key === 'Escape') setOpen(false);
        }}
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="symbol-search-results"
      />
      {open && results.length > 0 && (
        <ul id="symbol-search-results" role="listbox" className="glass absolute z-50 mt-2 w-full overflow-hidden p-1">
          {results.map((r, i) => (
            <li key={r.symbol} role="option" aria-selected={i === active}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(r.symbol)}
                className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm', i === active && 'bg-white/[0.06]')}
              >
                <span className="w-14 shrink-0 font-medium">{r.symbol}</span>
                <span className="truncate text-muted">{r.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
