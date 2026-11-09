"""Shared settings for the forecasting pipeline."""

from pathlib import Path

# Keep in sync with src/lib/market/universe.ts
SYMBOLS = [
    "AAPL", "MSFT", "NVDA", "GOOGL", "META", "AMZN", "TSLA", "NFLX", "DIS", "NKE",
    "KO", "WMT", "JPM", "V", "JNJ", "UNH", "XOM", "CAT", "SPY", "QQQ",
]
MARKET = "SPY"  # used for "what did the whole market do" features

HISTORY_START = "2016-01-01"  # Alpaca's free plan has daily history from 2016

HORIZONS = [1, 5]  # trading days ahead
QUANTILES = (0.1, 0.9)  # the uncertainty range shown in the app

# Walk-forward backtest
MIN_TRAIN_DAYS = 756  # ~3 years of trading days before the first test
RETRAIN_EVERY = 63  # ~one quarter: retrain, then predict the next quarter

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
PRICES_CSV = DATA_DIR / "prices.csv"
RESULTS_DIR = ROOT / "results"
APP_FORECASTS = ROOT.parent / "public" / "forecasts" / "latest.json"
