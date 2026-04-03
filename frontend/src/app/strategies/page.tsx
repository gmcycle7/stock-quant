"use client";

/**
 * Strategy Library Page.
 *
 * Displays all available trading strategies with their descriptions,
 * parameters, and categories. Users can explore strategies before
 * running backtests.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchStrategies, StrategyInfo } from "@/lib/api";

const CATEGORY_COLORS: Record<string, string> = {
  trend: "var(--accent)",
  mean_reversion: "var(--green)",
  momentum: "var(--yellow)",
  general: "var(--muted)",
};

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<StrategyInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStrategies()
      .then((data) => setStrategies(data.strategies))
      .catch(() => setStrategies([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center" style={{ padding: "3rem 0", color: "var(--muted)" }}>
        Loading strategies...
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Strategy Library</h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        Browse available trading strategies. Each strategy can be configured with custom parameters
        and backtested against historical data.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {strategies.map((strategy) => (
          <div key={strategy.name} className="card">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold mb-1">{strategy.display_name}</h2>
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full inline-block"
                  style={{
                    background: CATEGORY_COLORS[strategy.category] || "var(--muted)",
                    color: "#fff",
                    opacity: 0.9,
                  }}
                >
                  {strategy.category.replace("_", " ")}
                </span>
              </div>
              <Link
                href={`/backtest?strategy=${strategy.name}`}
                className="btn-primary text-xs"
              >
                Backtest
              </Link>
            </div>

            {/* Description */}
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
              {strategy.description}
            </p>

            {/* Parameters */}
            <div>
              <h3 className="text-xs font-semibold mb-2" style={{ color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Parameters
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: ".375rem" }}>
                {strategy.parameters.map((param) => (
                  <div
                    key={param.name}
                    className="flex items-center justify-between text-xs"
                    style={{
                      padding: ".3rem .5rem",
                      borderRadius: ".375rem",
                      background: "var(--background)",
                    }}
                  >
                    <span style={{ color: "var(--foreground)", fontWeight: 500 }}>{param.name}</span>
                    <span style={{ color: "var(--muted)" }}>
                      {param.type === "select"
                        ? param.options?.join(" | ")
                        : `${param.min ?? ""}–${param.max ?? ""}`}
                      {" "}
                      <span style={{ color: "var(--accent)" }}>
                        (default: {String(param.default)})
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {strategies.length === 0 && (
        <div className="card text-center" style={{ padding: "3rem", color: "var(--muted)" }}>
          No strategies loaded. Make sure the backend is running.
        </div>
      )}
    </div>
  );
}
