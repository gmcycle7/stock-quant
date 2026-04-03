/**
 * Demo Data — 內建範例資料，讓前端在沒有後端的情況下也能完整展示。
 *
 * 當 GitHub Pages 靜態部署時，後端 API 不可用，
 * 這時前端會自動切換到 Demo Mode，使用這裡的資料。
 */

// ======== 產生模擬價格資料的工具函數 ========

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generatePrices(
  symbol: string,
  startPrice: number,
  days: number,
  volatility: number,
  seed: number
) {
  const rand = seededRandom(seed);
  const data = [];
  let price = startPrice;
  const start = new Date("2022-01-03");

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + Math.floor(i * 7 / 5)); // skip weekends roughly
    const change = (rand() - 0.48) * volatility;
    price = Math.max(price * (1 + change), 1);
    const open = price * (1 + (rand() - 0.5) * 0.005);
    const high = price * (1 + rand() * 0.015);
    const low = price * (1 - rand() * 0.015);
    const close = price;
    data.push({
      date: d.toISOString().slice(0, 10),
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: Math.floor(1000000 + rand() * 9000000),
    });
  }
  return data;
}

// ======== 各 symbol 的範例資料 ========

const SYMBOLS_META: Record<string, { name: string; startPrice: number; seed: number }> = {
  AAPL: { name: "Apple Inc.", startPrice: 170, seed: 1001 },
  MSFT: { name: "Microsoft Corporation", startPrice: 310, seed: 2002 },
  GOOGL: { name: "Alphabet Inc.", startPrice: 130, seed: 3003 },
  AMZN: { name: "Amazon.com Inc.", startPrice: 140, seed: 4004 },
  META: { name: "Meta Platforms Inc.", startPrice: 200, seed: 5005 },
  NVDA: { name: "NVIDIA Corporation", startPrice: 220, seed: 6006 },
  TSLA: { name: "Tesla Inc.", startPrice: 250, seed: 7007 },
  SPY: { name: "SPDR S&P 500 ETF", startPrice: 450, seed: 8008 },
  QQQ: { name: "Invesco QQQ Trust", startPrice: 370, seed: 9009 },
  JPM: { name: "JPMorgan Chase & Co.", startPrice: 155, seed: 1010 },
  JNJ: { name: "Johnson & Johnson", startPrice: 165, seed: 1111 },
  XOM: { name: "Exxon Mobil Corporation", startPrice: 95, seed: 1212 },
};

const DAYS = 750; // ~3 years of trading days
const VOLATILITY = 0.02;

// 快取，避免重複產生
const _priceCache: Record<string, ReturnType<typeof generatePrices>> = {};
function getPrices(symbol: string) {
  if (!_priceCache[symbol]) {
    const meta = SYMBOLS_META[symbol];
    if (!meta) return [];
    _priceCache[symbol] = generatePrices(symbol, meta.startPrice, DAYS, VOLATILITY, meta.seed);
  }
  return _priceCache[symbol];
}

// ======== Demo API 回應 ========

export const DEMO_SYMBOLS = Object.keys(SYMBOLS_META);

export function demoFetchSymbols() {
  return { symbols: DEMO_SYMBOLS };
}

export function demoFetchPrices(symbol: string) {
  const data = getPrices(symbol.toUpperCase());
  return { symbol: symbol.toUpperCase(), count: data.length, data };
}

export function demoFetchIndicators(symbol: string) {
  const data = getPrices(symbol.toUpperCase());
  // 計算 SMA 20 / 50
  const mapped = data.map((d, i) => {
    const sma20 = i >= 19 ? data.slice(i - 19, i + 1).reduce((s, r) => s + r.close, 0) / 20 : null;
    const sma50 = i >= 49 ? data.slice(i - 49, i + 1).reduce((s, r) => s + r.close, 0) / 50 : null;
    return { ...d, fast_ma: sma20 ? +sma20.toFixed(2) : null, slow_ma: sma50 ? +sma50.toFixed(2) : null };
  });
  return { symbol: symbol.toUpperCase(), count: mapped.length, indicators: ["sma_20", "sma_50"], data: mapped };
}

export function demoFetchWatchlist() {
  return {
    watchlist: Object.entries(SYMBOLS_META).slice(0, 8).map(([sym, meta], i) => {
      const prices = getPrices(sym);
      const last = prices[prices.length - 1];
      const prev = prices[prices.length - 2];
      const change = last.close - prev.close;
      return {
        id: i + 1,
        symbol: sym,
        name: meta.name,
        added_at: "2024-01-01",
        last_price: last.close,
        last_date: last.date,
        daily_change: +change.toFixed(2),
        daily_change_pct: +((change / prev.close) * 100).toFixed(2),
      };
    }),
  };
}

