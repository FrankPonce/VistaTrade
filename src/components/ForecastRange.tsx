// A forecast drawn as a range bar: the band is the 10-90% uncertainty range,
// the dot is the model's central guess, and the line marks "no change".
import { toPct, type HorizonForecast } from '@/lib/forecasts';
import { pct } from '@/lib/format';

export function ForecastRange({ f, scale = 6 }: { f: HorizonForecast; scale?: number }) {
  const low = toPct(f.low);
  const high = toPct(f.high);
  const mid = toPct(f.predReturn);
  // Map -scale%..+scale% onto 0..100% width.
  const x = (v: number) => `${Math.min(100, Math.max(0, ((v + scale) / (2 * scale)) * 100))}%`;

  return (
    <div className="w-full">
      <div className="relative h-5" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-edge/20" />
        <div className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-muted/60" style={{ left: x(0) }} />
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-vice-purple/35"
          style={{ left: x(low), width: `calc(${x(high)} - ${x(low)})` }}
        />
        <div
          className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${mid >= 0 ? 'bg-vice-teal' : 'bg-vice-pink'}`}
          style={{ left: x(mid) }}
        />
      </div>
      <p className="num mt-0.5 text-xs text-muted">
        <span className={mid >= 0 ? 'text-up' : 'text-down'}>{pct(mid)}</span> · range {pct(low, 1)} to {pct(high, 1)}
      </p>
    </div>
  );
}
