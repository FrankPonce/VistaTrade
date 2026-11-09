"""Turn daily prices into model features and targets.

The one rule that matters: every feature for day t uses only data known at
the close of day t. Targets are returns from the close of t to the close of
t + h. Anything else would be look-ahead leakage.
"""

import numpy as np
import pandas as pd

from config import HORIZONS, MARKET

FEATURES = [
    "ret_1", "ret_2", "ret_5", "ret_10", "ret_20",  # past log returns
    "vol_5", "vol_20",  # recent volatility
    "volume_ratio",  # today's volume vs 20-day average
    "rsi_14",  # relative strength index
    "dist_ma_20", "dist_ma_50",  # distance from moving averages
    "range_pct",  # today's high-low range relative to close
    "mkt_ret_1", "mkt_ret_5", "mkt_vol_20",  # what the whole market did
    "day_of_week",
]


def _rsi(close: pd.Series, window: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(window).mean()
    loss = (-delta.clip(upper=0)).rolling(window).mean()
    rs = gain / loss.replace(0, np.nan)
    return 100 - 100 / (1 + rs)


def _per_symbol(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values("date").copy()
    logp = np.log(df["close"])
    r1 = logp.diff()

    for n in (1, 2, 5, 10, 20):
        df[f"ret_{n}"] = logp - logp.shift(n)
    df["vol_5"] = r1.rolling(5).std()
    df["vol_20"] = r1.rolling(20).std()
    df["volume_ratio"] = df["volume"] / df["volume"].rolling(20).mean()
    df["rsi_14"] = _rsi(df["close"])
    df["dist_ma_20"] = df["close"] / df["close"].rolling(20).mean() - 1
    df["dist_ma_50"] = df["close"] / df["close"].rolling(50).mean() - 1
    df["range_pct"] = (df["high"] - df["low"]) / df["close"]

    # Targets: FUTURE log returns. shift(-h) looks forward, so these are the
    # only columns that use data after day t, and they are never features.
    for h in HORIZONS:
        df[f"target_{h}"] = logp.shift(-h) - logp
    return df


def build(prices: pd.DataFrame) -> pd.DataFrame:
    """Return one row per (symbol, date) with FEATURES and target_{h} columns."""
    prices = prices.copy()
    prices["date"] = pd.to_datetime(prices["date"])
    frames = [_per_symbol(g) for _, g in prices.groupby("symbol")]
    data = pd.concat(frames, ignore_index=True)

    # Market features come from SPY on the same date (known at that close).
    mkt = data.loc[data["symbol"] == MARKET, ["date", "ret_1", "ret_5", "vol_20"]].rename(
        columns={"ret_1": "mkt_ret_1", "ret_5": "mkt_ret_5", "vol_20": "mkt_vol_20"}
    )
    data = data.merge(mkt, on="date", how="left")
    data["day_of_week"] = data["date"].dt.dayofweek

    # Drop warm-up rows where rolling windows aren't full yet.
    data = data.dropna(subset=FEATURES).sort_values(["date", "symbol"]).reset_index(drop=True)
    return data
