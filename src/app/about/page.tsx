import Link from 'next/link';
import { Panel } from '@/components/ui/Panel';

export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-semibold">About VistaTrade</h1>

      <Panel title="Disclaimer">
        <div className="prose-lesson text-sm">
          <p>
            <strong>VistaTrade is for education only and is not financial advice.</strong> All money is virtual and no
            real orders are ever sent to a broker. Nothing here is a recommendation to buy or sell any security.
          </p>
          <p>
            The forecasts are a learning exercise about how little short-term price movements can be predicted. In
            backtests the model performs roughly in line with simple baselines. Don&apos;t trade on them.
          </p>
        </div>
      </Panel>

      <Panel title="How paper trading works here">
        <div className="prose-lesson text-sm">
          <ul>
            <li>You start with $10,000 of virtual cash. Your account is saved in this browser only.</li>
            <li>Market orders fill immediately at the last traded price. Limit orders fill when the price reaches your limit.</li>
            <li>No spreads, slippage, commissions, taxes, dividends, short selling or fractional shares.</li>
            <li>Orders can fill outside market hours at the last price, when real brokers would wait for the open.</li>
          </ul>
        </div>
      </Panel>

      <Panel title="Data sources">
        <div className="prose-lesson text-sm">
          <ul>
            <li>
              <strong>Alpaca Market Data (free plan)</strong>: live prices from the IEX exchange and historical bars.
              IEX is one exchange among many, so live prices can differ slightly from the consolidated market price.
              Personal, non-commercial use.
            </li>
            <li>
              <strong>Finnhub (free plan)</strong>: company profiles, key statistics and news. Personal, non-commercial use.
            </li>
            <li>
              When no data keys are configured, prices are <strong>simulated</strong> and clearly labelled as such.
            </li>
          </ul>
          <p>Market data belongs to its providers and exchanges and is shown here for educational purposes only.</p>
        </div>
      </Panel>

      <p className="text-sm text-muted">
        Built by Frank Ponce.{' '}
        <Link href="https://github.com/FrankPonce/VistaTrade" className="text-vice-pink hover:underline">
          Source on GitHub
        </Link>
        .
      </p>
    </div>
  );
}
