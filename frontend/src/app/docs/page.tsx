"use client";

/**
 * Documentation Page — comprehensive learning resource for beginners.
 *
 * Explains every aspect of the system in beginner-friendly language.
 * Uses MATLAB analogies where helpful.
 */

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const SECTIONS = [
  {
    id: "overview",
    title: "System Overview",
    content: `
## How This System Works

StockQuant has two main parts that work together:

### 1. Backend (Python) — The "Brain"
This is where all the computation happens. Think of it as your MATLAB workspace.
- **Market Data Module**: Downloads and caches stock price data (like \`webread()\` in MATLAB)
- **Indicator Library**: Computes technical indicators (like custom functions in MATLAB)
- **Strategy Engine**: Defines trading rules and generates buy/sell signals
- **Backtesting Engine**: Simulates trading a strategy on historical data
- **Analytics**: Computes performance metrics (Sharpe ratio, max drawdown, etc.)
- **Paper Trading**: Simulates a real portfolio without real money

### 2. Frontend (Next.js) — The "GUI"
This is the web interface you see in your browser. Think of it as MATLAB's figure windows and GUIs.
- Displays charts and tables
- Provides forms to configure backtests
- Sends requests to the backend to run computations
- Receives results and displays them visually

### How They Communicate
The frontend sends HTTP requests to the backend (like calling a web API).
The backend processes the request and returns JSON data.

**Example flow: Running a backtest**
1. You fill in the form (strategy, symbol, dates) in the browser
2. Frontend sends a POST request to \`/api/backtest/run\` with your settings
3. Backend loads price data from SQLite database
4. Backend runs the strategy to generate signals
5. Backend simulates trading those signals (the backtest)
6. Backend computes performance metrics
7. Backend returns all results as JSON
8. Frontend displays the equity curve, metrics, and trade log
    `,
  },
  {
    id: "project-structure",
    title: "Project Structure",
    content: `
## Project Structure

\`\`\`
stock_quant/
├── backend/                  # Python backend
│   ├── app/                  # FastAPI web application
│   │   ├── main.py          # App entry point — starts the server
│   │   └── routers/         # API endpoint handlers
│   │       ├── market_data.py    # /api/market/* endpoints
│   │       ├── strategies.py     # /api/strategies/* endpoints
│   │       ├── backtest.py       # /api/backtest/* endpoints
│   │       ├── paper_trading.py  # /api/paper/* endpoints
│   │       ├── watchlist.py      # /api/watchlist/* endpoints
│   │       └── leaderboard.py    # /api/leaderboard/* endpoints
│   ├── quant/               # Core quantitative library
│   │   ├── data/
│   │   │   └── provider.py  # Downloads stock data from Yahoo Finance
│   │   ├── indicators/
│   │   │   └── technical.py # SMA, EMA, RSI, MACD, Bollinger Bands, ATR
│   │   ├── strategies/
│   │   │   ├── base.py      # Base class all strategies inherit from
│   │   │   ├── registry.py  # Maps strategy names to classes
│   │   │   ├── ma_crossover.py
│   │   │   ├── rsi_reversion.py
│   │   │   ├── bollinger_band.py
│   │   │   ├── momentum.py
│   │   │   └── macd_trend.py
│   │   ├── backtest/
│   │   │   └── engine.py    # The backtesting engine
│   │   ├── analytics/
│   │   │   └── metrics.py   # Performance metric calculations
│   │   ├── paper/
│   │   │   └── executor.py  # Simulated order execution
│   │   └── risk/
│   │       └── manager.py   # Risk management rules
│   ├── database/
│   │   ├── schema.sql       # Database table definitions
│   │   └── connection.py    # Database connection helper
│   ├── scripts/
│   │   └── seed_data.py     # Downloads sample data
│   └── tests/               # Test suite
├── frontend/                # Next.js frontend
│   └── src/
│       ├── app/             # Pages (each folder = one page)
│       ├── components/      # Reusable UI pieces
│       └── lib/
│           └── api.ts       # Functions that call the backend
└── .env.example             # Environment variable template
\`\`\`
    `,
  },
  {
    id: "data-flow",
    title: "Data Flow",
    content: `
## How Data Flows Through the System

### 1. Data Acquisition
\`\`\`
Yahoo Finance API  →  provider.py  →  SQLite Database (price_data table)
\`\`\`
When you refresh data for a symbol, the system:
1. Calls Yahoo Finance via the \`yfinance\` Python library
2. Cleans the data (removes NaN, ensures positive prices)
3. Stores it in the \`price_data\` SQLite table
4. Updates the \`data_metadata\` table with freshness info

### 2. Signal Generation
\`\`\`
Price Data  →  Strategy  →  Signals (buy=1, sell=-1, hold=0)
\`\`\`
Each strategy:
1. Takes a DataFrame with OHLCV columns
2. Computes indicators (e.g., SMA, RSI)
3. Applies rules to generate a \`signal\` column
4. Returns the DataFrame with signals added

### 3. Backtesting
\`\`\`
Signals + Price Data  →  Backtester  →  Equity Curve + Trades + Metrics
\`\`\`
The backtester walks through each day:
1. Checks risk rules (stop loss, position limits)
2. If signal=1: calculates position size and buys
3. If signal=-1: sells all positions
4. Records portfolio equity for that day
5. After all days: computes performance metrics

### 4. Display
\`\`\`
Backend JSON Response  →  Frontend Components  →  Charts & Tables
\`\`\`
The frontend receives JSON from the API and renders it using React components and Recharts.
    `,
  },
  {
    id: "strategies",
    title: "How Strategies Work",
    content: `
## How Trading Strategies Generate Signals

Every strategy follows the same pattern:
1. **Input**: Price data (Open, High, Low, Close, Volume)
2. **Process**: Compute indicators and apply rules
3. **Output**: A signal column where 1=buy, -1=sell, 0=hold

### Moving Average Crossover
**Idea**: When recent prices (fast MA) cross above the long-term average (slow MA), the trend is turning up.
- Buy when fast MA crosses above slow MA
- Sell when fast MA crosses below slow MA
- Works best in trending markets

### RSI Mean Reversion
**Idea**: When RSI drops below 30, the stock is "oversold" and likely to bounce back.
- Buy when RSI drops below the oversold threshold (default: 30)
- Sell when RSI rises above the overbought threshold (default: 70)
- Works best in range-bound markets

### Bollinger Band Reversion
**Idea**: Price rarely stays outside the Bollinger Bands for long.
- Buy when price drops below the lower band
- Sell when price rises above the upper band
- Bands automatically adjust to volatility

### Momentum
**Idea**: Stocks that have been going up tend to keep going up.
- Buy when rate-of-change is positive and above trend
- Sell when momentum turns negative
- Risk: momentum can reverse suddenly

### MACD Trend
**Idea**: MACD combines trend and momentum information.
- Buy when MACD line crosses above signal line
- Sell when MACD crosses below signal line
- Optional histogram filter for stronger signals
    `,
  },
  {
    id: "metrics",
    title: "Performance Metrics Explained",
    content: `
## Performance Metrics

### Return Metrics
- **Total Return**: Overall percentage gain/loss. \`(final - initial) / initial × 100\`
- **Annualized Return**: What the return would be if it continued for a year. Normalizes for different test periods.
- **Annualized Volatility**: Standard deviation of daily returns × √252. Measures risk/uncertainty.

### Risk-Adjusted Metrics
- **Sharpe Ratio**: \`(Return - Risk-Free Rate) / Volatility\`. Higher is better. >1 is good, >2 is excellent.
  Think of it as "return per unit of risk."
- **Sortino Ratio**: Like Sharpe, but only penalizes downside volatility (bad risk). Upside volatility is welcome.
- **Calmar Ratio**: \`Annualized Return / |Max Drawdown|\`. Combines return with worst-case scenario.

### Drawdown
- **Max Drawdown**: The worst peak-to-trough decline. If your portfolio went from $100k to $80k, that's a 20% drawdown.
  This is the "worst pain" metric — how much could you lose at the worst time?

### Trade Metrics
- **Win Rate**: Percentage of profitable trades. 50%+ is generally decent.
- **Profit Factor**: Gross profit / gross loss. >1 means profitable overall. >2 is very good.
- **Average Win/Loss**: Average profit on winning trades vs. average loss on losing trades.

### What Makes a "Good" Strategy?
There's no universal answer, but generally:
- Sharpe > 1.0 is considered decent
- Max Drawdown < 20% is considered moderate risk
- Win Rate > 50% with decent profit factor
- Many trades (more data = more statistical significance)
- Consistent across different time periods
    `,
  },
  {
    id: "backtester",
    title: "How the Backtester Works",
    content: `
## Backtesting Engine Deep Dive

The backtester simulates what would have happened if you traded a strategy historically.

### Step-by-Step Process
\`\`\`python
for each trading day:
    1. Check stop-loss and take-profit on open positions
    2. If signal == 1 (buy):
       - Calculate position size (% of equity)
       - Apply slippage (buy at slightly higher price)
       - Deduct cash (price × shares + commission)
       - Open new position
    3. If signal == -1 (sell):
       - Apply slippage (sell at slightly lower price)
       - Add proceeds to cash
       - Record P&L
       - Close position
    4. Record daily equity = cash + value of open positions
\`\`\`

### Important Assumptions
- **No lookahead bias**: We only use data available up to the current day
- **Slippage**: We assume a small price penalty on each trade (0.05% default)
- **Commission**: A percentage fee per trade (0.1% default)
- **Position sizing**: Each trade uses a fixed % of current equity
- **Execution**: Orders fill at the close price (with slippage)

### MATLAB Equivalent
\`\`\`matlab
for t = 1:length(dates)
    if signal(t) == 1
        shares = floor(equity(t) * posSize / close(t));
        cash = cash - shares * close(t) * (1 + slippage + commission);
    elseif signal(t) == -1
        cash = cash + shares * close(t) * (1 - slippage - commission);
        shares = 0;
    end
    equity(t) = cash + shares * close(t);
end
\`\`\`
    `,
  },
  {
    id: "add-strategy",
    title: "How to Add a New Strategy",
    content: `
## Adding a New Strategy

### Step 1: Create the strategy file
Create \`backend/quant/strategies/my_strategy.py\`:

\`\`\`python
import pandas as pd
from quant.strategies.base import BaseStrategy
from quant.indicators.technical import compute_sma, compute_rsi

class MyStrategy(BaseStrategy):
    name = "my_strategy"
    display_name = "My Custom Strategy"
    description = "Description of what this strategy does"
    category = "trend"  # or "mean_reversion"

    default_params = {
        "period": 20,
        "threshold": 50,
    }

    param_schema = [
        {
            "name": "period",
            "type": "int",
            "min": 5,
            "max": 200,
            "default": 20,
            "description": "Lookback period",
        },
    ]

    def generate_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        result = df.copy()
        period = int(self.params["period"])

        # Compute your indicators
        result["my_indicator"] = compute_sma(result["close"], period)

        # Generate signals
        result["signal"] = 0
        result.loc[YOUR_BUY_CONDITION, "signal"] = 1
        result.loc[YOUR_SELL_CONDITION, "signal"] = -1

        return result
\`\`\`

### Step 2: Register it
Edit \`backend/quant/strategies/registry.py\`:

\`\`\`python
from quant.strategies.my_strategy import MyStrategy

_STRATEGY_CLASSES = {
    ...
    "my_strategy": MyStrategy,  # Add this line
}
\`\`\`

### Step 3: Test it
Run a backtest through the UI or API. The new strategy will appear in the Strategy Library.
    `,
  },
  {
    id: "add-indicator",
    title: "How to Add a New Indicator",
    content: `
## Adding a New Indicator

### Step 1: Add the function
Edit \`backend/quant/indicators/technical.py\`:

\`\`\`python
def compute_vwap(df: pd.DataFrame, period: int = 20) -> pd.Series:
    """Volume Weighted Average Price."""
    typical_price = (df["high"] + df["low"] + df["close"]) / 3
    cumulative_tp_vol = (typical_price * df["volume"]).rolling(period).sum()
    cumulative_vol = df["volume"].rolling(period).sum()
    return cumulative_tp_vol / cumulative_vol
\`\`\`

### Step 2: Register in the dispatcher
In the \`compute_indicators()\` function, add a new elif:

\`\`\`python
elif ind_type == "vwap":
    p = period or 20
    result[f"vwap_{p}"] = compute_vwap(result, p)
\`\`\`

### Step 3: Use it
Now you can request \`vwap_20\` as an indicator from the API.
    `,
  },
  {
    id: "glossary-quant",
    title: "Quant Glossary",
    content: `
## Quantitative Trading Glossary

- **Alpha**: Excess return above a benchmark. A strategy with positive alpha beats the market.
- **ATR (Average True Range)**: A measure of how much a stock moves per day. Higher = more volatile.
- **Backtest**: Testing a strategy on historical data to see how it would have performed.
- **Benchmark**: A reference to compare against (usually S&P 500 / SPY).
- **Bollinger Bands**: Price bands based on standard deviation. Price near the bands may be extreme.
- **Commission**: Fee paid to a broker for executing a trade.
- **Drawdown**: How far the portfolio has fallen from its peak. Max drawdown = worst decline.
- **EMA (Exponential Moving Average)**: A moving average that weights recent prices more heavily.
- **Equity Curve**: A chart of portfolio value over time.
- **MACD**: Moving Average Convergence Divergence. Measures trend strength and direction.
- **Mean Reversion**: The idea that prices tend to return to their average over time.
- **Momentum**: The idea that prices tend to continue moving in the same direction.
- **OHLCV**: Open, High, Low, Close, Volume — the standard daily price data format.
- **Paper Trading**: Simulated trading with fake money to practice strategies.
- **Position Size**: How many shares to buy for a given trade.
- **Profit Factor**: Gross profit divided by gross loss. >1 = profitable.
- **RSI (Relative Strength Index)**: Oscillator (0-100) measuring overbought/oversold conditions.
- **Sharpe Ratio**: Risk-adjusted return. Higher = better return per unit of risk.
- **Signal**: A buy or sell recommendation generated by a strategy.
- **Slippage**: The difference between expected and actual execution price.
- **SMA (Simple Moving Average)**: Average of the last N closing prices.
- **Sortino Ratio**: Like Sharpe, but only penalizes downside risk.
- **Stop Loss**: An order to sell if price falls below a certain level. Limits losses.
- **Take Profit**: An order to sell if price rises above a certain level. Locks in gains.
- **Volatility**: How much a price fluctuates. Higher volatility = higher risk.
- **Win Rate**: Percentage of trades that were profitable.
    `,
  },
  {
    id: "glossary-web",
    title: "Web Architecture Glossary",
    content: `
## Web Architecture Glossary

- **API (Application Programming Interface)**: A set of rules for how software communicates. Our backend exposes an HTTP API.
- **Backend**: The server-side code that processes data. In our case, Python/FastAPI.
- **Component**: A reusable UI building block in React. Like a custom MATLAB GUI element.
- **CORS**: Cross-Origin Resource Sharing. A security feature that controls which websites can call your API.
- **CSS (Cascading Style Sheets)**: Controls how the website looks (colors, layout, fonts).
- **Database**: Where data is permanently stored. We use SQLite (a single file).
- **Endpoint**: A specific URL path that the API responds to. Example: \`/api/market/prices/AAPL\`
- **FastAPI**: A modern Python web framework for building APIs. Like a more powerful Flask.
- **Frontend**: The browser-side code that users interact with. In our case, Next.js/React.
- **HTTP**: The protocol used to communicate between browser and server. GET = read, POST = create/run.
- **JSON**: JavaScript Object Notation. The format used to send data between frontend and backend.
- **Next.js**: A React framework that adds routing, server rendering, and other features.
- **React**: A JavaScript library for building user interfaces using components.
- **REST**: A style of API design. Each URL represents a resource, HTTP methods represent actions.
- **Route**: A URL path that maps to a specific page or API endpoint.
- **SQL**: Structured Query Language. Used to read/write data in databases.
- **SQLite**: A lightweight database stored in a single file. No server setup needed.
- **State**: Data that a component remembers between renders. Like MATLAB workspace variables.
- **Tailwind CSS**: A utility-first CSS framework. Instead of writing CSS, you add classes directly.
- **TypeScript**: JavaScript with type annotations. Catches errors before runtime.
    `,
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    content: `
## Troubleshooting

### "Backend Not Connected"
The frontend can't reach the backend. Make sure:
1. The backend is running: \`cd backend && uvicorn app.main:app --reload --port 8000\`
2. You've installed Python dependencies: \`pip install -r requirements.txt\`
3. The port 8000 is not already in use

### "No data found for this symbol"
You need to download data first:
1. Click "Refresh Data" for the symbol in Market Data page
2. Or run the seed script: \`cd backend && python scripts/seed_data.py\`

### Charts are empty
Make sure there's data for the selected symbol and date range.
Check that the date range overlaps with available data.

### Backtest shows 0 trades
Your strategy parameters might be too restrictive. Try:
- Using a longer date range
- Adjusting threshold parameters
- Checking that the strategy generates signals for your symbol

### Python import errors
Make sure you're running from the \`backend/\` directory:
\`\`\`
cd backend
python -m uvicorn app.main:app --reload --port 8000
\`\`\`

### Module not found errors
Install dependencies:
\`\`\`
cd backend
pip install -r requirements.txt
\`\`\`
    `,
  },
];

