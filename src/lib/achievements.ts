// Achievements are pure checks over the saved state. The AchievementWatcher
// component runs them whenever state changes and unlocks any new ones.

import type { Account } from '@/lib/trading/engine';
import { LESSONS } from '@/lib/learn/lessons';

export interface AchievementContext {
  account: Account;
  equity: number;
  completedLessons: Record<string, string>;
  quizScores: Record<string, { score: number; total: number }>;
  flags: Record<string, boolean>;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name, mapped in the UI
  check: (ctx: AchievementContext) => boolean;
}

const filled = (a: Account) => a.orders.filter((o) => o.status === 'filled');

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_trade',
    name: 'First steps',
    description: 'Make your first trade.',
    icon: 'Footprints',
    check: ({ account }) => filled(account).length > 0,
  },
  {
    id: 'limit_order',
    name: 'Name your price',
    description: 'Place a limit order.',
    icon: 'Target',
    check: ({ account }) => account.orders.some((o) => o.type === 'limit'),
  },
  {
    id: 'diversified',
    name: 'Spread out',
    description: 'Own 5 different stocks at once.',
    icon: 'Shapes',
    check: ({ account }) => Object.keys(account.positions).length >= 5,
  },
  {
    id: 'green_trade',
    name: 'In the green',
    description: 'Sell shares for a profit.',
    icon: 'TrendingUp',
    check: ({ account }) => filled(account).some((o) => (o.realizedPnl ?? 0) > 0),
  },
  {
    id: 'ten_percent',
    name: 'Ten-bagger lite',
    description: 'Close a trade with a 10%+ return.',
    icon: 'Rocket',
    check: ({ account }) =>
      filled(account).some((o) => {
        if (o.side !== 'sell' || !o.fillPrice || o.realizedPnl === undefined) return false;
        const cost = o.qty * o.fillPrice - o.realizedPnl;
        return cost > 0 && o.realizedPnl / cost >= 0.1;
      }),
  },
  {
    id: 'beat_start',
    name: 'Up 5%',
    description: 'Grow your portfolio 5% above your starting cash.',
    icon: 'Sun',
    check: ({ account, equity }) => equity >= account.startingCash * 1.05,
  },
  {
    id: 'first_lesson',
    name: 'Class is in session',
    description: 'Finish your first lesson.',
    icon: 'BookOpen',
    check: ({ completedLessons }) => Object.keys(completedLessons).length >= 1,
  },
  {
    id: 'quiz_ace',
    name: 'Quiz ace',
    description: 'Get a perfect score on 3 quizzes.',
    icon: 'Sparkles',
    check: ({ quizScores }) => Object.values(quizScores).filter((q) => q.score === q.total).length >= 3,
  },
  {
    id: 'graduate',
    name: 'Graduate',
    description: 'Finish every lesson in the course.',
    icon: 'GraduationCap',
    check: ({ completedLessons }) => LESSONS.every((l) => completedLessons[l.slug]),
  },
  {
    id: 'skeptic',
    name: 'Healthy skeptic',
    description: 'Compare the forecast model to its baselines.',
    icon: 'Scale',
    check: ({ flags }) => Boolean(flags.viewedForecasts),
  },
];

export function earnedAchievements(ctx: AchievementContext): string[] {
  return ACHIEVEMENTS.filter((a) => a.check(ctx)).map((a) => a.id);
}
