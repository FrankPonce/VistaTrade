"""Walk-forward backtest + today's forecasts.

    python train.py              # real data from ml/data/prices.csv (run fetch.py first)
    python train.py --synthetic  # random-walk prices: a leakage check (see below)

What it does
1. Builds features (features.py) for every stock and day.
2. Walk-forward backtest: train on everything up to a cut-off, predict the
   next ~quarter, move the cut-off forward, repeat. The model never sees the
   period it's being tested on.
3. Compares the model to two baselines on exactly the same test rows:
   "no change" (predict 0% return) and "always up" (predict the average return).
4. Retrains on all the data and forecasts the next 1 and 5 trading days.
5. Writes public/forecasts/latest.json for the app and ml/results/ for the README.

Leakage check: on synthetic random-walk prices nothing is predictable, so the
model must NOT beat the baselines there. If it does, something is leaking.
"""

import argparse
import json
from datetime import datetime, timezone

import lightgbm as lgb
import numpy as np
import pandas as pd

from config import (APP_FORECASTS, HISTORY_START, HORIZONS, MIN_TRAIN_DAYS, PRICES_CSV, QUANTILES,
                    RESULTS_DIR, RETRAIN_EVERY, SYMBOLS)
from features import FEATURES, build

LGB_PARAMS = dict(
    learning_rate=0.03,
    num_leaves=15,
    min_data_in_leaf=200,  # big leaves: daily returns are mostly noise, so keep the model simple
    bagging_fraction=0.8,
    bagging_freq=1,
    feature_fraction=0.8,
    seed=7,
    verbose=-1,
)
N_TREES = 200


def fit_quantile(X: pd.DataFrame, y: pd.Series, alpha: float) -> lgb.Booster:
    """Quantile regression: alpha=0.5 is the median forecast, 0.1/0.9 the range."""
    params = {**LGB_PARAMS, "objective": "quantile", "alpha": alpha}
    return lgb.train(params, lgb.Dataset(X, y), num_boost_round=N_TREES)


def walk_forward(data: pd.DataFrame, h: int) -> pd.DataFrame:
    """Out-of-sample predictions for horizon h, one row per (symbol, test date)."""
    target = f"target_{h}"
    rows = data.dropna(subset=[target])
    dates = np.sort(rows["date"].unique())
    out = []

    for start in range(MIN_TRAIN_DAYS, len(dates), RETRAIN_EVERY):
        test_dates = dates[start : start + RETRAIN_EVERY]
        # Embargo: a training row's target looks h days ahead, so drop the last
        # h training days. Otherwise their targets would overlap the test period.
        train_end = dates[start - 1 - h]
        train = rows[rows["date"] <= train_end]
        test = rows[rows["date"].isin(test_dates)]

        X, y = train[FEATURES], train[target]
        mid = fit_quantile(X, y, 0.5)
        lo = fit_quantile(X, y, QUANTILES[0])
        hi = fit_quantile(X, y, QUANTILES[1])

        out.append(pd.DataFrame({
            "date": test["date"].values,
            "symbol": test["symbol"].values,
            "actual": test[target].values,
            "pred": mid.predict(test[FEATURES]),
            "low": lo.predict(test[FEATURES]),
            "high": hi.predict(test[FEATURES]),
            # "Always up" baseline: the average return seen in training so far.
            "baseline_up": y.mean(),
            "fold": len(out),
        }))
    return pd.concat(out, ignore_index=True)


def direction_acc(pred: np.ndarray, actual: np.ndarray) -> float:
    moved = actual != 0
    return float((np.sign(pred[moved]) == np.sign(actual[moved])).mean())


def block_bootstrap_ci(bt: pd.DataFrame, block: int = 20, reps: int = 500, seed: int = 0) -> tuple[float, float]:
    """95% interval for (model accuracy - always-up accuracy).

    Resamples whole blocks of consecutive dates, because returns of different
    stocks on the same day move together, and 5-day targets overlap. Treating
    every row as independent would make the interval far too narrow.
    """
    rng = np.random.default_rng(seed)
    bt = bt[bt["actual"] != 0]
    model_hit = (np.sign(bt["pred"]) == np.sign(bt["actual"])).to_numpy()
    up_hit = (bt["actual"] > 0).to_numpy()
    codes, dates = pd.factorize(bt["date"], sort=True)
    n_dates = len(dates)

    # Per-date sums so each resample is cheap.
    diff_sum = np.bincount(codes, weights=model_hit.astype(float) - up_hit, minlength=n_dates)
    count = np.bincount(codes, minlength=n_dates)

    stats = []
    n_blocks = int(np.ceil(n_dates / block))
    for _ in range(reps):
        starts = rng.integers(0, n_dates - block + 1, n_blocks)
        idx = (starts[:, None] + np.arange(block)).ravel()[:n_dates]
        stats.append(diff_sum[idx].sum() / count[idx].sum())
    lo, hi = np.percentile(stats, [2.5, 97.5])
    return float(lo), float(hi)


def summarise(bt: pd.DataFrame) -> dict:
    a, p = bt["actual"].to_numpy(), bt["pred"].to_numpy()
    ci = block_bootstrap_ci(bt)
    return {
        "model": {"directionAcc": direction_acc(p, a), "mae": float(np.abs(p - a).mean())},
        "baselines": {
            "noChange": {"mae": float(np.abs(a).mean())},
            "alwaysUp": {
                "directionAcc": float((a[a != 0] > 0).mean()),
                "mae": float(np.abs(bt["baseline_up"].to_numpy() - a).mean()),
            },
        },
        "intervalCoverage": float(((a >= bt["low"]) & (a <= bt["high"])).mean()),
        "edgeVsAlwaysUpCI95": ci,
        "n": int(len(bt)),
    }


