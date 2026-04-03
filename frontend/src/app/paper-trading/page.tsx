"use client";

/**
 * Paper Trading Page.
 *
 * Simulated trading interface where users can:
 * - Place buy/sell orders
 * - View portfolio positions
 * - Track trade history
 * - Monitor account equity
 *
 * NO real money is involved. This is purely educational.
 */

import { useEffect, useState, useCallback } from "react";
import {
  fetchPortfolio,
  fetchPaperTrades,
  fetchSymbols,
  placeOrder,
  resetPortfolio,
  PortfolioSummary,
  PaperTrade,
} from "@/lib/api";
import MetricCard from "@/components/MetricCard";
import { useI18n } from "@/lib/i18n";

export default function PaperTradingPage() {
  const { t } = useI18n();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Order form
  const [orderSymbol, setOrderSymbol] = useState("AAPL");
  const [orderSide, setOrderSide] = useState<"buy" | "sell">("buy");
  const [orderQuantity, setOrderQuantity] = useState(10);
  const [orderMessage, setOrderMessage] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [pf, tr, sy] = await Promise.all([
        fetchPortfolio(1),
        fetchPaperTrades(1, 50),
        fetchSymbols(),
      ]);
      setPortfolio(pf);
      setTrades(tr.trades);
      setSymbols(sy.symbols);
    } catch {
      // Backend might not be running
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePlaceOrder = async () => {
    setOrderLoading(true);
    setOrderMessage("");
    try {
      const result = await placeOrder({
        portfolio_id: 1,
        symbol: orderSymbol,
        side: orderSide,
        quantity: orderQuantity,
      });
      if (result.status === "filled") {
        setOrderMessage(
          `${result.side?.toUpperCase()} ${result.quantity} shares of ${result.symbol} at $${result.fill_price?.toFixed(2)}`
        );
      } else {
        setOrderMessage(result.message || "Order processed");
      }
      await loadData();
    } catch (e: unknown) {
      setOrderMessage(e instanceof Error ? e.message : "Order failed");
    } finally {
      setOrderLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm(t("pt_reset_confirm"))) return;
    try {
      await resetPortfolio(1);
      await loadData();
      setOrderMessage(t("pt_reset_ok"));
    } catch {
      setOrderMessage("Reset failed");
    }
  };

  if (loading) {
    return (
      <div className="text-center" style={{ padding: "3rem 0", color: "var(--muted)" }}>
        {t("loading")}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("pt_title")}</h1>
        <button onClick={handleReset} className="btn-secondary text-xs">{t("pt_reset")}</button>
      </div>

      {/* Disclaimer */}
      <div
        className="text-xs mb-4"
        style={{
          background: "rgba(234, 179, 8, 0.1)",
          border: "1px solid var(--yellow)",
          color: "var(--yellow)",
          padding: ".625rem 1rem",
          borderRadius: ".5rem",
        }}
      >
        {t("pt_disclaimer")}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Order Entry + Portfolio Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Portfolio Summary */}
          {portfolio && !portfolio.error && (
            <div className="grid-2">
              <MetricCard label={t("total_equity")} value={`$${portfolio.total_equity.toLocaleString()}`} />
              <MetricCard label={t("cash")} value={`$${portfolio.cash.toLocaleString()}`} />
              <MetricCard label={t("positions_val")} value={`$${portfolio.positions_value.toLocaleString()}`} />
              <MetricCard label={t("total_return")} value={portfolio.total_return_pct} suffix="%" positive={portfolio.total_return_pct >= 0} />
            </div>
          )}

          {/* Order Entry */}
          <div className="card">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>{t("pt_place_order")}</h2>

            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>{t("symbol")}</label>
            <select value={orderSymbol} onChange={(e) => setOrderSymbol(e.target.value)} className="select-field mb-3">
              {symbols.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>{t("pt_side")}</label>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setOrderSide("buy")}
                style={{
                  flex: 1,
                  padding: ".5rem",
                  borderRadius: ".5rem",
                  border: "none",
                  fontWeight: 700,
                  fontSize: ".875rem",
                  cursor: "pointer",
                  background: orderSide === "buy" ? "var(--green)" : "var(--card-border)",
                  color: "white",
                  transition: "background .15s",
                }}
              >
                BUY
              </button>
              <button
                onClick={() => setOrderSide("sell")}
                style={{
                  flex: 1,
                  padding: ".5rem",
                  borderRadius: ".5rem",
                  border: "none",
                  fontWeight: 700,
                  fontSize: ".875rem",
                  cursor: "pointer",
                  background: orderSide === "sell" ? "var(--red)" : "var(--card-border)",
                  color: "white",
                  transition: "background .15s",
                }}
              >
                SELL
              </button>
            </div>

            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>{t("pt_qty")}</label>
            <input
              type="number"
              value={orderQuantity}
              onChange={(e) => setOrderQuantity(Number(e.target.value))}
              min={1}
              className="input-field mb-3"
            />

            <button onClick={handlePlaceOrder} disabled={orderLoading} className="btn-primary" style={{ width: "100%" }}>
              {orderLoading ? t("pt_placing") : `${orderSide.toUpperCase()} ${orderQuantity} ${orderSymbol}`}
            </button>

            {orderMessage && (
              <p className="text-xs mt-2" style={{ color: "var(--accent)" }}>{orderMessage}</p>
            )}
          </div>
        </div>

        {/* Middle: Positions */}
        <div className="card">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>
            {t("pt_open_pos")} <span className="font-normal">({portfolio?.positions.length || 0})</span>
          </h2>
          {(!portfolio?.positions || portfolio.positions.length === 0) ? (
            <p className="text-xs" style={{ color: "var(--muted)" }}>{t("pt_no_pos")}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
              {portfolio.positions.map((pos) => (
                <div
                  key={pos.id}
                  style={{
                    background: "var(--background)",
                    borderRadius: ".5rem",
                    padding: ".625rem .75rem",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm">{pos.symbol}</span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: pos.unrealized_pnl >= 0 ? "var(--green)" : "var(--red)" }}
                    >
                      {pos.unrealized_pnl >= 0 ? "+" : ""}${pos.unrealized_pnl.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
                    <span>{pos.shares} shares @ ${pos.avg_entry_price.toFixed(2)}</span>
                    <span>${pos.market_value.toFixed(0)}</span>
                  </div>
                  <div
                    className="text-xs mt-1 font-semibold"
                    style={{ color: pos.unrealized_pnl_pct >= 0 ? "var(--green)" : "var(--red)" }}
                  >
                    {pos.unrealized_pnl_pct >= 0 ? "+" : ""}{pos.unrealized_pnl_pct.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Trade History */}
        <div className="card">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>
            {t("pt_trade_hist")} <span className="font-normal">({trades.length})</span>
          </h2>
          <div style={{ maxHeight: "24rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: ".25rem" }}>
            {trades.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--muted)" }}>{t("pt_no_trades")}</p>
            ) : (
              trades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex justify-between items-center text-xs"
                  style={{
                    padding: ".375rem .25rem",
                    borderBottom: "1px solid var(--card-border)",
                  }}
                >
                  <div>
                    <span style={{ color: trade.side === "buy" ? "var(--green)" : "var(--red)", fontWeight: 700 }}>
                      {trade.side.toUpperCase()}
                    </span>
                    <span className="ml-1" style={{ color: "var(--foreground)" }}>
                      {trade.shares} {trade.symbol}
                    </span>
                  </div>
                  <div className="text-right">
                    <div style={{ color: "var(--foreground)" }}>${trade.price.toFixed(2)}</div>
                    {trade.pnl !== null && (
                      <div style={{ color: trade.pnl >= 0 ? "var(--green)" : "var(--red)" }}>
                        {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
