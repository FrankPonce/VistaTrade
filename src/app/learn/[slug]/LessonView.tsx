'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { LESSONS, getLesson } from '@/lib/learn/lessons';
import type { Lesson, TaskContext } from '@/lib/learn/types';
import { findInUniverse } from '@/lib/market/universe';
import { useHydrated, useStore } from '@/lib/store';
import { usePortfolio } from '@/lib/usePortfolio';
import { cn } from '@/lib/format';

/** Pass mark: two thirds of the questions right. */
const passMark = (total: number) => Math.ceil((total * 2) / 3);

export function LessonView({ slug }: { slug: string }) {
  const lesson = getLesson(slug)!;
  const index = LESSONS.indexOf(lesson);
  const prev = LESSONS[index - 1];
  const next = LESSONS[index + 1];

  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <Link href="/learn" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
        <ArrowLeft className="h-4 w-4" /> All lessons
      </Link>

      <header>
        <p className="label">
          Lesson {index + 1} of {LESSONS.length} · {lesson.minutes} min
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{lesson.title}</h1>
        <p className="mt-2 text-muted">{lesson.summary}</p>
      </header>

      <Panel>
        <LessonBody text={lesson.body} />
      </Panel>

      <Panel title="Key terms">
        <dl className="grid gap-3 sm:grid-cols-2">
          {lesson.keyTerms.map((k) => (
            <div key={k.term} className="rounded-xl bg-black/30 p-3">
              <dt className="text-sm font-medium text-vice-pink">{k.term}</dt>
              <dd className="mt-1 text-sm text-muted">{k.definition}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      {lesson.task && <Task lesson={lesson} />}

      <Quiz lesson={lesson} />

      <nav className="flex justify-between gap-3 pt-2 text-sm">
        {prev ? (
          <Link href={`/learn/${prev.slug}`} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" /> {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/learn/${next.slug}`} className="btn-ghost">
            {next.title} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </nav>
    </article>
  );
}

/** Tiny renderer for lesson text: "### " headings, "- " bullets, **bold**, blank-line paragraphs. */
function LessonBody({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n|\n(?=### )/);
  return (
    <div className="prose-lesson">
      {blocks.map((block, i) => {
        const lines = block.trim().split('\n');
        if (lines[0].startsWith('### ')) {
          const rest = lines.slice(1).join('\n');
          return (
            <Fragment key={i}>
              <h3>{lines[0].slice(4)}</h3>
              {rest && <Block text={rest} />}
            </Fragment>
          );
        }
        return <Block key={i} text={block} />;
      })}
    </div>
  );
}

/** A block of text: consecutive "- " lines become a list, other lines a paragraph. */
function Block({ text }: { text: string }) {
  const groups: { bullets: boolean; lines: string[] }[] = [];
  for (const line of text.trim().split('\n')) {
    const bullets = line.startsWith('- ');
    const last = groups[groups.length - 1];
    if (last && last.bullets === bullets) last.lines.push(bullets ? line.slice(2) : line);
    else groups.push({ bullets, lines: [bullets ? line.slice(2) : line] });
  }
  return (
    <>
      {groups.map((g, i) =>
        g.bullets ? (
          <ul key={i}>
            {g.lines.map((l, j) => (
              <li key={j}>{inline(l)}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{inline(g.lines.join(' '))}</p>
        )
      )}
    </>
  );
}

function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

function Task({ lesson }: { lesson: Lesson }) {
  const hydrated = useHydrated();
  const account = useStore((s) => s.account);
  const watchlist = useStore((s) => s.watchlist);
  const flags = useStore((s) => s.flags);
  const { weights } = usePortfolio();
  const task = lesson.task!;

  const ctx: TaskContext = { account, watchlist, flags, weights, sectorOf: (s) => findInUniverse(s)?.sector };
  const done = hydrated && task.isDone(ctx);

  return (
    <Panel title="Try it">
      <div className="flex items-start gap-3">
        {done ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-vice-teal" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-faint" />}
        <div className="flex-1">
          <p className="font-medium">{task.title}</p>
          <p className="mt-1 text-sm text-muted">{task.description}</p>
        </div>
        {!done && (
          <Link href={task.href} className="btn-ghost shrink-0">
            {task.cta}
          </Link>
        )}
      </div>
    </Panel>
  );
}

function Quiz({ lesson }: { lesson: Lesson }) {
  const recordQuiz = useStore((s) => s.recordQuiz);
  const completeLesson = useStore((s) => s.completeLesson);
  const completed = useStore((s) => Boolean(s.completedLessons[lesson.slug]));
  const hydrated = useHydrated();

  const [answers, setAnswers] = useState<(number | null)[]>(lesson.quiz.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const score = answers.filter((a, i) => a === lesson.quiz[i].answer).length;
  const passed = score >= passMark(lesson.quiz.length);

  function submit() {
    if (answers.some((a) => a === null)) return setError('Answer every question first.');
    setError(null);
    setSubmitted(true);
    recordQuiz(lesson.slug, score, lesson.quiz.length);
    if (passed) completeLesson(lesson.slug);
  }

  function retry() {
    setAnswers(lesson.quiz.map(() => null));
    setSubmitted(false);
  }

  return (
    <Panel title="Quiz" action={hydrated && completed ? <span className="text-xs text-vice-teal">Lesson complete</span> : null}>
      <ol className="space-y-6">
        {lesson.quiz.map((q, qi) => (
          <li key={qi}>
            <p className="font-medium">
              {qi + 1}. {q.question}
            </p>
            <div className="mt-3 grid gap-2" role="radiogroup" aria-label={`Question ${qi + 1}`}>
              {q.options.map((opt, oi) => {
                const chosen = answers[qi] === oi;
                const correct = q.answer === oi;
                return (
                  <button
                    key={oi}
                    role="radio"
                    aria-checked={chosen}
                    disabled={submitted}
                    onClick={() => {
                      setError(null);
                      setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)));
                    }}
                    className={cn(
                      'rounded-xl border px-4 py-2.5 text-left text-sm transition disabled:cursor-default',
                      !submitted && (chosen ? 'border-vice-purple/70 bg-vice-purple/15' : 'border-edge/15 hover:border-edge/40'),
                      submitted && correct && 'border-vice-teal/60 bg-vice-teal/10',
                      submitted && chosen && !correct && 'border-vice-pink/60 bg-vice-pink/10',
                      submitted && !chosen && !correct && 'border-edge/10 opacity-60'
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {submitted && <p className="mt-2 text-sm text-muted">{q.explanation}</p>}
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {!submitted ? (
          <button className="btn-primary" onClick={submit}>
            Check answers
          </button>
        ) : (
          <>
            <p className={cn('text-sm font-medium', passed ? 'text-vice-teal' : 'text-vice-pink')}>
              {score} / {lesson.quiz.length} correct. {passed ? 'Lesson complete.' : `You need ${passMark(lesson.quiz.length)} to pass.`}
            </p>
            <button className="btn-ghost" onClick={retry}>
              Try again
            </button>
          </>
        )}
        {error && (
          <p className="text-sm text-vice-pink" role="alert">
            {error}
          </p>
        )}
      </div>
    </Panel>
  );
}
