"use client";

/**
 * Leaderboard Page — compare strategy runs side by side.
 * Users can sort by different metrics to find the best performing strategies.
 */

import { useEffect, useState } from "react";
import { fetchLeaderboard, LeaderboardEntry } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function LeaderboardPage() {
  const { t } = useI18n();

  const SORT_OPTIONS = [
    { value: "sharpe_ratio", label: t("sharpe_ratio") },
    { value: "total_return", label: t("total_return") },
    { value: "win_rate", label: t("win_rate") },
    { value: "max_drawdown", label: t("max_drawdown") },
    { value: "num_trades", label: t("num_trades") },
  ];

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
      <h1 className="text-2xl font-bold mb-2">{t("lb_title")}</h1>
      <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
        {t("lb_desc")}
      </p>

      {/* Sort Controls */}
      <div className="flex items-center flex-wrap gap-2 mb-5">
        <span className="text-sm" style={{ color: "var(--muted)" }}>{t("lb_sort")}:</span>
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
        <div className="text-center" style={{ padding: "3rem 0", color: "var(--muted)" }}>{t("loading")}</div>
      ) : entries.length === 0 ? (
        <div className="card text-center" style={{ padding: "3rem", color: "var(--muted)" }}>
          {t("lb_no_entries")}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t("col_name")}</th>
                  <th>{t("col_strategy")}</th>
                  <th>{t("col_symbol")}</th>
                  <th style={{ textAlign: "right" }}>{t("col_return")}</th>
                  <th style={{ textAlign: "right" }}>{t("col_sharpe")}</th>
                  <th style={{ textAlign: "right" }}>{t("col_maxdd")}</th>
                  <th style={{ textAlign: "right" }}>{t("win_rate")}</th>
                  <th style={{ textAlign: "right" }}>{t("col_trades")}</th>
                  <th>{t("col_period")}</th>
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
