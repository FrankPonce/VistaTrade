// The VistaTrade course: eight short lessons from zero.
// Each has a quiz and most have a "try it" task that checks the paper account.
// `review` lists claims the author should double-check (shown in REVIEW.md, not to users).

import type { Lesson } from './types';

export const LESSONS: Lesson[] = [
  {
    slug: 'what-is-a-stock',
    title: 'What is a stock?',
    minutes: 4,
    summary: 'Owning a tiny slice of a company, and why companies sell those slices.',
    body: `A **stock** (or **share**) is a small piece of ownership in a company. If a company is split into 1,000,000 shares and you own 1,000, you own 0.1% of it.

### Why companies sell shares
Selling shares lets a company raise money without borrowing it. The first time a company sells shares to the public is its **initial public offering (IPO)**. After that, most trading is between investors: when you buy Apple stock, you're almost always buying from another investor, not from Apple.

### What you get as an owner
- A claim on part of the company's future profits. Some companies pay part of their profits out as **dividends**; others reinvest everything.
- Usually a vote on some company decisions (for example, electing the board).
- The chance the share price rises, and the risk that it falls, possibly to zero if the company fails.

### Where stocks trade
Stocks trade on **exchanges** such as the New York Stock Exchange (NYSE) and Nasdaq. Each stock has a short **ticker symbol**: AAPL is Apple, NVDA is NVIDIA. Regular US trading hours are 9:30 a.m. to 4:00 p.m. Eastern Time on weekdays, excluding market holidays.

### Funds: owning many stocks at once
An **index fund** or **ETF** holds a basket of stocks. SPY, for example, tracks the S&P 500: about 500 large US companies. Buying one share of SPY spreads your money across all of them.`,
    keyTerms: [
      { term: 'Share', definition: 'One unit of ownership in a company.' },
      { term: 'Ticker', definition: 'The short code a stock trades under, like AAPL.' },
      { term: 'Dividend', definition: 'A cash payment some companies make to shareholders out of profits.' },
      { term: 'ETF', definition: 'Exchange-traded fund: a basket of investments that trades like a single stock.' },
    ],
    quiz: [
      {
        question: 'You buy 10 shares of a company on the stock market. Who usually sells them to you?',
        options: ['The company itself', 'Another investor', 'The government', 'The exchange'],
        answer: 1,
        explanation: 'After the IPO, almost all trading happens between investors. The exchange just matches buyers and sellers.',
      },
      {
        question: 'What is the most you can lose when you buy a stock (without borrowing)?',
        options: ['Nothing, stocks always recover', 'Half of what you paid', 'Everything you paid', 'More than you paid'],
        answer: 2,
        explanation: 'If the company fails, the shares can become worthless. Without borrowing or other complex products, your loss is capped at what you put in.',
      },
      {
        question: 'Why might someone buy SPY instead of a single company?',
        options: ['It never goes down', 'It spreads money across about 500 companies', 'It pays guaranteed interest', 'It is not traded on an exchange'],
        answer: 1,
        explanation: 'SPY tracks the S&P 500, so one share gives exposure to hundreds of companies. It can still go down.',
      },
    ],
    task: {
      title: 'Build your watchlist',
      description: 'Add a stock you\'re curious about to your watchlist. Search for it from the Markets page.',
      href: '/markets',
      cta: 'Open Markets',
      isDone: ({ flags }) => Boolean(flags.watchlistEdited),
    },
  },

  {
    slug: 'how-prices-move',
    title: 'How prices move',
    minutes: 5,
    summary: 'Buyers, sellers, expectations, and why a "cheap" share price means nothing on its own.',
    body: `A stock's price is simply the last price at which a buyer and a seller agreed to trade. If more people want to buy than sell at the current price, buyers have to offer more and the price rises. If sellers outnumber buyers, it falls.

### Bid, ask and spread
At any moment there's a highest price someone is willing to pay (the **bid**) and a lowest price someone is willing to sell at (the **ask**). The gap between them is the **spread**. For big, popular stocks it's often a cent or two; for small, rarely traded ones it can be much wider.

### What changes people's minds
Prices move when expectations change: earnings reports, new products, interest rates, the economy, a lawsuit, a big investor selling. Importantly, the price reacts to **news versus expectations**. A company can report record profits and still fall, if investors expected even more.

### Price vs. value
A $20 share isn't "cheaper" than a $500 share. What matters is what you get for the money. **Market capitalisation** (share price × number of shares) tells you what the whole company is valued at. A $20 stock with 10 billion shares (a $200B company) is bigger than a $500 stock with 100 million shares (a $50B company).

### Day-to-day moves are noisy
On most days, a large company's stock moves by about 1-2%, mostly for reasons nobody can predict in advance. Over the short term, price changes look a lot like a random walk. Keep that in mind when you get to the forecasting lesson.`,
    keyTerms: [
      { term: 'Bid / Ask', definition: 'The best price buyers are offering / the best price sellers will accept.' },
      { term: 'Spread', definition: 'The gap between the bid and the ask.' },
      { term: 'Market cap', definition: 'Share price × total shares: the market\'s valuation of the whole company.' },
    ],
    quiz: [
      {
        question: 'Stock A costs $20 a share, Stock B costs $500. Which company is bigger?',
        options: ['Stock A', 'Stock B', 'You can\'t tell from the share price alone', 'They are the same size'],
        answer: 2,
        explanation: 'Company size is market cap: price × number of shares. Share price alone tells you nothing about size or value.',
      },
      {
        question: 'A company announces record profits and its stock falls 5%. What is the most likely reason?',
        options: ['The data is wrong', 'Investors expected even better results', 'Exchanges punish profitable companies', 'Profits don\'t affect prices'],
        answer: 1,
        explanation: 'Prices already reflect expectations. Results that are good but below expectations can still push a price down.',
      },
      {
        question: 'The bid is $99.98 and the ask is $100.02. What is the spread?',
        options: ['$0.02', '$0.04', '$100.00', '$0.40'],
        answer: 1,
        explanation: '$100.02 − $99.98 = $0.04.',
      },
    ],
    task: {
      title: 'Make your first trade',
      description: 'Buy at least one share of any stock with a market order. Watch how the position\'s value moves with the price.',
      href: '/markets',
      cta: 'Pick a stock',
      isDone: ({ account }) => account.orders.some((o) => o.status === 'filled' && o.side === 'buy'),
    },
    review: ['"About 1-2% daily moves for large companies" is a typical range, not a precise statistic.'],
  },

  {
    slug: 'order-types',
    title: 'Market vs. limit orders',
    minutes: 5,
    summary: 'Choosing between "fill it now" and "fill it at my price".',
    body: `When you place an order you're choosing between **certainty of execution** and **certainty of price**. You can't fully have both.

### Market order
A market order says "buy (or sell) now, at the best price available." It almost always fills right away, but you don't control the exact price. In a fast-moving or thinly traded stock, you can get a worse price than you saw on screen. That difference is called **slippage**.

### Limit order
A limit order says "buy at this price **or lower**" (or "sell at this price **or higher**"). You control the worst price you'll accept, but the order only fills if the market reaches your price. It may never fill.

- A **buy limit** below the current price waits for the price to drop.
- A **sell limit** above the current price waits for the price to rise.
- If your limit is already better than the market (for example, a buy limit above the current price), it fills right away at the market price.

### Other order types you'll hear about
A **stop order** (or stop-loss) becomes a market order once the price hits a trigger level, often used to limit losses. VistaTrade doesn't offer stops yet, but it's worth knowing they exist and that they can fill well below the trigger in a sudden drop.

### How VistaTrade simplifies this
Our fills use the last traded price with no spread, slippage or fees. Real trading has all three, so real results will be a little worse than paper results.`,
    keyTerms: [
      { term: 'Market order', definition: 'Fill immediately at the best available price.' },
      { term: 'Limit order', definition: 'Fill only at your price or better.' },
      { term: 'Slippage', definition: 'The difference between the price you expected and the price you got.' },
    ],
    quiz: [
      {
        question: 'A stock trades at $50. You place a buy limit at $45. What happens?',
        options: ['It buys immediately at $50', 'It buys immediately at $45', 'It waits until the price is $45 or lower', 'It is rejected'],
        answer: 2,
        explanation: 'A buy limit fills only at your price or better, so it waits for the price to drop to $45.',
      },
      {
        question: 'What is the main risk of a market order?',
        options: ['It might never fill', 'You might get a worse price than expected', 'It costs more in fees', 'It can only be used for selling'],
        answer: 1,
        explanation: 'Market orders prioritise speed over price, so the fill price can differ from the last quote.',
      },
      {
        question: 'What is the main risk of a limit order?',
        options: ['It might never fill', 'It always fills at a bad price', 'It can\'t be cancelled', 'It ignores your price'],
        answer: 0,
        explanation: 'If the market never reaches your limit price, the order just sits there unfilled.',
      },
    ],
    task: {
      title: 'Place a limit order',
      description: 'Place a buy limit a few percent below a stock\'s current price. You can cancel it from your Portfolio page.',
      href: '/markets',
      cta: 'Place a limit order',
      isDone: ({ account }) => account.orders.some((o) => o.type === 'limit'),
    },
  },

  {
    slug: 'diversification',
    title: 'Diversification',
    minutes: 5,
    summary: 'Why spreading your money out reduces risk, and where it stops helping.',
    body: `Diversification means not putting all your money on one outcome. Individual companies can fall hard for reasons specific to them: a failed product, fraud, a lost lawsuit. Owning many different companies means one disaster hurts less.

### Correlation matters
Diversifying only works if your holdings don't all move together. Owning five chip-makers is less diversified than it looks: they tend to rise and fall together. Spreading across **sectors** (technology, health care, energy, consumer staples, financials...) usually helps more than adding more of the same kind of company.

### What diversification can't remove
Some risk hits almost everything at once: recessions, interest-rate shocks, market crashes. This **market risk** can't be diversified away within stocks. In a broad sell-off, most stocks fall together.

### The easy version
Index funds and ETFs give instant diversification. A single S&P 500 fund holds about 500 companies across every sector. That's why many long-term investors use them as the core of their portfolio.`,
    keyTerms: [
      { term: 'Diversification', definition: 'Spreading money across holdings so no single one can sink you.' },
      { term: 'Correlation', definition: 'How much two investments tend to move together.' },
      { term: 'Sector', definition: 'A group of companies in the same kind of business.' },
    ],
    quiz: [
      {
        question: 'Which portfolio is most diversified?',
        options: ['5 semiconductor companies', '5 companies in 5 different sectors', '1 large technology company', '5 airlines'],
        answer: 1,
        explanation: 'Companies in different sectors tend to be less correlated, so their bad days are less likely to line up.',
      },
      {
        question: 'Which risk can diversification across stocks NOT remove?',
        options: ['One company committing fraud', 'One product launch failing', 'A broad market crash', 'One CEO quitting'],
        answer: 2,
        explanation: 'Company-specific risk can be diversified away; market-wide risk hits nearly every stock at once.',
      },
    ],
    task: {
      title: 'Spread across sectors',
      description: 'Hold stocks from at least 3 different sectors at the same time.',
      href: '/markets',
      cta: 'Browse sectors',
      isDone: ({ account, sectorOf }) => {
        const sectors = new Set(Object.keys(account.positions).map((s) => sectorOf(s) ?? s));
        return sectors.size >= 3;
      },
    },
  },

  {
    slug: 'risk-and-position-sizing',
    title: 'Risk and position sizing',
    minutes: 6,
    summary: 'How much to put in one idea, and why losses hurt more than gains help.',
    body: `Good investors spend as much time thinking about **how much** to buy as **what** to buy.

### Losses are lopsided
If a stock falls 50%, it needs to rise **100%** just to get back to where it started. A 20% loss needs a 25% gain to recover. Big losses are hard to come back from, which is why limiting them matters.

### Position sizing
A **position** is how much you hold of one investment. A simple approach is to cap any single position at a fixed share of your portfolio. Some traders also use a rule of thumb like "never risk more than 1-2% of the account on a single trade", where risk means how much you'd lose if your exit plan (for example, a stop-loss) triggers.

Example: with a $10,000 account and a 1% risk rule, you're willing to lose $100 on a trade. If you plan to exit if the stock drops $5 from your entry, you'd buy at most 20 shares ($100 ÷ $5).

### Volatility
**Volatility** measures how much a price typically swings. A volatile stock can make or lose a lot quickly, so the same dollar position carries more risk. Many people hold smaller positions in more volatile stocks.

### Concentration
If one stock is 60% of your portfolio, your results depend mostly on that one company. That can work out spectacularly or terribly. Keeping positions smaller makes outcomes less extreme.`,
    keyTerms: [
      { term: 'Position', definition: 'The amount you hold of one investment.' },
      { term: 'Volatility', definition: 'How much a price tends to swing up and down.' },
      { term: 'Drawdown', definition: 'The drop from a peak value to a later low.' },
    ],
    quiz: [
      {
        question: 'A stock falls 50%. How much does it need to rise to get back to its original price?',
        options: ['50%', '75%', '100%', '150%'],
        answer: 2,
        explanation: '$100 → $50 is −50%. Getting from $50 back to $100 is +100%.',
      },
      {
        question: 'Account: $10,000. You risk 1% per trade, and your exit is $4 below your entry. How many shares at most?',
        options: ['4', '25', '100', '250'],
        answer: 1,
        explanation: '1% of $10,000 is $100. $100 ÷ $4 per share = 25 shares.',
      },
      {
        question: 'Why might you hold a smaller position in a very volatile stock?',
        options: ['Volatile stocks pay more dividends', 'The same dollar amount can swing much more', 'Volatile stocks can\'t be sold', 'Exchanges require it'],
        answer: 1,
        explanation: 'Higher volatility means bigger swings per dollar invested, so a smaller position keeps the risk similar.',
      },
    ],
    task: {
      title: 'Size your positions',
      description: 'Hold at least 2 stocks, with no single stock worth more than 40% of your total portfolio.',
      href: '/portfolio',
      cta: 'Check your portfolio',
      isDone: ({ weights }) => {
        const w = Object.values(weights);
        return w.length >= 2 && Math.max(...w) <= 0.4;
      },
    },
    review: ['The "1-2% risk per trade" guideline is a common trading rule of thumb, not a universal standard. Worded as such.'],
  },

  {
    slug: 'reading-charts',
    title: 'Reading a price chart',
    minutes: 5,
    summary: 'Time ranges, volume, trends, and what a chart can\'t tell you.',
    body: `A price chart shows what a stock did in the past. It's a record, not a prediction.

### Time ranges change the story
The same stock can look like it's soaring on a 1-day chart and slumping on a 1-year chart. Always check the range before drawing conclusions. Switch between 1D, 1W, 1M and 1Y on any stock page in VistaTrade to see this.

### Line charts and candlesticks
A **line chart** connects closing prices. A **candlestick** shows four prices for each period: open, high, low and close. The body spans open to close; the thin "wicks" show the high and low. Candles are usually coloured by whether the period closed up or down.

### Volume
**Volume** is how many shares traded. A big price move on heavy volume suggests many participants agreed with it; the same move on light volume is easier to reverse.

### Trends and patterns, with caution
People look for **trends** (a series of higher highs and higher lows), and for **support** and **resistance** (levels where the price has repeatedly stopped falling or rising). These are useful ways to describe the past. Evidence that chart patterns reliably predict future prices is weak, so treat them as context, not signals.

### Percentage, not dollars
Compare moves in percent. A $5 move is huge for a $20 stock (25%) and small for a $500 stock (1%).`,
    keyTerms: [
      { term: 'Candlestick', definition: 'A bar showing open, high, low and close for one period.' },
      { term: 'Volume', definition: 'Number of shares traded in a period.' },
      { term: 'Support / Resistance', definition: 'Price levels where a fall or rise has stalled before.' },
    ],
    quiz: [
      {
        question: 'A $20 stock and a $500 stock both rise $5. Which had the bigger move?',
        options: ['The $20 stock (+25%)', 'The $500 stock', 'They moved equally', 'Can\'t be compared'],
        answer: 0,
        explanation: '$5 is 25% of $20 but only 1% of $500. Always compare in percent.',
      },
      {
        question: 'What does a candlestick\'s wick show?',
        options: ['The trading volume', 'The high and low of the period', 'The dividend', 'The analyst forecast'],
        answer: 1,
        explanation: 'The body spans open to close; the wicks extend to the period\'s high and low.',
      },
      {
        question: 'A stock has risen five days in a row. What does that tell you about tomorrow?',
        options: ['It will rise again', 'It will fall', 'Very little on its own', 'The market is closed'],
        answer: 2,
        explanation: 'Short-term moves are mostly unpredictable. Past streaks aren\'t reliable signals.',
      },
    ],
    task: {
      title: 'Compare time ranges',
      description: 'Open any stock and switch its chart to the 1Y range.',
      href: '/stocks/SPY',
      cta: 'Open SPY',
      isDone: ({ flags }) => Boolean(flags.viewed1Y),
    },
    review: ['"Evidence that chart patterns reliably predict prices is weak" reflects the mainstream academic view; some studies find small effects.'],
  },

  {
    slug: 'common-mistakes',
    title: 'Common beginner mistakes',
    minutes: 5,
    summary: 'The traps almost everyone falls into, and how to dodge them.',
    body: `Most beginner losses come from behaviour, not bad luck. Some classics:

- **Chasing (FOMO).** Buying something because it already went up a lot and everyone's talking about it. By the time it's on social media, the easy gains are usually gone.
- **Panic selling.** Selling after a sharp drop, locking in the loss, then missing the recovery.
- **Overtrading.** Trading constantly. In real accounts, every trade can cost spreads, fees and taxes, and frequent trading tends to hurt returns.
- **No plan.** Buying without deciding in advance why you own it, how much to own, and what would make you sell.
- **Averaging down blindly.** Buying more of a falling stock just to lower your average cost, without asking whether the reason you bought still holds.
- **Over-concentration.** Betting most of your money on one or two stocks.
- **Mistaking luck for skill.** A few winning trades in a rising market prove very little.

### Paper trading vs. real money
Paper trading is great for learning the mechanics, but it doesn't feel the same as risking real money. Fear and greed are much stronger when the money is real. If you ever invest for real, start small.

### Taxes (US)
Selling at a profit can trigger tax. In the US, gains on investments held more than a year are generally taxed at lower long-term rates than short-term gains. Rules vary by country and situation, so check with a qualified professional.`,
    keyTerms: [
      { term: 'FOMO', definition: 'Fear of missing out: buying because others already profited.' },
      { term: 'Averaging down', definition: 'Buying more of a falling stock to lower your average cost.' },
    ],
    quiz: [
      {
        question: 'A stock jumped 80% this month and it\'s all over social media. What is the classic mistake?',
        options: ['Researching the company', 'Buying in a rush because of the hype', 'Ignoring it', 'Adding it to a watchlist'],
        answer: 1,
        explanation: 'That\'s chasing. Hype often peaks after most of the move has already happened.',
      },
      {
        question: 'Why does overtrading tend to hurt real-world returns?',
        options: ['Exchanges limit trades', 'Costs like spreads, fees and taxes add up', 'Prices go down when you trade', 'It doesn\'t'],
        answer: 1,
        explanation: 'Each trade has friction. Many small costs add up over time.',
      },
    ],
    task: {
      title: 'Write down an exit plan',
      description: 'Sell some shares of a position, even a few. Practise taking profit or cutting a loss on purpose instead of on impulse.',
      href: '/portfolio',
      cta: 'Go to portfolio',
      isDone: ({ account }) => account.orders.some((o) => o.status === 'filled' && o.side === 'sell'),
    },
    review: ['US tax note: "more than a year" for long-term capital gains is correct for US federal tax; kept deliberately general.'],
  },

  {
    slug: 'what-models-can-know',
    title: 'What can a model predict?',
    minutes: 6,
    summary: 'Forecasts, baselines, and why "barely better than guessing" is the honest answer.',
    body: `It's tempting to think a clever enough algorithm could predict tomorrow's stock price. In practice, short-term prices are extremely hard to forecast.

### Why it's hard
Prices already reflect what investors know and expect. Any easy, reliable pattern tends to get traded away by people trying to profit from it. What's left behaves a lot like noise. This idea is related to the **efficient market hypothesis**; people debate how efficient markets really are, but very few believe short-term prediction is easy.

### Always compare to a baseline
A forecast is only useful if it beats a simple **baseline**. Two common ones:
- **"Tomorrow = today"**: predict no change. For daily returns this is surprisingly hard to beat.
- **"Always up"**: stocks rise on slightly more days than they fall, so guessing "up" every day is right a little over half the time.

A model that's right 52% of the time sounds bad, but if the baseline is 53%, it's actually worse than guessing.

### Traps that make models look better than they are
- **Look-ahead bias**: accidentally using information that wasn't available yet (like tomorrow's volume) when making a prediction.
- **Overfitting**: a model that memorises the past instead of learning something that generalises.
- **Testing on training data**: a model always looks great on data it has already seen. Honest testing uses only data from *after* the training period (**walk-forward testing**).

### How to read VistaTrade's forecasts
The Forecasts page shows each prediction with an **uncertainty range** and right next to the baselines, along with how both did in backtesting. Expect the model to be close to the baseline. That's not a bug: it's the lesson.`,
    keyTerms: [
      { term: 'Baseline', definition: 'A simple rule a model must beat to be worth anything.' },
      { term: 'Overfitting', definition: 'Learning noise in past data that doesn\'t repeat.' },
      { term: 'Walk-forward test', definition: 'Training on the past and testing on the following period, repeatedly.' },
    ],
    quiz: [
      {
        question: 'A model predicts daily direction correctly 52% of the time. "Always up" is right 53% of the time. Is the model useful?',
        options: ['Yes, 52% is above 50%', 'No, it\'s worse than a trivial baseline', 'Yes, any model beats guessing', 'Can\'t say without the code'],
        answer: 1,
        explanation: 'What matters is beating the baseline, not 50%. Here the trivial rule wins.',
      },
      {
        question: 'Which of these is look-ahead bias?',
        options: ['Using yesterday\'s close to predict today', 'Using tomorrow\'s volume to predict tomorrow\'s price', 'Testing on later data', 'Comparing to a baseline'],
        answer: 1,
        explanation: 'Tomorrow\'s volume isn\'t known when you\'d make the prediction, so using it leaks the future.',
      },
      {
        question: 'Why should a model be tested on data from after its training period?',
        options: ['It\'s faster', 'Models always look good on data they\'ve seen', 'Older data is wrong', 'Regulators require it'],
        answer: 1,
        explanation: 'Testing on unseen, later data is the closest thing to how the model would be used for real.',
      },
    ],
    task: {
      title: 'Read the forecasts',
      description: 'Open the Forecasts page and compare the model to its baselines.',
      href: '/forecasts',
      cta: 'Open Forecasts',
      isDone: ({ flags }) => Boolean(flags.viewedForecasts),
    },
  },
];

export function getLesson(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}

/** Lesson of the day: the first unfinished lesson, else rotate by date. */
export function lessonOfTheDay(completed: Record<string, string>, date = new Date()): Lesson {
  const next = LESSONS.find((l) => !completed[l.slug]);
  if (next) return next;
  const dayNumber = Math.floor(date.getTime() / 86_400_000);
  return LESSONS[dayNumber % LESSONS.length];
}
