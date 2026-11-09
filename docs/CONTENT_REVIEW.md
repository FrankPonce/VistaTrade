# Content to review before publishing

Lesson content lives in `src/lib/learn/lessons.ts`. These claims are worth checking.
Items marked **(flagged in code)** also appear in each lesson's `review` field.

## Lessons

1. **What is a stock?**
   - "Regular US trading hours are 9:30 a.m. to 4:00 p.m. Eastern Time on weekdays, excluding market holidays." Correct for NYSE/Nasdaq regular sessions (early closes exist on some days).
   - "SPY tracks the S&P 500: about 500 large US companies." The index has ~503 constituents because some companies have two share classes.
2. **How prices move**
   - **(flagged in code)** "On most days, a large company's stock moves by about 1-2%." Typical, not a precise statistic.
3. **Market vs. limit orders**
   - Marketable limit orders filling at the better market price: true at real brokers, and it's how the engine behaves.
4. **Diversification**: no specific numbers, nothing flagged.
5. **Risk and position sizing**
   - **(flagged in code)** "Never risk more than 1-2% per trade" is presented as a rule of thumb, not a standard.
   - Task threshold (no position over 40%) is our own choice, not an industry rule.
6. **Reading a price chart**
   - **(flagged in code)** "Evidence that chart patterns reliably predict prices is weak": the mainstream academic view; some studies disagree.
7. **Common beginner mistakes**
   - **(flagged in code)** US long-term capital gains apply to assets held "more than a year". Correct for US federal tax; kept general and points readers to a professional.
8. **What can a model predict?**
   - "Stocks rise on slightly more days than they fall": historically true for broad US indexes (roughly 52-54% of days up). Check against the real backtest's "always up" figure once it exists.

## App behaviour worth knowing (not lesson claims)

- Market hours ignore holidays (`src/lib/marketHours.ts`), so on a market holiday the badge says "open".
- "Today" P&L uses each stock's previous close from the data provider; for shares bought today it uses the fill price.
- In simulated mode, the key stats and news (from Finnhub) are real but prices are simulated, so things like the 52-week range won't match the chart.
