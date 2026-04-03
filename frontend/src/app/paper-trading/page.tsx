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

export default function PaperTradingPage() {
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
    if (!confirm("Reset portfolio to initial state? All positions and trades will be deleted.")) return;
    try {
      await resetPortfolio(1);
      await loadData();
      setOrderMessage("Portfolio reset successfully");
    } catch {
      setOrderMessage("Reset failed");
    }
  };

  if (loading) return <div className="text-center py-12" style={{ color: "var(--muted)" }}>Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Paper Trading</h1>
        <button onClick={handleReset} className="btn-secondary text-xs">Reset Portfolio</button>
      </div>

      {/* Disclaimer */}
      <div className="text-xs mb-4 p-2 rounded" style={{ background: "#1c1917", color: "var(--yellow)" }}>
        This is simulated trading with fake money. No real orders are placed.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Order Entry + Portfolio Summary */}
        <div className="space-y-4">
          {/* Portfolio Summary */}
          {portfolio && !portfolio.error && (
            <div className="grid grid-cols-2 gap-2">
              <MetricCard label="Total Equity" value={`$${portfolio.total_equity.toLocaleString()}`} />
              <MetricCard label="Cash" value={`$${portfolio.cash.toLocaleString()}`} />
              <MetricCard label="Positions" value={`$${portfolio.positions_value.toLocaleString()}`} />
              <MetricCard label="Return" value={portfolio.total_return_pct} suffix="%" positive={portfolio.total_return_pct >= 0} />
            </div>
          )}

          {/* Order Entry */}
          <div className="card">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>Place Order</h2>

            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>Symbol</label>
            <select value={orderSymbol} onChange={(e) => setOrderSymbol(e.target.value)} className="select-field mb-2">
              {symbols.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>Side</label>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setOrderSide("buy")}
                className="flex-1 py-2 rounded text-sm font-bold"
                style={{
                  background: orderSide === "buy" ? "var(--green)" : "var(--card-border)",
                  color: "white",
                }}
              >
                BUY
              </button>
              <button
                onClick={() => setOrderSide("sell")}
                className="flex-1 py-2 rounded text-sm font-bold"
                style={{
                  background: orderSide === "sell" ? "var(--red)" : "var(--card-border)",
                  color: "white",
                }}
              >
                SELL
              </button>
            </div>

            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>Quantity (shares)</label>
            <input
              type="number"
              value={orderQuantity}
              onChange={(e) => setOrderQuantity(Number(e.target.value))}
              min={1}
              className="input-field mb-3"
            />

            <button onClick={handlePlaceOrder} disabled={orderLoading} className="btn-primary w-full">
              {orderLoading ? "Placing..." : `${orderSide.toUpperCase()} ${orderQuantity} ${orderSymbol}`}
            </button>

            {orderMessage && (
              <p className="text-xs mt-2" style={{ color: "var(--accent)" }}>{orderMessage}</p>
            )}
          </div>
        </div>

        {/* Middle: Positions */}
        <div className="card">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>
            Open Positions ({portfolio?.positions.length || 0})
          </h2>
          {(!portfolio?.positions || portfolio.positions.length === 0) ? (
            <p className="text-xs" style={{ color: "var(--muted)" }}>No open positions</p>
          ) : (
            <div className="space-y-2">
              {portfolio.positions.map((pos) => (
                <div key={pos.id} className="p-2 rounded" style={{ background: "var(--background)" }}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">{pos.symbol}</span>
                    <span className="text-xs" style={{ color: pos.unrealized_pnl >= 0 ? "var(--green)" : "var(--red)" }}>
                      {pos.unrealized_pnl >= 0 ? "+" : ""}${pos.unrealized_pnl.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs mt-1" style={{ color: "var(--muted)" }}>
                    <span>{pos.shares} shares @ ${pos.avg_entry_price.toFixed(2)}</span>
                    <span>${pos.market_value.toFixed(0)}</span>
                  </div>
                  <div className="text-xs mt-1" style={{ color: pos.unrealized_pnl_pct >= 0 ? "var(--green)" : "var(--red)" }}>
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
            Trade History ({trades.length})
          </h2>
          <div className="max-h-96 overflow-y-auto space-y-1">
            {trades.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--muted)" }}>No trades yet</p>
            ) : (
              trades.map((trade) => (
                <div key={trade.id} className="flex justify-between items-center text-xs p-1 border-b" style={{ borderColor: "var(--card-border)" }}>
                  <div>
                    <span style={{ color: trade.side === "buy" ? "var(--green)" : "var(--red)" }}>
                      {trade.side.toUpperCase()}
                    </span>
                    <span className="ml-1">{trade.shares} {trade.symbol}</span>
                  </div>
                  <div className="text-right">
                    <div>${trade.price.toFixed(2)}</div>
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
