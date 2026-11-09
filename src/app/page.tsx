// Dashboard: portfolio summary, watchlist and lesson of the day up top,
// then today's biggest movers and achievements.
'use client';

import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { PortfolioSummary } from '@/components/PortfolioSummary';
import { EquityChart } from '@/components/EquityChart';
import { QuoteRows, Watchlist } from '@/components/Watchlist';
import { AchievementsGrid } from '@/components/Achievements';
import { LESSONS, lessonOfTheDay } from '@/lib/learn/lessons';
import { UNIVERSE } from '@/lib/market/universe';
import { useQuotes } from '@/lib/quotes';
import { useHydrated, useStore } from '@/lib/store';

export default function DashboardPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
      <Panel className="lg:col-span-2">
        <PortfolioSummary />
        <div className="mt-6">
          <EquityChart />
        </div>
      </Panel>

      <div className="grid gap-4 lg:gap-5">
        <LessonOfTheDay />
        <Panel
          title="Watchlist"
          action={
            <Link href="/markets" className="text-xs text-muted hover:text-text">
              Edit
            </Link>
          }
        >
          <Watchlist />
        </Panel>
      </div>

      <Panel title="Today's movers" className="lg:col-span-1">
        <Movers />
      </Panel>

      <Panel
        title="Achievements"
        className="lg:col-span-2"
        action={<AchievementCount />}
      >
        <AchievementsGrid />
      </Panel>
    </div>
  );
}

function LessonOfTheDay() {
  const hydrated = useHydrated();
  const completed = useStore((s) => s.completedLessons);
  const lesson = lessonOfTheDay(hydrated ? completed : {});
  const index = LESSONS.indexOf(lesson) + 1;
  const done = Object.keys(completed).length;

  return (
    <Link href={`/learn/${lesson.slug}`} className="glass glass-hover group block p-4 md:p-5">
      <p className="label">Lesson of the day</p>
      <p className="mt-2 text-lg font-semibold">{lesson.title}</p>
      <p className="mt-1 text-sm text-muted">{lesson.summary}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> {lesson.minutes} min · lesson {index} of {LESSONS.length}
        </span>
        <span className="flex items-center gap-1 text-vice-pink">
          {hydrated && done > 0 ? `${done}/${LESSONS.length} done` : 'Start'}
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-vice-purple via-vice-pink to-vice-sunset"
          style={{ width: `${(hydrated ? done / LESSONS.length : 0) * 100}%` }}
        />
      </div>
    </Link>
  );
}

function Movers() {
  const quotes = useQuotes((s) => s.quotes);
  const ranked = UNIVERSE.map((s) => quotes[s.symbol])
    .filter(Boolean)
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, 5)
    .map((q) => q.symbol);
  if (ranked.length === 0) return <div className="h-40 animate-pulse rounded-xl bg-white/[0.03]" />;
  return <QuoteRows symbols={ranked} />;
}

function AchievementCount() {
  const hydrated = useHydrated();
  const count = useStore((s) => Object.keys(s.achievements).length);
  return hydrated ? <span className="text-xs text-muted">{count} unlocked</span> : null;
}
