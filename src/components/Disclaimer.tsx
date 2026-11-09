import Link from 'next/link';

export function Disclaimer() {
  return (
    <footer className="mx-auto max-w-7xl px-4 pb-28 pt-10 text-xs leading-relaxed text-faint md:px-6 lg:pb-10">
      <p>
        <span className="text-muted">Educational only. Not financial advice.</span> VistaTrade uses virtual money; no real
        trades are placed. Prices may be delayed, partial (single-exchange) or simulated, and forecasts are an experiment
        in how little a model can know, not recommendations.{' '}
        <Link href="/about" className="underline decoration-faint underline-offset-2 hover:text-muted">
          Data sources and details
        </Link>
        .
      </p>
    </footer>
  );
}
