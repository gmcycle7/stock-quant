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

  if (loading) return <div className="text-center py-12" style={{ color: "var(--muted)" }}>Loading...</div>;

  if (!portfolio || portfolio.error) {
    return (
      <div className="card text-center py-12" style={{ color: "var(--muted)" }}>
        Portfolio not found. Make sure the backend is running and data has been seeded.
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Portfolio</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
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
          Open Positions ({portfolio.positions.length})
        </h2>

        {portfolio.positions.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>No open positions</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: "var(--muted)" }}>
                  <th className="text-left py-2 px-3">Symbol</th>
                  <th className="text-right py-2 px-3">Shares</th>
                  <th className="text-right py-2 px-3">Avg Entry</th>
                  <th className="text-right py-2 px-3">Current Price</th>
                  <th className="text-right py-2 px-3">Market Value</th>
                  <th className="text-right py-2 px-3">Unrealized P&L</th>
                  <th className="text-right py-2 px-3">P&L %</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map((pos) => (
                  <tr key={pos.id} className="border-b" style={{ borderColor: "var(--card-border)" }}>
                    <td className="py-2 px-3 font-bold">{pos.symbol}</td>
                    <td className="py-2 px-3 text-right">{pos.shares}</td>
                    <td className="py-2 px-3 text-right">${pos.avg_entry_price.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right">${pos.current_price.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right">${pos.market_value.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right" style={{ color: pos.unrealized_pnl >= 0 ? "var(--green)" : "var(--red)" }}>
                      {pos.unrealized_pnl >= 0 ? "+" : ""}${pos.unrealized_pnl.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right" style={{ color: pos.unrealized_pnl_pct >= 0 ? "var(--green)" : "var(--red)" }}>
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
