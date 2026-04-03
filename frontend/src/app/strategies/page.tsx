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
  trend: "#3b82f6",
  mean_reversion: "#22c55e",
  momentum: "#f59e0b",
  general: "#94a3b8",
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

  if (loading) return <div className="text-center py-12" style={{ color: "var(--muted)" }}>Loading strategies...</div>;

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
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-lg font-bold">{strategy.display_name}</h2>
                <span
                  className="text-xs px-2 py-0.5 rounded-full inline-block mt-1"
                  style={{
                    background: CATEGORY_COLORS[strategy.category] || "#94a3b8",
                    color: "white",
                    opacity: 0.8,
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
            <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
              {strategy.description}
            </p>

            {/* Parameters */}
            <div>
              <h3 className="text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>
                Parameters
              </h3>
              <div className="space-y-1">
                {strategy.parameters.map((param) => (
                  <div key={param.name} className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--foreground)" }}>{param.name}</span>
                    <span style={{ color: "var(--muted)" }}>
                      {param.type === "select"
                        ? param.options?.join(" | ")
                        : `${param.min ?? ""}–${param.max ?? ""}`}
                      {" "}(default: {String(param.default)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {strategies.length === 0 && (
        <div className="card text-center" style={{ color: "var(--muted)" }}>
          No strategies loaded. Make sure the backend is running.
        </div>
      )}
    </div>
  );
}
