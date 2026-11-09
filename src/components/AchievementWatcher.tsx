// Watches saved state and unlocks achievements as soon as they're earned.
'use client';

import { useEffect } from 'react';
import { ACHIEVEMENTS, earnedAchievements } from '@/lib/achievements';
import { equity } from '@/lib/trading/engine';
import { pricesOf, useQuotes } from '@/lib/quotes';
import { useHydrated, useStore } from '@/lib/store';
import { useToasts } from '@/lib/toasts';

export function AchievementWatcher() {
  const hydrated = useHydrated();
  const state = useStore();
  const quotes = useQuotes((s) => s.quotes);

  useEffect(() => {
    if (!hydrated) return;
    const earned = earnedAchievements({
      account: state.account,
      equity: equity(state.account, pricesOf(quotes)),
      completedLessons: state.completedLessons,
      quizScores: state.quizScores,
      flags: state.flags,
    });
    const fresh = earned.filter((id) => !state.achievements[id]);
    if (fresh.length === 0) return;

    state.unlock(fresh);
    fresh.forEach((id) => {
      const a = ACHIEVEMENTS.find((x) => x.id === id)!;
      useToasts.getState().push({ title: `Achievement unlocked: ${a.name}`, body: a.description, tone: 'brand' });
    });
  }, [hydrated, state, quotes]);

  return null;
}
