"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchWatchlist, fetchBacktestHistory, fetchPortfolio, isDemoMode,
  WatchlistItem, BacktestHistoryItem, PortfolioSummary,
} from "@/lib/api";
import MetricCard from "@/components/MetricCard";
import { useI18n } from "@/lib/i18n";

export default function DashboardPage() {
  const { t } = useI18n();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [backtests, setBacktests] = useState<BacktestHistoryItem[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    (async () => {
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
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <p style={{ textAlign: "center", padding: "3rem 0", color: "var(--muted)" }}>{t("loading")}</p>;

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>{t("dash_title")}</h1>

      {demoMode && (
        <div style={{ background: "#1e3a5f", color: "#93c5fd", border: "1px solid #2563eb", borderRadius: ".5rem", padding: ".6rem 1rem", marginBottom: "1rem", fontSize: ".8rem" }}>
          {t("demo_banner")}
        </div>
      )}

      {/* Portfolio Summary */}
      {portfolio && !portfolio.error && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: ".8rem", fontWeight: 600, color: "var(--muted)", marginBottom: ".5rem", textTransform: "uppercase", letterSpacing: ".05em" }}>{t("paper_portfolio")}</h2>
          <div className="grid-4">
            <MetricCard label={t("total_equity")} value={`$${portfolio.total_equity.toLocaleString()}`} />
            <MetricCard label={t("cash")} value={`$${portfolio.cash.toLocaleString()}`} />
            <MetricCard label={t("positions_val")} value={`$${portfolio.positions_value.toLocaleString()}`} />
            <MetricCard label={t("total_return")} value={portfolio.total_return_pct} suffix="%" positive={portfolio.total_return_pct >= 0} />
          </div>
        </div>
      )}

      {/* Watchlist */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".5rem" }}>
          <h2 style={{ fontSize: ".8rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>{t("watchlist")}</h2>
          <Link href="/market" style={{ fontSize: ".75rem", color: "var(--accent)" }}>{t("manage")}</Link>
        </div>
        {watchlist.length === 0 ? (
          <div className="card" style={{ fontSize: ".85rem", color: "var(--muted)" }}>
            {t("no_watchlist")} <Link href="/market" style={{ color: "var(--accent)" }}>{t("add_some")}</Link>
          </div>
        ) : (
          <div className="grid-4">
            {watchlist.slice(0, 8).map((item) => (
              <Link key={item.symbol} href={`/market?symbol=${item.symbol}`} className="card" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                <div style={{ fontWeight: 700, fontSize: ".9rem" }}>{item.symbol}</div>
                <div style={{ fontSize: ".7rem", color: "var(--muted)" }}>{item.name}</div>
                {item.last_price != null && (
                  <div style={{ marginTop: ".35rem", fontSize: ".85rem" }}>
                    ${item.last_price.toFixed(2)}
                    {item.daily_change_pct != null && (
                      <span style={{ marginLeft: ".4rem", fontSize: ".75rem", color: item.daily_change_pct >= 0 ? "var(--green)" : "var(--red)" }}>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".5rem" }}>
          <h2 style={{ fontSize: ".8rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>{t("recent_bt")}</h2>
          <Link href="/backtest" style={{ fontSize: ".75rem", color: "var(--accent)" }}>{t("run_new")}</Link>
        </div>
        {backtests.length === 0 ? (
          <div className="card" style={{ fontSize: ".85rem", color: "var(--muted)" }}>
            {t("no_bt")} <Link href="/backtest" style={{ color: "var(--accent)" }}>{t("run_first")}</Link>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("col_strategy")}</th><th>{t("col_symbol")}</th><th style={{ textAlign: "right" }}>{t("col_return")}</th>
                  <th style={{ textAlign: "right" }}>{t("col_sharpe")}</th><th style={{ textAlign: "right" }}>{t("col_maxdd")}</th>
                  <th style={{ textAlign: "right" }}>{t("col_trades")}</th>
                </tr>
              </thead>
              <tbody>
                {backtests.map((bt) => (
                  <tr key={bt.id}>
                    <td>{bt.strategy_name}</td>
                    <td>{bt.symbol}</td>
                    <td style={{ textAlign: "right", color: bt.metrics.total_return >= 0 ? "var(--green)" : "var(--red)" }}>{bt.metrics.total_return?.toFixed(1)}%</td>
                    <td style={{ textAlign: "right" }}>{bt.metrics.sharpe_ratio?.toFixed(2)}</td>
                    <td style={{ textAlign: "right", color: "var(--red)" }}>{bt.metrics.max_drawdown?.toFixed(1)}%</td>
                    <td style={{ textAlign: "right" }}>{bt.metrics.num_trades}</td>
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