export function demoFetchStrategies() {
  return {
    strategies: [
      {
        name: "ma_crossover",
        display_name: "Moving Average Crossover",
        description: "Buys when a fast moving average crosses above a slow moving average, sells when it crosses below. Classic trend-following strategy.",
        category: "trend",
        parameters: [
          { name: "fast_period", type: "int", min: 2, max: 100, default: 20, description: "Period for the fast (short-term) moving average" },
          { name: "slow_period", type: "int", min: 10, max: 500, default: 50, description: "Period for the slow (long-term) moving average" },
          { name: "ma_type", type: "select", options: ["sma", "ema"], default: "sma", description: "Type of moving average" },
        ],
        default_params: { fast_period: 20, slow_period: 50, ma_type: "sma" },
      },
      {
        name: "rsi_reversion",
        display_name: "RSI Mean Reversion",
        description: "Buys when RSI indicates oversold conditions (below threshold), sells when overbought. A contrarian strategy.",
        category: "mean_reversion",
        parameters: [
          { name: "rsi_period", type: "int", min: 2, max: 50, default: 14, description: "Lookback period for RSI" },
          { name: "oversold", type: "int", min: 10, max: 50, default: 30, description: "Oversold threshold" },
          { name: "overbought", type: "int", min: 50, max: 95, default: 70, description: "Overbought threshold" },
        ],
        default_params: { rsi_period: 14, oversold: 30, overbought: 70 },
      },
      {
        name: "bollinger_band",
        display_name: "Bollinger Band Reversion",
        description: "Buys when price drops below the lower Bollinger Band, sells above the upper band. Volatility-based mean reversion.",
        category: "mean_reversion",
        parameters: [
          { name: "bb_period", type: "int", min: 5, max: 100, default: 20, description: "Bollinger Band period" },
          { name: "bb_std", type: "float", min: 0.5, max: 4.0, default: 2.0, description: "Standard deviations" },
        ],
        default_params: { bb_period: 20, bb_std: 2.0 },
      },
      {
        name: "momentum",
        display_name: "Momentum",
        description: "Buys when price momentum is strongly positive, sells when momentum turns negative. Trend-following.",
        category: "trend",
        parameters: [
          { name: "lookback", type: "int", min: 5, max: 252, default: 20, description: "Lookback period for momentum" },
          { name: "ma_period", type: "int", min: 10, max: 200, default: 50, description: "Trend filter MA period" },
          { name: "momentum_threshold", type: "float", min: -10, max: 20, default: 0, description: "Min momentum % to buy" },
        ],
        default_params: { lookback: 20, ma_period: 50, momentum_threshold: 0 },
      },
      {
        name: "macd_trend",
        display_name: "MACD Trend",
        description: "Buys on MACD bullish crossover, sells on bearish crossover. Popular trend-following indicator strategy.",
        category: "trend",
        parameters: [
          { name: "fast_period", type: "int", min: 2, max: 50, default: 12, description: "Fast EMA period" },
          { name: "slow_period", type: "int", min: 10, max: 100, default: 26, description: "Slow EMA period" },
          { name: "signal_period", type: "int", min: 2, max: 50, default: 9, description: "Signal line period" },
        ],
        default_params: { fast_period: 12, slow_period: 26, signal_period: 9 },
      },
    ],
  };
}

// ======== Demo Backtest 回應 ========

