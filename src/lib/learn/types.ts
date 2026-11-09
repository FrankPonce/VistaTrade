import type { Account } from '@/lib/trading/engine';

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number; // index into options
  explanation: string;
}

/** What a "try it" task can look at to decide whether it's done. */
export interface TaskContext {
  account: Account;
  watchlist: string[];
  flags: Record<string, boolean>;
  /** Live value of each position as a share of the whole portfolio (0-1). */
  weights: Record<string, number>;
  sectorOf: (symbol: string) => string | undefined;
}

export interface LessonTask {
  title: string;
  description: string;
  href: string;
  cta: string;
  isDone: (ctx: TaskContext) => boolean;
}

export interface Lesson {
  slug: string;
  title: string;
  minutes: number;
  summary: string;
  /** Lesson body. Paragraphs split on blank lines; "### " starts a heading; "- " a bullet; **bold** works. */
  body: string;
  keyTerms: { term: string; definition: string }[];
  quiz: QuizQuestion[];
  task?: LessonTask;
  /** Notes for the author: claims worth double-checking before publishing. Not shown to users. */
  review?: string[];
}
