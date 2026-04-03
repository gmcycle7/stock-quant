"use client";

/**
 * Leaderboard Page — compare strategy runs side by side.
 * Users can sort by different metrics to find the best performing strategies.
 */

import { useEffect, useState } from "react";
import { fetchLeaderboard, LeaderboardEntry } from "@/lib/api";

const SORT_OPTIONS = [
  { value: "sharpe_ratio", label: "Sharpe Ratio" },
  { value: "total_return", label: "Total Return" },
  { value: "win_rate", label: "Win Rate" },
  { value: "max_drawdown", label: "Max Drawdown (best)" },
  { value: "num_trades", label: "# Trades" },
];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [sortBy, setSortBy] = useState("sharpe_ratio");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard(sortBy, 50)
      .then((data) => setEntries(data.leaderboard))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [sortBy]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Leaderboard</h1>
      <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
        Compare saved strategy runs. Sort by different metrics to find the best performers.
      </p>

      {/* Sort Controls */}
      <div className="flex items-center flex-wrap gap-2 mb-5">
        <span className="text-sm" style={{ color: "var(--muted)" }}>Sort by:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSortBy(opt.value)}
            className="text-xs"
            style={{
              padding: ".3rem .75rem",
              borderRadius: ".375rem",
              border: "none",
              cursor: "pointer",
              fontWeight: sortBy === opt.value ? 700 : 400,
              background: sortBy === opt.value ? "var(--accent)" : "var(--card-border)",
              color: sortBy === opt.value ? "#fff" : "var(--foreground)",
              transition: "background .15s",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center" style={{ padding: "3rem 0", color: "var(--muted)" }}>Loading...</div>
      ) : entries.length === 0 ? (
        <div className="card text-center" style={{ padding: "3rem", color: "var(--muted)" }}>
          No entries yet. Run a backtest and save it to the leaderboard.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Strategy</th>
                  <th>Symbol</th>
                  <th style={{ textAlign: "right" }}>Return %</th>
                  <th style={{ textAlign: "right" }}>Sharpe</th>
                  <th style={{ textAlign: "right" }}>Max DD %</th>
                  <th style={{ textAlign: "right" }}>Win Rate %</th>
                  <th style={{ textAlign: "right" }}>Trades</th>
                  <th>Period</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr key={entry.id}>
                    <td style={{ color: "var(--muted)" }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{entry.run_name}</td>
                    <td>{entry.strategy_name}</td>
                    <td style={{ fontWeight: 600, color: "var(--accent)" }}>{entry.symbol}</td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: 700,
                        color: entry.total_return >= 0 ? "var(--green)" : "var(--red)",
                      }}
                    >
                      {entry.total_return >= 0 ? "+" : ""}{entry.total_return.toFixed(1)}%
                    </td>
                    <td style={{ textAlign: "right" }}>{entry.sharpe_ratio.toFixed(2)}</td>
                    <td style={{ textAlign: "right", color: "var(--red)" }}>
                      {entry.max_drawdown.toFixed(1)}%
                    </td>
                    <td style={{ textAlign: "right" }}>{entry.win_rate.toFixed(1)}%</td>
                    <td style={{ textAlign: "right" }}>{entry.num_trades}</td>
                    <td style={{ color: "var(--muted)", fontSize: ".75rem" }}>
                      {entry.start_date} → {entry.end_date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
