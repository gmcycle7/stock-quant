"use client";

/**
 * Dashboard Page — overview of watchlist, recent backtests, and portfolio status.
 * This is the main "home base" once the user is actively using the platform.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchWatchlist,
  fetchBacktestHistory,
  fetchPortfolio,
  isDemoMode,
  WatchlistItem,
  BacktestHistoryItem,
  PortfolioSummary,
} from "@/lib/api";
import MetricCard from "@/components/MetricCard";

export default function DashboardPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [backtests, setBacktests] = useState<BacktestHistoryItem[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [wl, bt, pf] = await Promise.all([
          fetchWatchlist().catch(() => ({ watchlist: [] })),
          fetchBacktestHistory(5).catch(() => ({ results: [] })),
          fetchPortfolio(1).catch(() => null),
        ]);
        setWatchlist(wl.watchlist);
        setBacktests(bt.results);
        setPortfolio(pf);
        setDemoMode(isDemoMode());
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="text-center py-12" style={{ color: "var(--muted)" }}>Loading dashboard...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {demoMode && (
        <div className="rounded-lg px-4 py-2 mb-4 text-sm" style={{ background: "#1e3a5f", color: "#93c5fd", border: "1px solid #2563eb" }}>
          <strong>Demo Mode</strong> — 目前使用內建範例資料。如需完整功能，請啟動後端伺服器。
          <span className="ml-2 opacity-70">See README for setup instructions.</span>
        </div>
      )}

      {/* Portfolio Summary */}
      {portfolio && !portfolio.error && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>Paper Portfolio</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Total Equity" value={`$${portfolio.total_equity.toLocaleString()}`} />
            <MetricCard label="Cash" value={`$${portfolio.cash.toLocaleString()}`} />
            <MetricCard label="Positions Value" value={`$${portfolio.positions_value.toLocaleString()}`} />
            <MetricCard
              label="Total Return"
              value={portfolio.total_return_pct}
              suffix="%"
              positive={portfolio.total_return_pct >= 0}
            />
          </div>
        </div>
      )}

      {/* Watchlist */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: "var(--muted)" }}>Watchlist</h2>
          <Link href="/market" className="text-xs" style={{ color: "var(--accent)" }}>Manage</Link>
        </div>
        {watchlist.length === 0 ? (
          <div className="card text-sm" style={{ color: "var(--muted)" }}>
            No symbols in watchlist. <Link href="/market" className="underline" style={{ color: "var(--accent)" }}>Add some</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {watchlist.slice(0, 8).map((item) => (
              <Link key={item.symbol} href={`/market?symbol=${item.symbol}`} className="card block text-sm hover:border-blue-500 transition-colors">
                <div className="font-bold">{item.symbol}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{item.name}</div>
                {item.last_price && (
                  <div className="mt-1">
                    <span>${item.last_price.toFixed(2)}</span>
                    {item.daily_change_pct != null && (
                      <span className="ml-2 text-xs" style={{ color: item.daily_change_pct >= 0 ? "var(--green)" : "var(--red)" }}>
                        {item.daily_change_pct >= 0 ? "+" : ""}{item.daily_change_pct.toFixed(2)}%
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Backtests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: "var(--muted)" }}>Recent Backtests</h2>
          <Link href="/backtest" className="text-xs" style={{ color: "var(--accent)" }}>Run New</Link>
        </div>
        {backtests.length === 0 ? (
          <div className="card text-sm" style={{ color: "var(--muted)" }}>
            No backtests yet. <Link href="/backtest" className="underline" style={{ color: "var(--accent)" }}>Run your first backtest</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: "var(--muted)" }} className="border-b" >
                  <th className="text-left py-2 px-3">Strategy</th>
                  <th className="text-left py-2 px-3">Symbol</th>
                  <th className="text-right py-2 px-3">Return</th>
                  <th className="text-right py-2 px-3">Sharpe</th>
                  <th className="text-right py-2 px-3">Max DD</th>
                  <th className="text-right py-2 px-3">Trades</th>
                </tr>
              </thead>
              <tbody>
                {backtests.map((bt) => (
                  <tr key={bt.id} className="border-b" style={{ borderColor: "var(--card-border)" }}>
                    <td className="py-2 px-3">{bt.strategy_name}</td>
                    <td className="py-2 px-3">{bt.symbol}</td>
                    <td className="py-2 px-3 text-right" style={{ color: bt.metrics.total_return >= 0 ? "var(--green)" : "var(--red)" }}>
                      {bt.metrics.total_return?.toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-right">{bt.metrics.sharpe_ratio?.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right" style={{ color: "var(--red)" }}>{bt.metrics.max_drawdown?.toFixed(1)}%</td>
                    <td className="py-2 px-3 text-right">{bt.metrics.num_trades}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
