"""Download daily price history from Alpaca's free market data API.

Needs ALPACA_KEY_ID and ALPACA_SECRET_KEY in the environment.
Writes ml/data/prices.csv with columns: date, symbol, open, high, low, close, volume.

Prices are split- and dividend-adjusted (adjustment=all), so returns aren't
distorted by stock splits. The free plan allows full-market (SIP) history as
long as we don't request the latest 15 minutes, which daily bars never touch.
"""

import os
import sys
from datetime import datetime, timedelta, timezone

import pandas as pd
import requests

from config import DATA_DIR, HISTORY_START, PRICES_CSV, SYMBOLS

URL = "https://data.alpaca.markets/v2/stocks/bars"


def fetch_all() -> pd.DataFrame:
    key, secret = os.environ.get("ALPACA_KEY_ID"), os.environ.get("ALPACA_SECRET_KEY")
    if not key or not secret:
        sys.exit("Set ALPACA_KEY_ID and ALPACA_SECRET_KEY first (see .env.example).")

    headers = {"APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": secret}
    end = (datetime.now(timezone.utc) - timedelta(minutes=20)).strftime("%Y-%m-%dT%H:%M:%SZ")
    params = {
        "symbols": ",".join(SYMBOLS),
        "timeframe": "1Day",
        "start": HISTORY_START,
        "end": end,
        "adjustment": "all",
        "feed": "sip",
        "limit": 10000,
    }

    rows = []
    while True:
        res = requests.get(URL, headers=headers, params=params, timeout=30)
        res.raise_for_status()
        body = res.json()
        for symbol, bars in (body.get("bars") or {}).items():
            for b in bars:
                rows.append((b["t"][:10], symbol, b["o"], b["h"], b["l"], b["c"], b["v"]))
        token = body.get("next_page_token")
        if not token:
            break
        params["page_token"] = token

    df = pd.DataFrame(rows, columns=["date", "symbol", "open", "high", "low", "close", "volume"])
    return df.sort_values(["symbol", "date"]).reset_index(drop=True)


if __name__ == "__main__":
    DATA_DIR.mkdir(exist_ok=True)
    prices = fetch_all()
    prices.to_csv(PRICES_CSV, index=False)
    print(f"Saved {len(prices):,} rows for {prices.symbol.nunique()} symbols "
          f"({prices.date.min()} to {prices.date.max()}) to {PRICES_CSV}")
