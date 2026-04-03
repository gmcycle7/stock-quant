/**
 * API Client — communicates with the FastAPI backend.
 *
 * WHY THIS EXISTS:
 * Instead of writing fetch() calls in every component, we centralize
 * all API communication here. This means:
 * 1. One place to change the backend URL
 * 2. Consistent error handling
 * 3. Easy to see all available API calls
 *
 * MATLAB ANALOGY:
 * Think of each function here as a wrapper that sends a request to the
 * Python backend and gets back data — like calling a web service from MATLAB
 * with webread() or urlread().
 */

import * as demo from "./demo-data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Demo Mode Detection
 *
 * 自動偵測後端是否可用。如果 3 秒內連不上後端 API，
 * 就切換到 Demo Mode，使用內建範例資料。
 * 這讓 GitHub Pages 靜態部署也能完整展示所有頁面。
 */
let _isDemoMode: boolean | null = null;

async function checkDemoMode(): Promise<boolean> {
  if (_isDemoMode !== null) return _isDemoMode;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE}/api/health`, { signal: controller.signal });
    clearTimeout(timeout);
    _isDemoMode = !res.ok;
  } catch {
    _isDemoMode = true;
  }
  return _isDemoMode;
}

export function isDemoMode(): boolean {
  return _isDemoMode === true;
}

/** Generic fetch wrapper with error handling */
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ============================================
// Market Data API
// ============================================

export async function fetchSymbols(): Promise<{ symbols: string[] }> {
  if (await checkDemoMode()) return demo.demoFetchSymbols();
  return apiFetch("/api/market/symbols");
}

export async function fetchPrices(
  symbol: string,
  startDate?: string,
  endDate?: string
): Promise<{ symbol: string; count: number; data: PriceRecord[] }> {
  if (await checkDemoMode()) return demo.demoFetchPrices(symbol) as { symbol: string; count: number; data: PriceRecord[] };
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  const qs = params.toString() ? `?${params}` : "";
  return apiFetch(`/api/market/prices/${symbol}${qs}`);
}

export async function fetchIndicators(
  symbol: string,
  indicators: string = "sma_20,ema_20,rsi_14",
  startDate?: string,
  endDate?: string
): Promise<{ symbol: string; data: Record<string, unknown>[] }> {
  if (await checkDemoMode()) return demo.demoFetchIndicators(symbol) as { symbol: string; data: Record<string, unknown>[] };
  const params = new URLSearchParams({ indicators });
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  return apiFetch(`/api/market/indicators/${symbol}?${params}`);
}

export async function refreshSymbolData(symbol: string): Promise<{ status: string; message: string }> {
  if (await checkDemoMode()) return { status: "demo", message: "Demo mode — data refresh is not available. Connect a backend for full functionality." };
  return apiFetch(`/api/market/refresh/${symbol}`, { method: "POST" });
}

export async function fetchMetadata(): Promise<{ metadata: DataMetadata[] }> {
  if (await checkDemoMode()) return { metadata: [] };
  return apiFetch("/api/market/metadata");
}

// ============================================
// Strategies API
// ============================================

export async function fetchStrategies(): Promise<{ strategies: StrategyInfo[] }> {
  if (await checkDemoMode()) return demo.demoFetchStrategies() as { strategies: StrategyInfo[] };
  return apiFetch("/api/strategies/list");
}

export async function fetchStrategy(name: string): Promise<StrategyInfo> {
  if (await checkDemoMode()) {
    const all = demo.demoFetchStrategies().strategies;
    return all.find((s) => s.name === name) || all[0];
  }
  return apiFetch(`/api/strategies/${name}`);
}

// ============================================
// Backtesting API
// ============================================

export async function runBacktest(req: BacktestRequest): Promise<BacktestResult> {
  if (await checkDemoMode()) return demo.demoRunBacktest(req.symbol, req.strategy_name, req.start_date, req.end_date, req.initial_capital || 100000) as BacktestResult;
  return apiFetch("/api/backtest/run", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function runParameterSweep(req: ParameterSweepRequest): Promise<SweepResult> {
  if (await checkDemoMode()) return { strategy: req.strategy_name, symbol: req.symbol, total_combinations: 0, successful: 0, failed: 0, results: [] };
  return apiFetch("/api/backtest/sweep", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function fetchBacktestHistory(limit = 20): Promise<{ results: BacktestHistoryItem[] }> {
  if (await checkDemoMode()) return demo.demoFetchBacktestHistory() as { results: BacktestHistoryItem[] };
  return apiFetch(`/api/backtest/history?limit=${limit}`);
}

export async function fetchBacktestResult(id: number): Promise<BacktestResult> {
  if (await checkDemoMode()) return demo.demoRunBacktest("AAPL", "ma_crossover", "2022-01-01", "2024-12-31", 100000) as BacktestResult;
  return apiFetch(`/api/backtest/result/${id}`);
}

// ============================================
// Watchlist API
// ============================================

export async function fetchWatchlist(): Promise<{ watchlist: WatchlistItem[] }> {
  if (await checkDemoMode()) return demo.demoFetchWatchlist() as { watchlist: WatchlistItem[] };
  return apiFetch("/api/watchlist/");
}

export async function addToWatchlist(symbol: string, name?: string): Promise<{ message: string }> {
  if (await checkDemoMode()) return { message: "Demo mode — watchlist changes are not saved." };
  const params = new URLSearchParams({ symbol });
  if (name) params.set("name", name);
  return apiFetch(`/api/watchlist/add?${params}`, { method: "POST" });
}

export async function removeFromWatchlist(symbol: string): Promise<{ message: string }> {
  if (await checkDemoMode()) return { message: "Demo mode — watchlist changes are not saved." };
  return apiFetch(`/api/watchlist/remove/${symbol}`, { method: "DELETE" });
}

// ============================================
// Paper Trading API
// ============================================

export async function fetchPortfolio(portfolioId = 1): Promise<PortfolioSummary> {
  if (await checkDemoMode()) return demo.demoFetchPortfolio() as PortfolioSummary;
  return apiFetch(`/api/paper/portfolio/${portfolioId}`);
}

export async function placeOrder(order: OrderRequest): Promise<OrderResult> {
  if (await checkDemoMode()) return { status: "demo", message: "Demo mode — orders are not executed. Connect a backend for paper trading." };
  return apiFetch("/api/paper/order", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

export async function fetchPaperTrades(portfolioId = 1, limit = 50): Promise<{ trades: PaperTrade[] }> {
  if (await checkDemoMode()) return demo.demoFetchPaperTrades() as { trades: PaperTrade[] };
  return apiFetch(`/api/paper/trades/${portfolioId}?limit=${limit}`);
}

export async function fetchPaperOrders(portfolioId = 1): Promise<{ orders: PaperOrder[] }> {
  if (await checkDemoMode()) return { orders: [] };
  return apiFetch(`/api/paper/orders/${portfolioId}`);
}

export async function fetchEquityHistory(portfolioId = 1): Promise<{ equity_history: EquitySnapshot[] }> {
  if (await checkDemoMode()) return { equity_history: [] };
  return apiFetch(`/api/paper/equity/${portfolioId}`);
}

export async function resetPortfolio(portfolioId = 1): Promise<{ message: string }> {
  if (await checkDemoMode()) return { message: "Demo mode — portfolio reset is not available." };
  return apiFetch(`/api/paper/portfolio/${portfolioId}/reset`, { method: "POST" });
}

// ============================================
// Leaderboard API
// ============================================

export async function fetchLeaderboard(
  sortBy = "sharpe_ratio",
  limit = 50
): Promise<{ leaderboard: LeaderboardEntry[] }> {
  if (await checkDemoMode()) return demo.demoFetchLeaderboard() as { leaderboard: LeaderboardEntry[] };
  return apiFetch(`/api/leaderboard/?sort_by=${sortBy}&limit=${limit}`);
}

export async function addToLeaderboard(entry: LeaderboardEntryInput): Promise<{ message: string }> {
  if (await checkDemoMode()) return { message: "Demo mode — leaderboard entries are not saved." };
  return apiFetch("/api/leaderboard/add", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

// ============================================
// Health Check
// ============================================

export async function healthCheck(): Promise<{ status: string; message: string }> {
  if (await checkDemoMode()) return demo.demoHealthCheck();
  return apiFetch("/api/health");
}

// ============================================
// Type Definitions (used by the API functions above)
// ============================================

export interface PriceRecord {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DataMetadata {
  symbol: string;
  last_updated: string;
  first_date: string;
  last_date: string;
  row_count: number;
}

export interface StrategyInfo {
  name: string;
  display_name: string;
  description: string;
  parameters: ParameterDef[];
  category: string;
  default_params?: Record<string, unknown>;
}

export interface ParameterDef {
  name: string;
  type: string;
  min?: number;
  max?: number;
  default: unknown;
  description: string;
  options?: string[];
}

export interface BacktestRequest {
  strategy_name: string;
  symbol: string;
  start_date: string;
  end_date: string;
  params?: Record<string, unknown>;
  initial_capital?: number;
  commission_pct?: number;
  slippage_pct?: number;
  position_size_pct?: number;
  benchmark_symbol?: string;
  stop_loss_pct?: number | null;
  take_profit_pct?: number | null;
  max_positions?: number;
}

export interface BacktestResult {
  strategy?: string;
  symbol?: string;
  params?: Record<string, unknown>;
  metrics: Record<string, number>;
  equity_curve: EquityPoint[];
  trades: TradeRecord[];
  daily_returns?: { date: string; return_pct: number }[];
  benchmark?: { date: string; close: number }[] | null;
  error?: string;
}

export interface EquityPoint {
  date: string;
  equity: number;
  cash: number;
  positions_value: number;
}

export interface TradeRecord {
  date: string;
  side: string;
  price: number;
  shares: number;
  commission: number;
  pnl: number;
  pnl_pct: number;
  reason: string;
  entry_date?: string;
  entry_price?: number;
}

export interface ParameterSweepRequest {
  strategy_name: string;
  symbol: string;
  start_date: string;
  end_date: string;
  param_grid: Record<string, number[]>;
  initial_capital?: number;
  commission_pct?: number;
  slippage_pct?: number;
  position_size_pct?: number;
}

export interface SweepResult {
  strategy: string;
  symbol: string;
  total_combinations: number;
  successful: number;
  failed: number;
  results: { params: Record<string, number>; metrics?: Record<string, number>; error?: string }[];
}

export interface WatchlistItem {
  id: number;
  symbol: string;
  name: string | null;
  added_at: string;
  last_price?: number;
  last_date?: string;
  daily_change?: number;
  daily_change_pct?: number;
}

export interface PortfolioSummary {
  portfolio_id: number;
  name: string;
  cash: number;
  positions_value: number;
  total_equity: number;
  initial_capital: number;
  total_return_pct: number;
  positions: PositionInfo[];
  error?: string;
}

export interface PositionInfo {
  id: number;
  symbol: string;
  shares: number;
  avg_entry_price: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
}

export interface OrderRequest {
  portfolio_id?: number;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  order_type?: string;
  limit_price?: number | null;
}

export interface OrderResult {
  status: string;
  symbol?: string;
  side?: string;
  quantity?: number;
  fill_price?: number;
  commission?: number;
  total_cost?: number;
  proceeds?: number;
  pnl?: number;
  message?: string;
}

export interface PaperTrade {
  id: number;
  symbol: string;
  side: string;
  shares: number;
  price: number;
  commission: number;
  pnl: number | null;
  executed_at: string;
}

export interface PaperOrder {
  id: number;
  symbol: string;
  side: string;
  order_type: string;
  quantity: number;
  limit_price: number | null;
  status: string;
  filled_price: number | null;
  filled_at: string | null;
  created_at: string;
}

export interface EquitySnapshot {
  date: string;
  equity: number;
  cash: number;
  positions_value: number;
}

export interface LeaderboardEntry {
  id: number;
  run_name: string;
  strategy_name: string;
  symbol: string;
  params_json?: string;
  start_date: string;
  end_date: string;
  total_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  win_rate: number;
  num_trades: number;
  created_at: string;
}

export interface LeaderboardEntryInput {
  run_name: string;
  strategy_name: string;
  symbol: string;
  params: Record<string, unknown>;
  start_date: string;
  end_date: string;
  total_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  win_rate: number;
  num_trades: number;
}

export interface BacktestHistoryItem {
  id: number;
  strategy_name: string;
  symbol: string;
  params: Record<string, unknown>;
  start_date: string;
  end_date: string;
  metrics: Record<string, number>;
  initial_capital: number;
  created_at: string;
}
