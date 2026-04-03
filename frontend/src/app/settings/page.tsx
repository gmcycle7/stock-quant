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

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Backend Status */}
      <div className="card mb-4">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>Backend Connection</h2>
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: backendStatus === "Connected" ? "var(--green)" : "var(--red)" }}
          />
          <span>{backendStatus}</span>
        </div>
        <p className="text-xs" style={{ color: "var(--muted)" }}>{backendMessage}</p>
        <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
          API URL: {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
        </p>
      </div>

      {/* Default Parameters */}
      <div className="card mb-4">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>Default Parameters</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: "var(--muted)" }}>Initial Capital</span>
            <span>$100,000</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--muted)" }}>Commission</span>
            <span>0.1%</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--muted)" }}>Slippage</span>
            <span>0.05%</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--muted)" }}>Data Provider</span>
            <span>Yahoo Finance (yfinance)</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--muted)" }}>Benchmark</span>
            <span>SPY (S&P 500)</span>
          </div>
        </div>
      </div>

      {/* API Notes for Future Brokerage Integration */}
      <div className="card mb-4">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>
          Future: Brokerage Integration
        </h2>
        <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
          This platform currently supports paper trading only. To add live brokerage integration
          in the future, you would:
        </p>
        <ol className="text-xs list-decimal list-inside space-y-1" style={{ color: "var(--muted)" }}>
          <li>Create a new module at <code>backend/quant/broker/</code></li>
          <li>Implement an adapter interface for your broker (e.g., Alpaca, Interactive Brokers)</li>
          <li>Add API keys to <code>.env</code> (never commit real keys)</li>
          <li>Create a new router at <code>backend/app/routers/live_trading.py</code></li>
          <li>Add safety checks: confirmation dialogs, position limits, kill switches</li>
          <li>Test extensively with broker sandbox/paper accounts first</li>
        </ol>
        <p className="text-xs mt-2 font-bold" style={{ color: "var(--yellow)" }}>
          WARNING: Live trading carries real financial risk. Proceed with extreme caution.
        </p>
      </div>

      {/* System Info */}
      <div className="card">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>System Info</h2>
        <div className="space-y-1 text-xs" style={{ color: "var(--muted)" }}>
          <p>Frontend: Next.js + TypeScript + Tailwind CSS</p>
          <p>Backend: FastAPI + Python</p>
          <p>Database: SQLite</p>
          <p>Charts: Recharts</p>
          <p>Data: Yahoo Finance (yfinance)</p>
        </div>
      </div>
    </div>
  );
}