export function demoRunBacktest(symbol: string, strategyName: string, startDate: string, endDate: string, initialCapital: number) {
  const prices = getPrices(symbol.toUpperCase());
  const filtered = prices.filter((p) => p.date >= startDate && p.date <= endDate);
  if (filtered.length < 50) {
    return { error: "Not enough data for backtest in demo mode." };
  }

  // 簡單模擬 MA crossover 回測結果
  const rand = seededRandom(
    strategyName.length * 1000 + symbol.charCodeAt(0) * 100 + initialCapital
  );

  // 產生模擬 equity curve
  let equity = initialCapital;
  const equityCurve = filtered.map((p) => {
    equity *= 1 + (rand() - 0.48) * 0.008;
    return {
      date: p.date,
      equity: +equity.toFixed(2),
      cash: +(equity * 0.3).toFixed(2),
      positions_value: +(equity * 0.7).toFixed(2),
    };
  });

  // 產生模擬交易紀錄
  const trades = [];
  for (let i = 0; i < 30; i++) {
    const idx = Math.floor(rand() * (filtered.length - 10)) + 5;
    const buyPrice = filtered[idx].close;
    const sellIdx = Math.min(idx + Math.floor(rand() * 20) + 3, filtered.length - 1);
    const sellPrice = filtered[sellIdx].close;
    const shares = Math.floor((initialCapital * 0.1) / buyPrice);
    const pnl = (sellPrice - buyPrice) * shares;
    trades.push(
      { date: filtered[idx].date, side: "buy", price: +buyPrice.toFixed(2), shares, commission: +(buyPrice * shares * 0.001).toFixed(2), pnl: 0, pnl_pct: 0, reason: "signal", entry_date: filtered[idx].date, entry_price: +buyPrice.toFixed(2) },
      { date: filtered[sellIdx].date, side: "sell", price: +sellPrice.toFixed(2), shares, commission: +(sellPrice * shares * 0.001).toFixed(2), pnl: +pnl.toFixed(2), pnl_pct: +((pnl / (buyPrice * shares)) * 100).toFixed(2), reason: "signal", entry_date: filtered[idx].date, entry_price: +buyPrice.toFixed(2) }
    );
  }
  trades.sort((a, b) => a.date.localeCompare(b.date));

  const finalEquity = equityCurve[equityCurve.length - 1].equity;
  const totalReturn = ((finalEquity - initialCapital) / initialCapital) * 100;
  const sellTrades = trades.filter((t) => t.side === "sell");
  const wins = sellTrades.filter((t) => t.pnl > 0);

  // Benchmark (SPY)
  const benchPrices = getPrices("SPY").filter((p) => p.date >= startDate && p.date <= endDate);
  const benchmark = benchPrices.map((p) => ({ date: p.date, close: p.close }));

  return {
    strategy: strategyName,
    symbol: symbol.toUpperCase(),
    params: {},
    metrics: {
      total_return: +totalReturn.toFixed(2),
      annualized_return: +(totalReturn / Math.max(filtered.length / 252, 0.5)).toFixed(2),
      annualized_volatility: +(8 + rand() * 12).toFixed(2),
      sharpe_ratio: +(totalReturn > 0 ? 0.3 + rand() * 1.5 : -0.5 + rand()).toFixed(3),
      sortino_ratio: +(totalReturn > 0 ? 0.5 + rand() * 2 : -0.3 + rand()).toFixed(3),
      max_drawdown: -(5 + rand() * 20).toFixed(2),
      calmar_ratio: +(totalReturn > 0 ? 0.2 + rand() : -0.1).toFixed(3),
      win_rate: +((wins.length / Math.max(sellTrades.length, 1)) * 100).toFixed(1),
      num_trades: sellTrades.length,
      num_buys: trades.filter((t) => t.side === "buy").length,
      avg_win: wins.length > 0 ? +(wins.reduce((s, t) => s + t.pnl, 0) / wins.length).toFixed(2) : 0,
      avg_loss: +(sellTrades.filter((t) => t.pnl <= 0).reduce((s, t) => s + t.pnl, 0) / Math.max(sellTrades.filter((t) => t.pnl <= 0).length, 1)).toFixed(2),
      avg_win_pct: 0,
      avg_loss_pct: 0,
      profit_factor: +(1 + rand() * 2).toFixed(3),
      avg_trade_return: 0,
      avg_trade_return_pct: 0,
      gross_profit: +wins.reduce((s, t) => s + t.pnl, 0).toFixed(2),
      gross_loss: +Math.abs(sellTrades.filter((t) => t.pnl <= 0).reduce((s, t) => s + t.pnl, 0)).toFixed(2),
      total_commission: +trades.reduce((s, t) => s + t.commission, 0).toFixed(2),
      final_equity: +finalEquity.toFixed(2),
      initial_capital: initialCapital,
      trading_days: filtered.length,
    },
    equity_curve: equityCurve,
    trades,
    daily_returns: [],
    benchmark,
  };
}