export default function DocsPage() {
  const { t } = useI18n();
  const [activeSection, setActiveSection] = useState("overview");
  const section = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{t("docs_title")}</h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        {t("docs_desc")}
      </p>

      <div className="flex gap-6">
        {/* Table of Contents */}
        <nav className="w-56 shrink-0">
          <div className="sticky top-4 space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className="block w-full text-left text-sm py-1.5 px-3 rounded transition-colors"
                style={{
                  background: activeSection === s.id ? "var(--card-bg)" : "transparent",
                  color: activeSection === s.id ? "var(--accent)" : "var(--muted)",
                }}
              >
                {s.title}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 card prose-sm">
          <div
            className="docs-content"
            dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(section.content) }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Very simple markdown-to-HTML converter for the docs.
 * Handles headings, code blocks, lists, bold, and inline code.
 */
function simpleMarkdownToHtml(md: string): string {
  let html = md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background: var(--background); padding: 1rem; border-radius: 0.5rem; overflow-x: auto; font-size: 0.75rem; margin: 0.5rem 0"><code>$2</code></pre>')
    // Headers
    .replace(/^### (.*$)/gm, '<h3 style="font-size: 1rem; font-weight: 700; margin: 1rem 0 0.5rem; color: var(--foreground)">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 style="font-size: 1.15rem; font-weight: 700; margin: 1.5rem 0 0.5rem; color: var(--foreground)">$1</h2>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--foreground)">$1</strong>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background: var(--background); padding: 0.15rem 0.4rem; border-radius: 0.25rem; font-size: 0.8em">$1</code>')
    // Unordered lists
    .replace(/^- (.*$)/gm, '<li style="margin-left: 1rem; color: var(--muted); font-size: 0.85rem">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.*$)/gm, '<li style="margin-left: 1rem; color: var(--muted); font-size: 0.85rem; list-style-type: decimal">$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p style="color: var(--muted); font-size: 0.85rem; margin: 0.5rem 0">')
    // Line breaks within paragraphs
    .replace(/\n/g, "<br>");

  return `<div style="color: var(--muted); font-size: 0.85rem">${html}</div>`;
}
