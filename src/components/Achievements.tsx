'use client';

import {
  Award,
  BookOpen,
  Footprints,
  GraduationCap,
  Rocket,
  Scale,
  Shapes,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/format';

const ICONS: Record<string, LucideIcon> = {
  BookOpen, Footprints, GraduationCap, Rocket, Scale, Shapes, Sparkles, Sun, Target, TrendingUp,
};

export function AchievementsGrid({ compact = false }: { compact?: boolean }) {
  const unlocked = useStore((s) => s.achievements);
  return (
    <ul className={cn('grid gap-2', compact ? 'grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3')}>
      {ACHIEVEMENTS.map((a) => {
        const Icon = ICONS[a.icon] ?? Award;
        const done = Boolean(unlocked[a.id]);
        return (
          <li
            key={a.id}
            title={`${a.name}: ${a.description}`}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-3',
              done ? 'border-vice-purple/40 bg-vice-purple/10' : 'border-edge/10 opacity-50',
              compact && 'justify-center p-2.5'
            )}
          >
            <Icon className={cn('h-5 w-5 shrink-0', done ? 'text-vice-pink' : 'text-faint')} aria-hidden="true" />
            {compact ? (
              <span className="sr-only">
                {a.name}: {done ? 'unlocked' : 'locked'}
              </span>
            ) : (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{a.name}</p>
                <p className="truncate text-xs text-muted">{a.description}</p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