export function demoFetchPortfolio() {
  return {
    portfolio_id: 1,
    name: "Demo Portfolio",
    cash: 72450.33,
    positions_value: 28730.50,
    total_equity: 101180.83,
    initial_capital: 100000,
    total_return_pct: 1.18,
    positions: [
      { id: 1, symbol: "AAPL", shares: 50, avg_entry_price: 172.30, current_price: 178.50, market_value: 8925, unrealized_pnl: 310, unrealized_pnl_pct: 3.60 },
      { id: 2, symbol: "MSFT", shares: 30, avg_entry_price: 315.20, current_price: 328.40, market_value: 9852, unrealized_pnl: 396, unrealized_pnl_pct: 4.19 },
      { id: 3, symbol: "GOOGL", shares: 70, avg_entry_price: 141.80, current_price: 142.19, market_value: 9953.50, unrealized_pnl: 27.30, unrealized_pnl_pct: 0.27 },
    ],
  };
}

export function demoFetchPaperTrades() {
  return {
    trades: [
      { id: 1, symbol: "AAPL", side: "buy", shares: 50, price: 172.30, commission: 0, pnl: null, executed_at: "2024-11-15 10:30:00" },
      { id: 2, symbol: "MSFT", side: "buy", shares: 30, price: 315.20, commission: 0, pnl: null, executed_at: "2024-11-18 14:22:00" },
      { id: 3, symbol: "NVDA", side: "buy", shares: 20, price: 480.00, commission: 0, pnl: null, executed_at: "2024-12-01 09:45:00" },
      { id: 4, symbol: "NVDA", side: "sell", shares: 20, price: 510.50, commission: 0, pnl: 610, executed_at: "2024-12-10 11:30:00" },
      { id: 5, symbol: "GOOGL", side: "buy", shares: 70, price: 141.80, commission: 0, pnl: null, executed_at: "2025-01-05 10:00:00" },
    ],
  };
}

export function demoFetchBacktestHistory() {
  return {
    results: [
      { id: 1, strategy_name: "ma_crossover", symbol: "AAPL", params: { fast_period: 20, slow_period: 50 }, start_date: "2022-01-01", end_date: "2024-12-31", metrics: { total_return: 18.5, sharpe_ratio: 0.85, max_drawdown: -12.3, num_trades: 24, win_rate: 54.2 }, initial_capital: 100000, created_at: "2025-03-01" },
      { id: 2, strategy_name: "rsi_reversion", symbol: "MSFT", params: { rsi_period: 14, oversold: 30, overbought: 70 }, start_date: "2022-01-01", end_date: "2024-12-31", metrics: { total_return: 12.1, sharpe_ratio: 0.62, max_drawdown: -15.8, num_trades: 31, win_rate: 48.4 }, initial_capital: 100000, created_at: "2025-03-02" },
      { id: 3, strategy_name: "macd_trend", symbol: "GOOGL", params: { fast_period: 12, slow_period: 26, signal_period: 9 }, start_date: "2023-01-01", end_date: "2024-12-31", metrics: { total_return: 22.7, sharpe_ratio: 1.12, max_drawdown: -9.5, num_trades: 18, win_rate: 61.1 }, initial_capital: 100000, created_at: "2025-03-05" },
    ],
  };
}

export function demoFetchLeaderboard() {
  return {
    leaderboard: [
      { id: 1, run_name: "MACD on GOOGL", strategy_name: "macd_trend", symbol: "GOOGL", start_date: "2023-01-01", end_date: "2024-12-31", total_return: 22.7, sharpe_ratio: 1.12, max_drawdown: -9.5, win_rate: 61.1, num_trades: 18, created_at: "2025-03-05" },
      { id: 2, run_name: "MA Cross AAPL", strategy_name: "ma_crossover", symbol: "AAPL", start_date: "2022-01-01", end_date: "2024-12-31", total_return: 18.5, sharpe_ratio: 0.85, max_drawdown: -12.3, win_rate: 54.2, num_trades: 24, created_at: "2025-03-01" },
      { id: 3, run_name: "RSI MSFT", strategy_name: "rsi_reversion", symbol: "MSFT", start_date: "2022-01-01", end_date: "2024-12-31", total_return: 12.1, sharpe_ratio: 0.62, max_drawdown: -15.8, win_rate: 48.4, num_trades: 31, created_at: "2025-03-02" },
      { id: 4, run_name: "Bollinger NVDA", strategy_name: "bollinger_band", symbol: "NVDA", start_date: "2022-06-01", end_date: "2024-12-31", total_return: 35.2, sharpe_ratio: 0.95, max_drawdown: -18.1, win_rate: 52.0, num_trades: 40, created_at: "2025-03-08" },
    ],
  };
}

export function demoHealthCheck() {
  return {
    status: "demo",
    message: "Running in Demo Mode — using built-in sample data. Connect a backend for full functionality.",
  };
}
