"use client";

/**
 * Backtest Page — the core tool for testing strategies.
 *
 * Users can:
 * 1. Select a strategy and configure parameters
 * 2. Choose a symbol and date range
 * 3. Set backtest options (capital, costs, risk rules)
 * 4. Run the backtest and view results
 * 5. See equity curve, drawdown, trade log, and metrics
 * 6. Export results or save to leaderboard
 */

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchStrategies,
  fetchSymbols,
  runBacktest,
  addToLeaderboard,
  StrategyInfo,
  BacktestResult,
} from "@/lib/api";
import MetricCard from "@/components/MetricCard";
import EquityCurve from "@/components/charts/EquityCurve";
import DrawdownChart from "@/components/charts/DrawdownChart";
import PriceChart from "@/components/charts/PriceChart";

export default function BacktestPage() {
  return (
    <Suspense fallback={<div style={{ color: "var(--muted)" }}>Loading...</div>}>
      <BacktestContent />
    </Suspense>
  );
}

function BacktestContent() {
  const searchParams = useSearchParams();
  const preselectedStrategy = searchParams.get("strategy") || "";

  // Form state
  const [strategies, setStrategies] = useState<StrategyInfo[]>([]);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [strategyName, setStrategyName] = useState(preselectedStrategy || "ma_crossover");
  const [symbol, setSymbol] = useState("AAPL");
  const [startDate, setStartDate] = useState("2022-01-01");
  const [endDate, setEndDate] = useState("2024-12-31");
  const [initialCapital, setInitialCapital] = useState(100000);
  const [commissionPct, setCommissionPct] = useState(0.001);
  const [slippagePct, setSlippagePct] = useState(0.0005);
  const [positionSizePct, setPositionSizePct] = useState(10);
  const [stopLossPct, setStopLossPct] = useState<string>("");
  const [takeProfitPct, setTakeProfitPct] = useState<string>("");
  const [maxPositions, setMaxPositions] = useState(5);
  const [strategyParams, setStrategyParams] = useState<Record<string, unknown>>({});

  // Results
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  // Load strategies and symbols
  useEffect(() => {
    Promise.all([fetchStrategies(), fetchSymbols()])
      .then(([strats, syms]) => {
        setStrategies(strats.strategies);
        setSymbols(syms.symbols);
        if (preselectedStrategy) setStrategyName(preselectedStrategy);
      })
      .catch(() => {});
  }, [preselectedStrategy]);

  // Update default params when strategy changes
  useEffect(() => {
    const strat = strategies.find((s) => s.name === strategyName);
    if (strat?.default_params) {
      setStrategyParams({ ...strat.default_params });
    }
  }, [strategyName, strategies]);

  const currentStrategy = strategies.find((s) => s.name === strategyName);

  const handleRun = async () => {
    setRunning(true);
    setError("");
    setResult(null);
    setSaveMsg("");
    try {
      const res = await runBacktest({
        strategy_name: strategyName,
        symbol: symbol.toUpperCase(),
        start_date: startDate,
        end_date: endDate,
        params: strategyParams,
        initial_capital: initialCapital,
        commission_pct: commissionPct,
        slippage_pct: slippagePct,
        position_size_pct: positionSizePct,
        stop_loss_pct: stopLossPct ? parseFloat(stopLossPct) : null,
        take_profit_pct: takeProfitPct ? parseFloat(takeProfitPct) : null,
        max_positions: maxPositions,
        benchmark_symbol: "SPY",
      });
      if (res.error) {
        setError(res.error);
      } else {
        setResult(res);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Backtest failed");
    } finally {
      setRunning(false);
    }
  };

  const handleSaveToLeaderboard = async () => {
    if (!result?.metrics) return;
    const name = prompt("Enter a name for this run:");
    if (!name) return;
    try {
      await addToLeaderboard({
        run_name: name,
        strategy_name: strategyName,
        symbol: symbol.toUpperCase(),
        params: strategyParams,
        start_date: startDate,
        end_date: endDate,
        total_return: result.metrics.total_return,
        sharpe_ratio: result.metrics.sharpe_ratio,
        max_drawdown: result.metrics.max_drawdown,
        win_rate: result.metrics.win_rate,
        num_trades: result.metrics.num_trades,
      });
      setSaveMsg("Saved to leaderboard!");
    } catch {
      setSaveMsg("Failed to save");
    }
  };

  const handleExportTrades = () => {
    if (!result?.trades) return;
    const header = "date,side,price,shares,commission,pnl,pnl_pct,reason\n";
    const rows = result.trades.map((t) =>
      `${t.date},${t.side},${t.price},${t.shares},${t.commission},${t.pnl},${t.pnl_pct},${t.reason}`
    ).join("\n");
    downloadCSV(header + rows, `trades_${strategyName}_${symbol}.csv`);
  };

  const handleExportEquity = () => {
    if (!result?.equity_curve) return;
    const header = "date,equity,cash,positions_value\n";
    const rows = result.equity_curve.map((e) =>
      `${e.date},${e.equity},${e.cash},${e.positions_value}`
    ).join("\n");
    downloadCSV(header + rows, `equity_${strategyName}_${symbol}.csv`);
  };

  const handleExportJSON = () => {
    if (!result?.metrics) return;
    const data = JSON.stringify({
      strategy: strategyName,
      symbol,
      params: strategyParams,
      start_date: startDate,
      end_date: endDate,
      metrics: result.metrics,
    }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backtest_${strategyName}_${symbol}.json`;
    a.click();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Strategy Backtest</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel: Configuration */}
        <div className="lg:col-span-1 space-y-4">
          {/* Strategy Selection */}
          <div className="card">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>Strategy</h2>
            <select
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              className="select-field mb-3"
            >
              {strategies.map((s) => (
                <option key={s.name} value={s.name}>{s.display_name}</option>
              ))}
            </select>

            {/* Dynamic Strategy Parameters */}
            {currentStrategy?.parameters.map((param) => (
              <div key={param.name} className="mb-2">
                <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>
                  {param.name} ({param.description})
                </label>
                {param.type === "select" ? (
                  <select
                    value={String(strategyParams[param.name] ?? param.default)}
                    onChange={(e) => setStrategyParams({ ...strategyParams, [param.name]: e.target.value })}
                    className="select-field"
                  >
                    {param.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : param.type === "bool" ? (
                  <select
                    value={String(strategyParams[param.name] ?? param.default)}
                    onChange={(e) => setStrategyParams({ ...strategyParams, [param.name]: e.target.value === "true" })}
                    className="select-field"
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <input
                    type="number"
                    value={strategyParams[param.name] as number ?? param.default as number}
                    onChange={(e) => setStrategyParams({ ...strategyParams, [param.name]: parseFloat(e.target.value) })}
                    min={param.min}
                    max={param.max}
                    step={param.type === "float" ? 0.1 : 1}
                    className="input-field"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Symbol & Date Range */}
          <div className="card">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>Data</h2>
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>Symbol</label>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="select-field mb-2">
              {symbols.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field mb-2" />
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" />
          </div>

          {/* Backtest Settings */}
          <div className="card">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>Settings</h2>
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>Initial Capital ($)</label>
            <input type="number" value={initialCapital} onChange={(e) => setInitialCapital(Number(e.target.value))} className="input-field mb-2" />
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>Commission (%)</label>
            <input type="number" value={commissionPct} step={0.0001} onChange={(e) => setCommissionPct(Number(e.target.value))} className="input-field mb-2" />
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>Slippage (%)</label>
            <input type="number" value={slippagePct} step={0.0001} onChange={(e) => setSlippagePct(Number(e.target.value))} className="input-field mb-2" />
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>Position Size (%)</label>
            <input type="number" value={positionSizePct} onChange={(e) => setPositionSizePct(Number(e.target.value))} className="input-field mb-2" />
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>Max Positions</label>
            <input type="number" value={maxPositions} onChange={(e) => setMaxPositions(Number(e.target.value))} className="input-field mb-2" />
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>Stop Loss % (optional)</label>
            <input type="text" value={stopLossPct} onChange={(e) => setStopLossPct(e.target.value)} placeholder="e.g., 5" className="input-field mb-2" />
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>Take Profit % (optional)</label>
            <input type="text" value={takeProfitPct} onChange={(e) => setTakeProfitPct(e.target.value)} placeholder="e.g., 15" className="input-field" />
          </div>

          <button onClick={handleRun} disabled={running} className="btn-primary w-full text-center py-3">
            {running ? "Running Backtest..." : "Run Backtest"}
          </button>
        </div>

        {/* Right Panel: Results */}
        <div className="lg:col-span-3">
          {error && (
            <div className="card mb-4" style={{ borderColor: "var(--red)" }}>
              <p style={{ color: "var(--red)" }}>{error}</p>
            </div>
          )}

          {!result && !running && !error && (
            <div className="card text-center py-16" style={{ color: "var(--muted)" }}>
              Configure your backtest on the left and click &quot;Run Backtest&quot; to see results here.
            </div>
          )}

          {running && (
            <div className="card text-center py-16" style={{ color: "var(--accent)" }}>
              Running backtest... This may take a few seconds.
            </div>
          )}

          {result && result.metrics && (
            <div className="space-y-4">
              {/* Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard label="Total Return" value={result.metrics.total_return} suffix="%" positive={result.metrics.total_return >= 0} />
                <MetricCard label="Sharpe Ratio" value={result.metrics.sharpe_ratio} positive={result.metrics.sharpe_ratio > 0.5 ? true : result.metrics.sharpe_ratio < 0 ? false : null} />
                <MetricCard label="Max Drawdown" value={result.metrics.max_drawdown} suffix="%" positive={false} />
                <MetricCard label="Win Rate" value={result.metrics.win_rate} suffix="%" positive={result.metrics.win_rate > 50 ? true : null} />
                <MetricCard label="Annual Return" value={result.metrics.annualized_return} suffix="%" positive={result.metrics.annualized_return >= 0} />
                <MetricCard label="Sortino Ratio" value={result.metrics.sortino_ratio} />
                <MetricCard label="Profit Factor" value={result.metrics.profit_factor} positive={result.metrics.profit_factor > 1 ? true : result.metrics.profit_factor < 1 ? false : null} />
                <MetricCard label="# Trades" value={result.metrics.num_trades} />
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <button onClick={handleSaveToLeaderboard} className="btn-secondary text-xs">Save to Leaderboard</button>
                <button onClick={handleExportTrades} className="btn-secondary text-xs">Export Trades CSV</button>
                <button onClick={handleExportEquity} className="btn-secondary text-xs">Export Equity CSV</button>
                <button onClick={handleExportJSON} className="btn-secondary text-xs">Export Summary JSON</button>
                {saveMsg && <span className="text-xs self-center" style={{ color: "var(--green)" }}>{saveMsg}</span>}
              </div>

              {/* Equity Curve */}
              <div className="card">
                <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--muted)" }}>Equity Curve</h3>
                <EquityCurve
                  data={result.equity_curve}
                  benchmarkData={result.benchmark}
                  initialCapital={initialCapital}
                />
              </div>

              {/* Drawdown */}
              <div className="card">
                <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--muted)" }}>Drawdown</h3>
                <DrawdownChart data={result.equity_curve} />
              </div>

              {/* Price with signals */}
              <div className="card">
                <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--muted)" }}>Price Chart with Signals</h3>
                <PriceChart
                  data={result.equity_curve.map((e) => ({ ...e, close: e.equity }))}
                  trades={result.trades}
                  height={300}
                />
              </div>

              {/* Trade Log */}
              <div className="card">
                <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--muted)" }}>
                  Trade Log ({result.trades.length} trades)
                </h3>
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0" style={{ background: "var(--card-bg)" }}>
                      <tr style={{ color: "var(--muted)" }}>
                        <th className="text-left py-1 px-2">Date</th>
                        <th className="text-left py-1 px-2">Side</th>
                        <th className="text-right py-1 px-2">Price</th>
                        <th className="text-right py-1 px-2">Shares</th>
                        <th className="text-right py-1 px-2">Commission</th>
                        <th className="text-right py-1 px-2">P&L</th>
                        <th className="text-right py-1 px-2">P&L %</th>
                        <th className="text-left py-1 px-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.trades.map((trade, i) => (
                        <tr key={i} className="border-b" style={{ borderColor: "var(--card-border)" }}>
                          <td className="py-1 px-2">{trade.date}</td>
                          <td className="py-1 px-2" style={{ color: trade.side === "buy" ? "var(--green)" : "var(--red)" }}>
                            {trade.side.toUpperCase()}
                          </td>
                          <td className="py-1 px-2 text-right">${trade.price.toFixed(2)}</td>
                          <td className="py-1 px-2 text-right">{trade.shares}</td>
                          <td className="py-1 px-2 text-right">${trade.commission.toFixed(2)}</td>
                          <td className="py-1 px-2 text-right" style={{ color: trade.pnl >= 0 ? "var(--green)" : "var(--red)" }}>
                            {trade.side === "sell" ? `$${trade.pnl.toFixed(2)}` : "—"}
                          </td>
                          <td className="py-1 px-2 text-right" style={{ color: trade.pnl_pct >= 0 ? "var(--green)" : "var(--red)" }}>
                            {trade.side === "sell" ? `${trade.pnl_pct.toFixed(2)}%` : "—"}
                          </td>
                          <td className="py-1 px-2">{trade.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="card">
                <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--muted)" }}>Detailed Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {Object.entries(result.metrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between p-1 border-b" style={{ borderColor: "var(--card-border)" }}>
                      <span style={{ color: "var(--muted)" }}>{key.replace(/_/g, " ")}</span>
                      <span>{typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: 3 }) : value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}
