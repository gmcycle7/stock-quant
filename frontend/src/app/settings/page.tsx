"use client";

/**
 * Settings Page — configuration and system info.
 */

import { useEffect, useState } from "react";
import { healthCheck } from "@/lib/api";

export default function SettingsPage() {
  const [backendStatus, setBackendStatus] = useState<string>("Checking...");
  const [backendMessage, setBackendMessage] = useState("");

  useEffect(() => {
    healthCheck()
      .then((data) => {
        setBackendStatus(data.status === "ok" ? "Connected" : "Error");
        setBackendMessage(data.message);
      })
      .catch(() => {
        setBackendStatus("Disconnected");
        setBackendMessage("Cannot reach backend. Make sure it's running on port 8000.");
      });
  }, []);

  const isConnected = backendStatus === "Connected";

  return (
    <div style={{ maxWidth: "40rem" }}>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Backend Status */}
      <div className="card mb-4">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>Backend Connection</h2>
        <div className="flex items-center gap-2 mb-2">
          <div
            style={{
              width: ".75rem",
              height: ".75rem",
              borderRadius: "50%",
              background: isConnected ? "var(--green)" : "var(--red)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontWeight: 600,
              color: isConnected ? "var(--green)" : backendStatus === "Checking..." ? "var(--muted)" : "var(--red)",
            }}
          >
            {backendStatus}
          </span>
        </div>
        {backendMessage && (
          <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>{backendMessage}</p>
        )}
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          API URL:{" "}
          <code style={{ color: "var(--accent)", background: "var(--background)", padding: ".1rem .3rem", borderRadius: ".25rem" }}>
            {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
          </code>
        </p>
      </div>

      {/* Default Parameters */}
      <div className="card mb-4">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>Default Parameters</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
          {[
            { label: "Initial Capital", value: "$100,000" },
            { label: "Commission", value: "0.1%" },
            { label: "Slippage", value: "0.05%" },
            { label: "Data Provider", value: "Yahoo Finance (yfinance)" },
            { label: "Benchmark", value: "SPY (S&P 500)" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex justify-between text-sm"
              style={{ padding: ".3rem 0", borderBottom: "1px solid var(--card-border)" }}
            >
              <span style={{ color: "var(--muted)" }}>{label}</span>
              <span style={{ fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* API Notes for Future Brokerage Integration */}
      <div className="card mb-4">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>
          Future: Brokerage Integration
        </h2>
        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
          This platform currently supports paper trading only. To add live brokerage integration
          in the future, you would:
        </p>
        <ol className="text-xs list-decimal list-inside" style={{ color: "var(--muted)", display: "flex", flexDirection: "column", gap: ".25rem" }}>
          <li>Create a new module at <code style={{ color: "var(--accent)" }}>backend/quant/broker/</code></li>
          <li>Implement an adapter interface for your broker (e.g., Alpaca, Interactive Brokers)</li>
          <li>Add API keys to <code style={{ color: "var(--accent)" }}>.env</code> (never commit real keys)</li>
          <li>Create a new router at <code style={{ color: "var(--accent)" }}>backend/app/routers/live_trading.py</code></li>
          <li>Add safety checks: confirmation dialogs, position limits, kill switches</li>
          <li>Test extensively with broker sandbox/paper accounts first</li>
        </ol>
        <p
          className="text-xs mt-3 font-bold"
          style={{
            color: "var(--yellow)",
            padding: ".5rem .75rem",
            background: "rgba(234, 179, 8, 0.08)",
            borderRadius: ".375rem",
            border: "1px solid rgba(234, 179, 8, 0.2)",
          }}
        >
          WARNING: Live trading carries real financial risk. Proceed with extreme caution.
        </p>
      </div>

      {/* System Info */}
      <div className="card">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>System Info</h2>
        <div
          className="text-xs"
          style={{ color: "var(--muted)", display: "flex", flexDirection: "column", gap: ".375rem" }}
        >
          {[
            ["Frontend", "Next.js + TypeScript + Tailwind CSS"],
            ["Backend", "FastAPI + Python"],
            ["Database", "SQLite"],
            ["Charts", "Recharts"],
            ["Data", "Yahoo Finance (yfinance)"],
          ].map(([key, val]) => (
            <div key={key} className="flex justify-between">
              <span>{key}</span>
              <span style={{ color: "var(--foreground)" }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
