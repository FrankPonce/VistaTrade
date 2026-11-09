'use client';

import Link from 'next/link';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { LESSONS } from '@/lib/learn/lessons';
import { useHydrated, useStore } from '@/lib/store';
import { cn } from '@/lib/format';

export default function LearnPage() {
  const hydrated = useHydrated();
  const completed = useStore((s) => s.completedLessons);
  const scores = useStore((s) => s.quizScores);
  const done = hydrated ? Object.keys(completed).length : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Learn</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          A short course from zero. Each lesson takes about five minutes, ends with a quick quiz, and most have a
          &ldquo;try it&rdquo; task you do with your paper account.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-vice-purple via-vice-pink to-vice-sunset"
              style={{ width: `${(done / LESSONS.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted">
            {done} of {LESSONS.length} complete
          </span>
        </div>
      </div>

      <ol className="grid gap-3 md:grid-cols-2">
        {LESSONS.map((lesson, i) => {
          const isDone = hydrated && Boolean(completed[lesson.slug]);
          const score = hydrated ? scores[lesson.slug] : undefined;
          return (
            <li key={lesson.slug}>
              <Link href={`/learn/${lesson.slug}`} className="glass glass-hover flex h-full gap-4 p-4 md:p-5">
                <span className={cn('font-display text-sm', isDone ? 'text-vice-teal' : 'text-faint')}>{String(i + 1).padStart(2, '0')}</span>
                <div className="flex-1">
                  <p className="font-semibold">{lesson.title}</p>
                  <p className="mt-1 text-sm text-muted">{lesson.summary}</p>
                  <p className="mt-3 flex items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {lesson.minutes} min
                    </span>
                    {score && (
                      <span>
                        Quiz {score.score}/{score.total}
                      </span>
                    )}
                  </p>
                </div>
                {isDone ? <CheckCircle2 className="h-5 w-5 text-vice-teal" aria-label="Completed" /> : <Circle className="h-5 w-5 text-faint" aria-label="Not started" />}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
