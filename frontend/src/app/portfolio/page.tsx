"use client";

/**
 * Portfolio Page — detailed view of the paper trading portfolio.
 */

import { useEffect, useState } from "react";
import { fetchPortfolio, PortfolioSummary } from "@/lib/api";
import MetricCard from "@/components/MetricCard";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolio(1)
      .then(setPortfolio)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center" style={{ padding: "3rem 0", color: "var(--muted)" }}>
        Loading...
      </div>
    );
  }

  if (!portfolio || portfolio.error) {
    return (
      <div className="card text-center" style={{ padding: "3rem", color: "var(--muted)" }}>
        Portfolio not found. Make sure the backend is running and data has been seeded.
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Portfolio</h1>

      {/* Summary Cards */}
      <div className="grid-4 mb-6" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        <MetricCard label="Total Equity" value={`$${portfolio.total_equity.toLocaleString()}`} />
        <MetricCard label="Cash" value={`$${portfolio.cash.toLocaleString()}`} />
        <MetricCard label="Positions Value" value={`$${portfolio.positions_value.toLocaleString()}`} />
        <MetricCard label="Initial Capital" value={`$${portfolio.initial_capital.toLocaleString()}`} />
        <MetricCard
          label="Total Return"
          value={portfolio.total_return_pct}
          suffix="%"
          positive={portfolio.total_return_pct >= 0}
        />
      </div>

      {/* Positions Table */}
      <div className="card">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>
          Open Positions <span className="font-normal">({portfolio.positions.length})</span>
        </h2>

        {portfolio.positions.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>No open positions</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th style={{ textAlign: "right" }}>Shares</th>
                  <th style={{ textAlign: "right" }}>Avg Entry</th>
                  <th style={{ textAlign: "right" }}>Current Price</th>
                  <th style={{ textAlign: "right" }}>Market Value</th>
                  <th style={{ textAlign: "right" }}>Unrealized P&L</th>
                  <th style={{ textAlign: "right" }}>P&L %</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map((pos) => (
                  <tr key={pos.id}>
                    <td style={{ fontWeight: 700 }}>{pos.symbol}</td>
                    <td style={{ textAlign: "right" }}>{pos.shares}</td>
                    <td style={{ textAlign: "right" }}>${pos.avg_entry_price.toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>${pos.current_price.toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>${pos.market_value.toLocaleString()}</td>
                    <td
                      style={{
                        textAlign: "right",
                        color: pos.unrealized_pnl >= 0 ? "var(--green)" : "var(--red)",
                        fontWeight: 600,
                      }}
                    >
                      {pos.unrealized_pnl >= 0 ? "+" : ""}${pos.unrealized_pnl.toFixed(2)}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        color: pos.unrealized_pnl_pct >= 0 ? "var(--green)" : "var(--red)",
                        fontWeight: 600,
                      }}
                    >
                      {pos.unrealized_pnl_pct >= 0 ? "+" : ""}{pos.unrealized_pnl_pct.toFixed(2)}%
                    </td>
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
