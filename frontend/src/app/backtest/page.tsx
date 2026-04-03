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
import { useI18n } from "@/lib/i18n";

export default function BacktestPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<div style={{ color: "var(--muted)" }}>{t("loading")}</div>}>
      <BacktestContent />
    </Suspense>
  );
}

function BacktestContent() {
  const { t } = useI18n();
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
      <h1 className="text-2xl font-bold mb-6">{t("bt_title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel: Configuration */}
        <div className="lg:col-span-1" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Strategy Selection */}
          <div className="card">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>{t("bt_strategy")}</h2>
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
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>{t("bt_data")}</h2>
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>{t("symbol")}</label>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="select-field mb-2">
              {symbols.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>{t("bt_start")}</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field mb-2" />
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>{t("bt_end")}</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" />
          </div>

          {/* Backtest Settings */}
          <div className="card">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>{t("bt_settings")}</h2>
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>{t("bt_capital")}</label>
            <input type="number" value={initialCapital} onChange={(e) => setInitialCapital(Number(e.target.value))} className="input-field mb-2" />
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>{t("bt_commission")}</label>
            <input type="number" value={commissionPct} step={0.0001} onChange={(e) => setCommissionPct(Number(e.target.value))} className="input-field mb-2" />
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>{t("bt_slippage")}</label>
            <input type="number" value={slippagePct} step={0.0001} onChange={(e) => setSlippagePct(Number(e.target.value))} className="input-field mb-2" />
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>{t("bt_pos_size")}</label>
            <input type="number" value={positionSizePct} onChange={(e) => setPositionSizePct(Number(e.target.value))} className="input-field mb-2" />
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>{t("bt_max_pos")}</label>
            <input type="number" value={maxPositions} onChange={(e) => setMaxPositions(Number(e.target.value))} className="input-field mb-2" />
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>{t("bt_stop_loss")}</label>
            <input type="text" value={stopLossPct} onChange={(e) => setStopLossPct(e.target.value)} placeholder="e.g., 5" className="input-field mb-2" />
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>{t("bt_take_profit")}</label>
            <input type="text" value={takeProfitPct} onChange={(e) => setTakeProfitPct(e.target.value)} placeholder="e.g., 15" className="input-field" />
          </div>

          <button onClick={handleRun} disabled={running} className="btn-primary" style={{ width: "100%", padding: ".75rem 1rem", textAlign: "center" }}>
            {running ? t("bt_running") : t("bt_run")}
          </button>
        </div>

        {/* Right Panel: Results */}
        <div className="lg:col-span-3" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && (
            <div className="card" style={{ borderColor: "var(--red)" }}>
              <p style={{ color: "var(--red)" }}>{error}</p>
            </div>
          )}

          {!result && !running && !error && (
            <div className="card text-center" style={{ padding: "4rem 2rem", color: "var(--muted)" }}>
              {t("bt_placeholder")}
            </div>
          )}

          {running && (
            <div className="card text-center" style={{ padding: "4rem 2rem", color: "var(--accent)" }}>
              {t("bt_running_msg")}
            </div>
          )}

          {result && result.metrics && (
            <>
              {/* Metric Cards */}
              <div className="grid-4">
                <MetricCard label={t("total_return")} value={result.metrics.total_return} suffix="%" positive={result.metrics.total_return >= 0} />
                <MetricCard label={t("sharpe_ratio")} value={result.metrics.sharpe_ratio} positive={result.metrics.sharpe_ratio > 0.5 ? true : result.metrics.sharpe_ratio < 0 ? false : null} />
                <MetricCard label={t("max_drawdown")} value={result.metrics.max_drawdown} suffix="%" positive={false} />
                <MetricCard label={t("win_rate")} value={result.metrics.win_rate} suffix="%" positive={result.metrics.win_rate > 50 ? true : null} />
                <MetricCard label={t("annual_return")} value={result.metrics.annualized_return} suffix="%" positive={result.metrics.annualized_return >= 0} />
                <MetricCard label={t("sortino_ratio")} value={result.metrics.sortino_ratio} />
                <MetricCard label={t("profit_factor")} value={result.metrics.profit_factor} positive={result.metrics.profit_factor > 1 ? true : result.metrics.profit_factor < 1 ? false : null} />
                <MetricCard label={t("num_trades")} value={result.metrics.num_trades} />
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <button onClick={handleSaveToLeaderboard} className="btn-secondary text-xs">{t("bt_save_lb")}</button>
                <button onClick={handleExportTrades} className="btn-secondary text-xs">{t("bt_export_trades")}</button>
                <button onClick={handleExportEquity} className="btn-secondary text-xs">{t("bt_export_equity")}</button>
                <button onClick={handleExportJSON} className="btn-secondary text-xs">{t("bt_export_json")}</button>
                {saveMsg && (
                  <span className="text-xs self-center" style={{ color: "var(--green)" }}>{saveMsg}</span>
                )}
              </div>

              {/* Equity Curve */}
              <div className="card">
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>{t("bt_equity_curve")}</h3>
                <EquityCurve
                  data={result.equity_curve}
                  benchmarkData={result.benchmark}
                  initialCapital={initialCapital}
                />
              </div>

              {/* Drawdown */}
              <div className="card">
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>{t("bt_drawdown")}</h3>
                <DrawdownChart data={result.equity_curve} />
              </div>

              {/* Price with signals */}
              <div className="card">
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>{t("bt_price_signals")}</h3>
                <PriceChart
                  data={result.equity_curve.map((e) => ({ ...e, close: e.equity }))}
                  trades={result.trades}
                  height={300}
                />
              </div>

              {/* Trade Log */}
              <div className="card">
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>
                  {t("bt_trade_log")} <span className="font-normal">({result.trades.length} {t("bt_trades_count")})</span>
                </h3>
                <div className="overflow-x-auto" style={{ maxHeight: "20rem", overflowY: "auto" }}>
                  <table className="data-table">
                    <thead style={{ position: "sticky", top: 0, background: "var(--card-bg)" }}>
                      <tr>
                        <th>{t("col_date")}</th>
                        <th>{t("col_side")}</th>
                        <th style={{ textAlign: "right" }}>{t("col_price")}</th>
                        <th style={{ textAlign: "right" }}>{t("col_shares")}</th>
                        <th style={{ textAlign: "right" }}>{t("col_commission")}</th>
                        <th style={{ textAlign: "right" }}>{t("col_pnl")}</th>
                        <th style={{ textAlign: "right" }}>{t("col_pnl_pct")}</th>
                        <th>{t("col_reason")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.trades.map((trade, i) => (
                        <tr key={i}>
                          <td>{trade.date}</td>
                          <td style={{ color: trade.side === "buy" ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
                            {trade.side.toUpperCase()}
                          </td>
                          <td style={{ textAlign: "right" }}>${trade.price.toFixed(2)}</td>
                          <td style={{ textAlign: "right" }}>{trade.shares}</td>
                          <td style={{ textAlign: "right" }}>${trade.commission.toFixed(2)}</td>
                          <td style={{ textAlign: "right", color: trade.pnl >= 0 ? "var(--green)" : "var(--red)" }}>
                            {trade.side === "sell" ? `$${trade.pnl.toFixed(2)}` : "—"}
                          </td>
                          <td style={{ textAlign: "right", color: trade.pnl_pct >= 0 ? "var(--green)" : "var(--red)" }}>
                            {trade.side === "sell" ? `${trade.pnl_pct.toFixed(2)}%` : "—"}
                          </td>
                          <td>{trade.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="card">
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>{t("bt_detail_metrics")}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {Object.entries(result.metrics).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between"
                      style={{
                        padding: ".3rem .5rem",
                        borderBottom: "1px solid var(--card-border)",
                      }}
                    >
                      <span style={{ color: "var(--muted)" }}>{key.replace(/_/g, " ")}</span>
                      <span style={{ fontWeight: 600 }}>
                        {typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: 3 }) : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
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