def forecast_today(data: pd.DataFrame) -> list[dict]:
    """Retrain on all labelled history and predict from each stock's latest row."""
    latest = data[data["date"] == data["date"].max()]
    per_symbol = {s: {"symbol": s, "asOf": str(latest.loc[latest.symbol == s, "date"].iloc[0].date()),
                      "lastClose": float(latest.loc[latest.symbol == s, "close"].iloc[0]), "horizons": {}}
                  for s in latest["symbol"]}

    for h in HORIZONS:
        train = data.dropna(subset=[f"target_{h}"])
        X, y = train[FEATURES], train[f"target_{h}"]
        models = {k: fit_quantile(X, y, a) for k, a in (("predReturn", 0.5), ("low", QUANTILES[0]), ("high", QUANTILES[1]))}
        for k, m in models.items():
            for sym, val in zip(latest["symbol"], m.predict(latest[FEATURES])):
                per_symbol[sym]["horizons"].setdefault(str(h), {})[k] = round(float(val), 6)

    # Guard against crossed quantiles (independent models can occasionally cross).
    for f in per_symbol.values():
        for hz in f["horizons"].values():
            lo, mid, hi = sorted([hz["low"], hz["predReturn"], hz["high"]])
            hz.update(low=lo, high=hi, predReturn=mid)
    return [per_symbol[s] for s in SYMBOLS if s in per_symbol]


def synthetic_prices(seed: int = 42) -> pd.DataFrame:
    """Random walks with a shared market factor and fat tails: realistic-looking, but unpredictable by design."""
    rng = np.random.default_rng(seed)
    dates = pd.bdate_range(HISTORY_START, datetime.now().date())
    market = rng.standard_t(4, len(dates)) * 0.008
    rows = []
    for s in SYMBOLS:
        beta, vol = rng.uniform(0.7, 1.4), rng.uniform(0.008, 0.02)
        r = 0.0003 + beta * market + rng.standard_t(4, len(dates)) * vol / np.sqrt(2)
        close = 100 * np.exp(np.cumsum(r))
        spread = np.abs(rng.normal(0, vol, len(dates))) * close
        rows.append(pd.DataFrame({
            "date": dates.strftime("%Y-%m-%d"), "symbol": s, "open": close, "high": close + spread,
            "low": close - spread, "close": close, "volume": rng.lognormal(16, 0.4, len(dates)),
        }))
    return pd.concat(rows, ignore_index=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--synthetic", action="store_true", help="use random-walk prices (leakage check)")
    args = parser.parse_args()

    prices = synthetic_prices() if args.synthetic else pd.read_csv(PRICES_CSV)
    data = build(prices)
    print(f"{len(data):,} rows, {data.symbol.nunique()} symbols, {data.date.min().date()} to {data.date.max().date()}")

    backtest = {}
    first_test, last_test, folds = None, None, 0
    for h in HORIZONS:
        bt = walk_forward(data, h)
        backtest[str(h)] = summarise(bt)
        first_test, last_test, folds = bt["date"].min(), bt["date"].max(), bt["fold"].nunique()
        s = backtest[str(h)]
        print(f"\n{h}-day horizon ({s['n']:,} predictions, {folds} folds)")
        print(f"  direction  model {s['model']['directionAcc']:.2%}  always-up {s['baselines']['alwaysUp']['directionAcc']:.2%}"
              f"  edge 95% CI [{s['edgeVsAlwaysUpCI95'][0]:+.2%}, {s['edgeVsAlwaysUpCI95'][1]:+.2%}]")
        print(f"  MAE        model {s['model']['mae']:.5f}  no-change {s['baselines']['noChange']['mae']:.5f}"
              f"  always-up {s['baselines']['alwaysUp']['mae']:.5f}")
        print(f"  10-90% range covered {s['intervalCoverage']:.1%} of outcomes (target 80%)")

    result = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "dataThrough": str(data["date"].max().date()),
        "sample": bool(args.synthetic),
        "model": {
            "name": "LightGBM quantile regression (pooled across stocks)",
            "features": FEATURES,
            "notes": f"Walk-forward: first {MIN_TRAIN_DAYS} trading days for training, retrained every "
                     f"{RETRAIN_EVERY} days, with an h-day embargo between training and test data.",
        },
        "backtest": {"start": str(first_test.date()), "end": str(last_test.date()), "folds": int(folds), "horizons": backtest},
        "forecasts": forecast_today(data),
    }

    RESULTS_DIR.mkdir(exist_ok=True)
    name = "backtest_synthetic.json" if args.synthetic else "backtest.json"
    (RESULTS_DIR / name).write_text(json.dumps({k: result[k] for k in ("generatedAt", "dataThrough", "model", "backtest")}, indent=2))
    APP_FORECASTS.parent.mkdir(parents=True, exist_ok=True)
    APP_FORECASTS.write_text(json.dumps(result, indent=2))
    print(f"\nWrote {APP_FORECASTS} and {RESULTS_DIR / name}")


if __name__ == "__main__":
    main()
