import { notFound } from 'next/navigation';
import { LESSONS, getLesson } from '@/lib/learn/lessons';
import { LessonView } from './LessonView';

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return { title: getLesson((await params).slug)?.title ?? 'Lesson' };
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const lesson = getLesson((await params).slug);
  if (!lesson) notFound();
  return <LessonView slug={lesson.slug} />;
}
