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
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
        Compare saved strategy runs. Sort by different metrics to find the best performers.
      </p>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm" style={{ color: "var(--muted)" }}>Sort by:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSortBy(opt.value)}
            className="text-xs px-3 py-1 rounded"
            style={{
              background: sortBy === opt.value ? "var(--accent)" : "var(--card-border)",
              color: "white",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12" style={{ color: "var(--muted)" }}>Loading...</div>
      ) : entries.length === 0 ? (
        <div className="card text-center py-12" style={{ color: "var(--muted)" }}>
          No entries yet. Run a backtest and save it to the leaderboard.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "var(--muted)" }} className="border-b">
                <th className="text-left py-2 px-3">#</th>
                <th className="text-left py-2 px-3">Name</th>
                <th className="text-left py-2 px-3">Strategy</th>
                <th className="text-left py-2 px-3">Symbol</th>
                <th className="text-right py-2 px-3">Return %</th>
                <th className="text-right py-2 px-3">Sharpe</th>
                <th className="text-right py-2 px-3">Max DD %</th>
                <th className="text-right py-2 px-3">Win Rate %</th>
                <th className="text-right py-2 px-3">Trades</th>
                <th className="text-left py-2 px-3">Period</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={entry.id} className="border-b" style={{ borderColor: "var(--card-border)" }}>
                  <td className="py-2 px-3" style={{ color: "var(--muted)" }}>{i + 1}</td>
                  <td className="py-2 px-3 font-semibold">{entry.run_name}</td>
                  <td className="py-2 px-3">{entry.strategy_name}</td>
                  <td className="py-2 px-3">{entry.symbol}</td>
                  <td className="py-2 px-3 text-right" style={{ color: entry.total_return >= 0 ? "var(--green)" : "var(--red)" }}>
                    {entry.total_return.toFixed(1)}%
                  </td>
                  <td className="py-2 px-3 text-right">{entry.sharpe_ratio.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right" style={{ color: "var(--red)" }}>
                    {entry.max_drawdown.toFixed(1)}%
                  </td>
                  <td className="py-2 px-3 text-right">{entry.win_rate.toFixed(1)}%</td>
                  <td className="py-2 px-3 text-right">{entry.num_trades}</td>
                  <td className="py-2 px-3 text-xs" style={{ color: "var(--muted)" }}>
                    {entry.start_date} → {entry.end_date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
