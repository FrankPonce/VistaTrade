// Shape of public/forecasts/latest.json, written by ml/train.py.
// Keep the two in sync.
'use client';

import { useEffect, useState } from 'react';

export type Horizon = '1' | '5'; // trading days ahead

export interface HorizonForecast {
  /** Predicted log return over the horizon, e.g. 0.004 = about +0.4%. */
  predReturn: number;
  /** 10th and 90th percentile of predicted return: the uncertainty range. */
  low: number;
  high: number;
}

export interface SymbolForecast {
  symbol: string;
  asOf: string; // date of the last close used
  lastClose: number;
  horizons: Record<Horizon, HorizonForecast>;
}

export interface Metrics {
  /** Share of predictions with the right sign (up vs down). */
  directionAcc: number;
  /** Mean absolute error of the predicted return. */
  mae: number;
}

export interface HorizonBacktest {
  model: Metrics;
  baselines: {
    /** "Tomorrow = today": predict zero return. Its direction accuracy is undefined. */
    noChange: { mae: number };
    /** Always predict "up" (with the average historical return as the size). */
    alwaysUp: Metrics;
  };
  /** Share of outcomes that landed inside the 10-90% range (ideal: about 0.80). */
  intervalCoverage: number;
  n: number;
}

export interface ForecastFile {
  generatedAt: string;
  dataThrough: string;
  /** True for the placeholder file shipped before the first real run. */
  sample: boolean;
  model: { name: string; features: string[]; notes: string };
  backtest: {
    start: string;
    end: string;
    folds: number;
    horizons: Record<Horizon, HorizonBacktest>;
  };
  forecasts: SymbolForecast[];
}

export function useForecasts() {
  const [data, setData] = useState<ForecastFile | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    fetch('/forecasts/latest.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);
  return { data, error };
}

/** Log return → simple percent change, for display. */
export function toPct(logReturn: number): number {
  return (Math.exp(logReturn) - 1) * 100;
}
