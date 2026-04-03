-- ============================================
-- Stock Quant Database Schema (SQLite)
-- ============================================
-- This schema defines all the tables used by the application.
-- SQLite is used for simplicity — no separate database server needed.
--
-- MATLAB analogy: Think of each table as a structured array or table variable.
-- Each row is one record, each column is a field.

-- ============================================
-- Market Data: stores downloaded OHLCV price data
-- ============================================
CREATE TABLE IF NOT EXISTS price_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,           -- Ticker symbol, e.g., "AAPL"
    date TEXT NOT NULL,             -- Date in YYYY-MM-DD format
    open REAL NOT NULL,             -- Opening price
    high REAL NOT NULL,             -- Highest price of the day
    low REAL NOT NULL,              -- Lowest price of the day
    close REAL NOT NULL,            -- Closing price (adjusted)
    volume INTEGER NOT NULL,        -- Number of shares traded
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(symbol, date)           -- No duplicate entries for same symbol+date
);

-- Index for fast lookups by symbol and date range
CREATE INDEX IF NOT EXISTS idx_price_symbol_date ON price_data(symbol, date);

-- ============================================
-- Watchlist: user's saved symbols to track
-- ============================================
CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL UNIQUE,    -- Ticker symbol
    name TEXT,                      -- Company name
    added_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- Backtest Results: saved backtest runs
-- ============================================
CREATE TABLE IF NOT EXISTS backtest_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    strategy_name TEXT NOT NULL,    -- Which strategy was used
    symbol TEXT NOT NULL,           -- Which stock was tested
    params_json TEXT NOT NULL,      -- Strategy parameters as JSON
    start_date TEXT NOT NULL,       -- Backtest start date
    end_date TEXT NOT NULL,         -- Backtest end date
    metrics_json TEXT NOT NULL,     -- Performance metrics as JSON
    equity_curve_json TEXT,         -- Daily equity values as JSON
    trades_json TEXT,               -- Trade log as JSON
    initial_capital REAL NOT NULL DEFAULT 100000,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- Paper Trading: simulated portfolio state
-- ============================================
CREATE TABLE IF NOT EXISTS paper_portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT 'Default',  -- Portfolio name
    cash REAL NOT NULL DEFAULT 100000.0,   -- Available cash
    initial_capital REAL NOT NULL DEFAULT 100000.0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Paper trading positions (currently held)
CREATE TABLE IF NOT EXISTS paper_positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    shares REAL NOT NULL,           -- Number of shares (can be fractional)
    avg_entry_price REAL NOT NULL,  -- Average price paid per share
    opened_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (portfolio_id) REFERENCES paper_portfolio(id)
);

-- Paper trading orders (submitted orders)
CREATE TABLE IF NOT EXISTS paper_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL,             -- "buy" or "sell"
    order_type TEXT NOT NULL DEFAULT 'market',  -- "market" or "limit"
    quantity REAL NOT NULL,
    limit_price REAL,              -- Only for limit orders
    status TEXT NOT NULL DEFAULT 'pending',  -- "pending", "filled", "cancelled"
    filled_price REAL,             -- Actual fill price
    filled_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (portfolio_id) REFERENCES paper_portfolio(id)
);

-- Paper trading trade history (completed trades)
CREATE TABLE IF NOT EXISTS paper_trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL,             -- "buy" or "sell"
    shares REAL NOT NULL,
    price REAL NOT NULL,
    commission REAL NOT NULL DEFAULT 0.0,
    pnl REAL,                      -- Profit/loss for sells
    executed_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (portfolio_id) REFERENCES paper_portfolio(id)
);

-- Paper portfolio equity snapshots (for equity curve)
CREATE TABLE IF NOT EXISTS paper_equity_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    equity REAL NOT NULL,           -- Total portfolio value
    cash REAL NOT NULL,
    positions_value REAL NOT NULL,  -- Value of all held positions
    FOREIGN KEY (portfolio_id) REFERENCES paper_portfolio(id),
    UNIQUE(portfolio_id, date)
);

-- ============================================
-- Leaderboard: stores named strategy runs for comparison
-- ============================================
CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_name TEXT NOT NULL,         -- User-given name for this run
    strategy_name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    params_json TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    total_return REAL,
    sharpe_ratio REAL,
    max_drawdown REAL,
    win_rate REAL,
    num_trades INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- Metadata: track data freshness
-- ============================================
CREATE TABLE IF NOT EXISTS data_metadata (
    symbol TEXT PRIMARY KEY,
    last_updated TEXT NOT NULL,     -- When data was last downloaded
    first_date TEXT,               -- Earliest date in our data
    last_date TEXT,                -- Latest date in our data
    row_count INTEGER
);
